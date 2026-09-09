import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const YANDEX_DELIVERY_BASE_URL = "https://b2b.taxi.yandex.net/b2b/cargo/integration/v2";
const YANDEX_PLATFORM_BASE_URL = "https://b2b.taxi.yandex.net/api/b2b/platform";

// Города с известным geo_id Яндекса — по ним ищем пункты выдачи.
export const PICKUP_CITIES: { name: string; geoId: number }[] = [
  { name: "Москва", geoId: 213 },
  { name: "Санкт-Петербург", geoId: 2 },
  { name: "Новосибирск", geoId: 65 },
  { name: "Екатеринбург", geoId: 54 },
  { name: "Казань", geoId: 43 },
  { name: "Нижний Новгород", geoId: 47 },
  { name: "Челябинск", geoId: 56 },
  { name: "Самара", geoId: 51 },
  { name: "Уфа", geoId: 172 },
  { name: "Ростов-на-Дону", geoId: 39 },
  { name: "Краснодар", geoId: 35 },
  { name: "Пермь", geoId: 50 },
  { name: "Воронеж", geoId: 193 },
  { name: "Волгоград", geoId: 38 },
  { name: "Тюмень", geoId: 55 },
];

// Наши точки самопривоза: посылку сдаём туда сами, курьер за ней не приезжает.
// stationId — идентификатор точки в системе Яндекс Доставки (пункт приёма посылок).
export const DROPOFF_POINTS: {
  name: string;
  address: string;
  stationId: string;
  latitude: number;
  longitude: number;
}[] = [
  {
    name: "Пермь",
    address: "Пермь, улица Революции, 46",
    stationId: "01997c7982d076f6a7ab45de5cb6022a",
    latitude: 58.0002,
    longitude: 56.238,
  },
  {
    name: "Красноярск",
    address: "Красноярск, Ярыгинская набережная, 11",
    stationId: "019a3ac6e95d75aab47ab275da490f16",
    latitude: 55.993,
    longitude: 92.8,
  },
  {
    name: "Москва",
    address: "Москва, улица Маршала Соколовского, 3",
    stationId: "0ddc67f8-3846-419e-a37c-1f50b8e872e0",
    latitude: 55.777,
    longitude: 37.488,
  },
  {
    name: "Александров",
    address: "Александров, улица Гагарина, 23 к1",
    stationId: "c1483c5a-685c-463b-8ca5-d362d63f044f",
    latitude: 56.397,
    longitude: 38.72,
  },
];


// Тарифы: базовый — самый дешёвый, экспресс — быстрее и дороже.
const TARIFF_CLASSES: Record<"standard" | "express", string[]> = {
  standard: ["delivery", "cargo", "courier"],
  express: ["express", "courier"],
};

function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// Ближайшая к покупателю наша точка сдачи — так доставка дешевле.
export function nearestDropoff(target: { latitude: number; longitude: number }) {
  return [...DROPOFF_POINTS].sort(
    (a, b) => distanceKm(a, target) - distanceKm(b, target)
  )[0]!;
}

const pickupPointSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(3),
  latitude: z.number(),
  longitude: z.number(),
});

const tariffSchema = z.enum(["standard", "express"]).default("standard");

const citySearchSchema = z.object({
  query: z.string().min(2),
});

const searchInputSchema = z.object({
  geoId: z.number(),
  query: z.string().optional(),
});

const quantitySchema = z.number().int().min(1).max(50).default(1);

const priceInputSchema = z.object({
  pickupPoint: pickupPointSchema,
  tariff: tariffSchema,
  quantity: quantitySchema,
});

const orderInputSchema = z.object({
  customerName: z.string().min(1, "Укажите имя"),
  customerPhone: z.string().min(6, "Укажите телефон"),
  customerEmail: z.string().email("Укажите корректный e-mail").optional().or(z.literal("")),
  pickupPoint: pickupPointSchema,
  tariff: tariffSchema,
  quantity: quantitySchema,
  comment: z.string().optional(),
  orderNumber: z.string().optional(),
  orderSeq: z.number().optional(),
});


const statusInputSchema = z.object({
  claimId: z.string().min(1),
});


function getAuthHeaders() {
  const token = process.env["YANDEX_DELIVERY_TOKEN"];
  if (!token) {
    throw new Error("Yandex Delivery token is not configured");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Accept-Language": "ru",
    "Content-Type": "application/json",
  };
}

// Реальные параметры посылки с одной колодой: 140×90×50 мм, 317 г.
const PARCEL = {
  lengthCm: 14,
  widthCm: 9,
  heightCm: 5,
  weightGrams: 317,
};

const DECK_PRICE = 3333;

// Габариты и вес зависят от количества колод: укладываем их в компактную коробку,
// подбирая раскладку (по длине/ширине/высоте), а не одну высокую стопку.
function parcelFor(quantity: number) {
  const qty = Math.max(1, Math.round(quantity || 1));
  let best = { l: PARCEL.lengthCm * qty, w: PARCEL.widthCm, h: PARCEL.heightCm, score: Infinity };
  for (let nx = 1; nx <= qty; nx++) {
    for (let ny = 1; ny <= qty; ny++) {
      const nz = Math.ceil(qty / (nx * ny));
      if (nx * ny * nz < qty) continue;
      const l = PARCEL.lengthCm * nx;
      const w = PARCEL.widthCm * ny;
      const h = PARCEL.heightCm * nz;
      // Минимизируем сумму сторон (компактнее коробка) и штрафуем вытянутость.
      const score = l + w + h + Math.max(l, w, h);
      if (score < best.score) best = { l, w, h, score };
    }
  }
  return {
    quantity: qty,
    lengthCm: best.l,
    widthCm: best.w,
    heightCm: best.h,
    weightGrams: PARCEL.weightGrams * qty,
    assessedPrice: DECK_PRICE * qty,
  };
}


function defaultItems(quantity = 1) {
  const parcel = parcelFor(quantity);
  return [
    {
      quantity: parcel.quantity,
      size: {
        length: PARCEL.lengthCm / 100,
        width: PARCEL.widthCm / 100,
        height: PARCEL.heightCm / 100,
      },
      weight: PARCEL.weightGrams / 1000,
    },
  ];
}

// Считаем базовую доставку из конкретной нашей точки сдачи в выбранный ПВЗ.
async function priceFromDropoff(
  dropoff: (typeof DROPOFF_POINTS)[number],
  stationId: string,
  quantity = 1
) {
  const parcel = parcelFor(quantity);
  const response = await fetch(`${YANDEX_PLATFORM_BASE_URL}/pricing-calculator`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      client_price: parcel.assessedPrice,
      total_assessed_price: parcel.assessedPrice,
      total_weight: parcel.weightGrams,
      tariff: "self_pickup",
      source: { platform_station_id: dropoff.stationId },
      destination: { platform_station_id: stationId },
      places: [
        {
          physical_dims: {
            dx: parcel.lengthCm,
            dy: parcel.widthCm,
            dz: parcel.heightCm,
            weight_gross: parcel.weightGrams,
          },
        },
      ],
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error("Yandex pricing-calculator error", dropoff.address, response.status, text);
    return null;
  }

  const result = JSON.parse(text) as { pricing_total?: string; delivery_days?: number };
  const price = Number.parseFloat(String(result.pricing_total ?? "").replace(",", "."));
  if (!Number.isFinite(price)) return null;

  return { price, deliveryDays: result.delivery_days ?? null };
}

// Перебираем все наши точки сдачи и выбираем самую дешёвую доставку до ПВЗ.
export async function cheapestDropoff(
  target: {
    id: string;
    latitude: number;
    longitude: number;
  },
  quantity = 1
) {
  const quotes = await Promise.all(
    DROPOFF_POINTS.map(async (point) => {
      const quote = await priceFromDropoff(point, target.id, quantity);
      return quote ? { point, ...quote } : null;
    })
  );

  const usable = quotes.filter(Boolean) as {
    point: (typeof DROPOFF_POINTS)[number];
    price: number;
    deliveryDays: number | null;
  }[];

  if (usable.length === 0) {
    return { point: nearestDropoff(target), price: null, deliveryDays: null };
  }

  return usable.sort((a, b) => a.price - b.price)[0]!;
}


type RawPickupPoint = {
  id: string;
  name?: string;
  type?: string;
  position?: { latitude: number; longitude: number };
  address?: { full_address?: string; locality?: string; street?: string; house?: string };
  schedule?: unknown;
};

// Номер заказа: сквозной счётчик в базе, покупателю показываем перемешанный код.
export const reserveOrderNumber = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await (supabaseAdmin as any).rpc("next_order_code");

  if (error || !data?.[0]) {
    console.error("next_order_code error", error);
    // Запасной вариант, чтобы оформление не сорвалось.
    return { orderNumber: `RS-${Date.now().toString().slice(-3)}`, orderSeq: null as number | null };
  }

  return { orderNumber: data[0].code as string, orderSeq: data[0].seq as number };
});

// Поиск любого населённого пункта России по названию (город, посёлок, село).
export const searchCities = createServerFn({ method: "POST" })
  .validator((data) => citySearchSchema.parse(data))
  .handler(async ({ data }) => {
    const response = await fetch(`${YANDEX_PLATFORM_BASE_URL}/location/detect`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ location: data.query }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Yandex location detect error", response.status, text);
      throw new Error("Не удалось найти населённый пункт. Попробуйте ещё раз.");
    }

    const result = (await response.json()) as {
      variants?: { geo_id: number; address: string }[];
    };

    return {
      cities: (result.variants ?? []).map((v) => ({ geoId: v.geo_id, name: v.address })),
    };
  });

export const searchPickupPoints = createServerFn({ method: "POST" })
  .validator((data) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const response = await fetch(`${YANDEX_PLATFORM_BASE_URL}/pickup-points/list`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        geo_id: data.geoId,
        payment_method: "already_paid",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Yandex pickup points error", response.status, text);
      throw new Error("Не удалось загрузить пункты выдачи. Попробуйте позже.");
    }

    const result = (await response.json()) as { points?: RawPickupPoint[] };
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .replace(/ё/g, "е")
        .replace(/[^a-zа-я0-9]+/gi, " ")
        .trim();
    const tokens = normalize(data.query ?? "")
      .split(" ")
      .filter((token) => token.length > 1 || /\d/.test(token));

    const points = (result.points ?? [])
      .filter((p) => p.position && p.address?.full_address)
      .map((p) => ({
        id: p.id,
        name: p.name || (p.type === "terminal" ? "Постамат" : "Пункт выдачи"),
        address: p.address!.full_address!,
        latitude: p.position!.latitude,
        longitude: p.position!.longitude,
      }))
      .filter((p) => {
        if (tokens.length === 0) return true;
        const haystack = normalize(`${p.name} ${p.address}`);
        return tokens.every((token) => haystack.includes(token));
      })
      .sort((a, b) => a.address.localeCompare(b.address, "ru"));


    return { points };
  });

export const calculateDeliveryPrice = createServerFn({ method: "POST" })
  .validator((data) => priceInputSchema.parse(data))
  .handler(async ({ data }) => {
    // Базовый тариф считаем через «Платформу»: посылку мы сдаём сами, курьер не нужен.
    if (data.tariff === "standard") {
      const best = await cheapestDropoff(data.pickupPoint, data.quantity);

      if (best.price === null) {
        throw new Error("Не удалось рассчитать доставку в этот пункт выдачи.");
      }

      return {
        price: Math.round(best.price),
        currency: "RUB",
        offer: null,
        dropoff: best.point.address,
        tariff: data.tariff,
        deliveryDays: best.deliveryDays,
      };
    }

    const dropoff = nearestDropoff(data.pickupPoint);

    // Экспресс доступен не везде — считаем через cargo API.
    let lastText = "";
    for (const taxiClass of TARIFF_CLASSES.express) {
      const response = await fetch(`${YANDEX_DELIVERY_BASE_URL}/check-price`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          items: defaultItems(),
          client_requirements: { taxi_class: taxiClass },
          route_points: [
            {
              id: 1,
              fullname: dropoff.address,
              coordinates: [dropoff.longitude, dropoff.latitude],
            },
            {
              id: 2,
              fullname: data.pickupPoint.address,
              coordinates: [data.pickupPoint.longitude, data.pickupPoint.latitude],
            },
          ],
        }),
      });

      if (!response.ok) {
        lastText = await response.text();
        console.error("Yandex express price error", taxiClass, response.status, lastText);
        continue;
      }

      const result = (await response.json()) as {
        price?: string;
        currency?: string;
        offer?: string;
        code?: string;
        message?: string;
      };

      if (result.code) {
        lastText = result.message || result.code;
        continue;
      }

      return {
        price: result.price ? Math.round(Number(result.price)) : null,
        currency: result.currency || "RUB",
        offer: result.offer || null,
        dropoff: dropoff.address,
        tariff: data.tariff,
        deliveryDays: null,
      };
    }

    console.warn("Express unavailable for pickup point", data.pickupPoint.id, lastText);
    return {
      price: null,
      currency: "RUB",
      offer: null,
      dropoff: dropoff.address,
      tariff: data.tariff,
      deliveryDays: null,
    };
  });



export const createDeliveryOrder = createServerFn({ method: "POST" })
  .validator((data) => orderInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const parcel = parcelFor(data.quantity);
    const items = defaultItems(data.quantity);
    const pickupAddress = `${data.pickupPoint.name}, ${data.pickupPoint.address}`;
    const best = await cheapestDropoff(data.pickupPoint, data.quantity);
    const dropoff = best.point;
    const tariffLabel = "Базовый тариф";
    const orderNumber = data.orderNumber || `RS-${Date.now().toString().slice(-3)}`;

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        address_from: dropoff.address,
        address_to: pickupAddress,
        comment: [
          `Заказ ${orderNumber}`,
          `Самопривоз: сдаём посылку в ${dropoff.address}`,
          `${tariffLabel}. Доставка в ПВЗ (${data.pickupPoint.id})`,
          data.comment,
        ]
          .filter(Boolean)
          .join(". "),
        items,
        order_number: orderNumber,
        order_seq: data.orderSeq ?? null,
        delivery_price: best.price ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !order) {
      throw new Error(`Failed to create order: ${insertError?.message || "unknown"}`);
    }

    const nameParts = data.customerName.trim().split(/\s+/);
    const barcode = orderNumber;
    const physicalDims = {
      dx: parcel.lengthCm,
      dy: parcel.widthCm,
      dz: parcel.heightCm,
      weight_gross: parcel.weightGrams,
    };

    // Заявка «Платформы»: посылку сдаём сами в пункт приёма, получатель забирает в ПВЗ.
    const offerBody = {
      info: {
        operator_request_id: `${orderNumber}-${order.id.slice(0, 8)}`,
        comment: [`Заказ ${orderNumber}`, data.comment].filter(Boolean).join(". "),
      },
      source: { platform_station: { platform_id: dropoff.stationId } },
      destination: {
        type: "platform_station",
        platform_station: { platform_id: data.pickupPoint.id },
      },
      items: [
        {
          count: parcel.quantity,
          name: "Колода карт Таро",
          article: "TAROROFLAN-1",
          billing_details: {
            unit_price: DECK_PRICE * 100,
            assessed_unit_price: DECK_PRICE * 100,
          },
          physical_dims: {
            dx: PARCEL.lengthCm,
            dy: PARCEL.widthCm,
            dz: PARCEL.heightCm,
          },
          place_barcode: barcode,
        },
      ],
      places: [{ physical_dims: physicalDims, barcode }],
      billing_info: { payment_method: "already_paid", delivery_cost: 0 },
      recipient_info: {
        first_name: nameParts[0] || data.customerName,
        last_name: nameParts.slice(1).join(" ") || "—",
        phone: data.customerPhone,
        ...(data.customerEmail ? { email: data.customerEmail } : {}),
      },
      last_mile_policy: "self_pickup",
      particular_items_refuse: false,
    };

    const offerResponse = await fetch(`${YANDEX_PLATFORM_BASE_URL}/offers/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(offerBody),
    });

    const offerText = await offerResponse.text();
    const offerJson = (() => {
      try {
        return JSON.parse(offerText) as {
          offers?: {
            offer_id?: string;
            offer_details?: { pricing_total?: string };
          }[];
          message?: string;
        };
      } catch {
        return null;
      }
    })();

    // Из предложенных вариантов берём самый дешёвый (при равной цене — самый быстрый).
    const offer = [...(offerJson?.offers ?? [])].sort((a, b) => {
      const pa = Number.parseFloat(String(a.offer_details?.pricing_total ?? "").replace(",", "."));
      const pb = Number.parseFloat(String(b.offer_details?.pricing_total ?? "").replace(",", "."));
      return (Number.isFinite(pa) ? pa : Infinity) - (Number.isFinite(pb) ? pb : Infinity);
    })[0];

    if (!offerResponse.ok || !offer?.offer_id) {
      console.error("Yandex offers/create error", offerResponse.status, offerText);
      await supabaseAdmin
        .from("orders")
        .update({ status: "delivery_error", yandex_status: "offer_error" })
        .eq("id", order.id);
      throw new Error(
        offerJson?.message || `Яндекс Доставка не приняла заказ (${offerResponse.status}).`
      );
    }

    const confirmResponse = await fetch(`${YANDEX_PLATFORM_BASE_URL}/offers/confirm`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ offer_id: offer.offer_id }),
    });

    const confirmText = await confirmResponse.text();
    const confirmJson = (() => {
      try {
        return JSON.parse(confirmText) as { request_id?: string; message?: string };
      } catch {
        return null;
      }
    })();

    if (!confirmResponse.ok || !confirmJson?.request_id) {
      console.error("Yandex offers/confirm error", confirmResponse.status, confirmText);
      await supabaseAdmin
        .from("orders")
        .update({ status: "delivery_error", yandex_status: "confirm_error" })
        .eq("id", order.id);
      throw new Error(
        confirmJson?.message || `Яндекс Доставка не подтвердила заказ (${confirmResponse.status}).`
      );
    }

    const offerPrice = Number.parseFloat(
      String(offer.offer_details?.pricing_total ?? "").replace(",", ".")
    );
    const finalPrice = Number.isFinite(offerPrice) ? offerPrice : best.price;

    const result = {
      claim_id: confirmJson.request_id,
      status: "created",
      price: finalPrice != null ? String(finalPrice) : undefined,
    } as { claim_id?: string; status?: string; price?: string };

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        yandex_claim_id: result.claim_id ?? null,
        yandex_status: result.status ?? null,
        delivery_price: finalPrice ?? null,
        status: "created",
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order with claim:", updateError);
    }


    // Письма: клиенту — подтверждение, владельцу — карточка заказа таблицей.
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const deliveryPrice = result.price ? `${Math.round(Number(result.price))} ₽` : "—";
      const createdAt = new Date().toLocaleString("ru-RU", { timeZone: "Europe/Moscow" });

      await sendTemplateEmail("order-notification", "", {
        idempotencyKey: `order-notification-${order.id}`,
        templateData: {
          orderNumber,
          orderSeq: data.orderSeq ? String(data.orderSeq) : "—",
          orderId: order.id,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail || "—",
          pickupPoint: pickupAddress,
          dropoffPoint: dropoff.address,
          total: "3333 ₽",
          deliveryPrice,
          comment: data.comment || "—",
          claimId: result.claim_id || "—",
          createdAt,
        },
        ...(data.customerEmail ? { replyTo: data.customerEmail } : {}),
      });

      if (data.customerEmail) {
        await sendTemplateEmail("order-confirmation", data.customerEmail, {
          idempotencyKey: `order-confirmation-${order.id}`,
          templateData: {
            customerName: data.customerName,
            orderNumber,
            total: "3333 ₽",
            pickupPoint: pickupAddress,
          },
        });
      }
    } catch (emailError) {
      console.error("Failed to send order emails:", emailError);
    }

    return {
      orderId: order.id,
      orderNumber,
      claimId: result.claim_id,
      status: result.status,
      price: result.price ? Number(result.price) : null,
    };
  });

export const getDeliveryStatus = createServerFn({ method: "POST" })
  .validator((data) => statusInputSchema.parse(data))
  .handler(async ({ data }) => {
    const response = await fetch(`${YANDEX_DELIVERY_BASE_URL}/claims/info`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ claim_id: data.claimId }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Yandex Delivery status error: ${response.status} ${text}`);
    }

    const result = (await response.json()) as {
      claim_id?: string;
      status?: string;
      price?: string;
      code?: string;
      message?: string;
    };

    if (result.code) {
      throw new Error(result.message || `Yandex Delivery error: ${result.code}`);
    }

    return {
      claimId: result.claim_id,
      status: result.status,
      price: result.price ? Number(result.price) : null,
    };
  });
