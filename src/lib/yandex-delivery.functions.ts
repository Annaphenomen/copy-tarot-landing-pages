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
export const DROPOFF_POINTS: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}[] = [
  { name: "Пермь", address: "Пермь, улица Революции, 52", latitude: 58.0002, longitude: 56.238 },
  {
    name: "Красноярск",
    address: "Красноярск, Ярыгинская набережная, 11",
    latitude: 55.993,
    longitude: 92.8,
  },
  {
    name: "Москва",
    address: "Москва, улица Маршала Соколовского, 3",
    latitude: 55.777,
    longitude: 37.488,
  },
  {
    name: "Александров",
    address: "Александров, улица Гагарина, 23 корп. 1",
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

const searchInputSchema = z.object({
  geoId: z.number(),
  query: z.string().optional(),
});

const priceInputSchema = z.object({
  pickupPoint: pickupPointSchema,
  tariff: tariffSchema,
});

const orderInputSchema = z.object({
  customerName: z.string().min(1, "Укажите имя"),
  customerPhone: z.string().min(6, "Укажите телефон"),
  customerEmail: z.string().email("Укажите корректный e-mail").optional().or(z.literal("")),
  pickupPoint: pickupPointSchema,
  tariff: tariffSchema,
  comment: z.string().optional(),
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

function defaultItems() {
  return [
    {
      quantity: 1,
      size: { length: 0.2, width: 0.15, height: 0.05 },
      weight: 0.5,
    },
  ];
}

type RawPickupPoint = {
  id: string;
  name?: string;
  type?: string;
  position?: { latitude: number; longitude: number };
  address?: { full_address?: string; locality?: string; street?: string; house?: string };
  schedule?: unknown;
};

export const searchPickupPoints = createServerFn({ method: "POST" })
  .validator((data) => searchInputSchema.parse(data))
  .handler(async ({ data }) => {
    const response = await fetch(`${YANDEX_PLATFORM_BASE_URL}/pickup-points/list`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        geo_id: data.geoId,
        payment_method: "already_paid",
        type: "pickup_point",
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
        name: p.name || "Пункт выдачи",
        address: p.address!.full_address!,
        latitude: p.position!.latitude,
        longitude: p.position!.longitude,
      }))
      .filter((p) => {
        if (tokens.length === 0) return true;
        const haystack = normalize(`${p.name} ${p.address}`);
        return tokens.every((token) => haystack.includes(token));
      })
      .sort((a, b) => a.address.localeCompare(b.address, "ru"))
      .slice(0, 500);


    return { points };
  });

export const calculateDeliveryPrice = createServerFn({ method: "POST" })
  .validator((data) => priceInputSchema.parse(data))
  .handler(async ({ data }) => {
    const dropoff = nearestDropoff(data.pickupPoint);

    // Базовый тариф считаем через «Платформу»: посылку мы сдаём сами, курьер не нужен.
    if (data.tariff === "standard") {
      const response = await fetch(`${YANDEX_PLATFORM_BASE_URL}/pricing-calculator`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          client_price: 3333,
          total_assessed_price: 3333,
          total_weight: 500,
          tariff: "self_pickup",
          source: { address: dropoff.address },
          destination: { platform_station_id: data.pickupPoint.id },
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        console.error("Yandex pricing-calculator error", response.status, text);
        throw new Error("Не удалось рассчитать доставку в этот пункт выдачи.");
      }

      const result = JSON.parse(text) as { pricing_total?: string; delivery_days?: number };
      const price = Number.parseFloat(String(result.pricing_total ?? "").replace(",", "."));

      return {
        price: Number.isFinite(price) ? Math.round(price) : null,
        currency: "RUB",
        offer: null,
        dropoff: dropoff.address,
        tariff: data.tariff,
        deliveryDays: result.delivery_days ?? null,
      };
    }

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

    const items = defaultItems();
    const pickupAddress = `${data.pickupPoint.name}, ${data.pickupPoint.address}`;
    const dropoff = nearestDropoff(data.pickupPoint);
    const tariffLabel = data.tariff === "express" ? "Экспресс" : "Базовый тариф";
    const orderNumber = `RS-${Date.now().toString().slice(-6)}`;

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
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !order) {
      throw new Error(`Failed to create order: ${insertError?.message || "unknown"}`);
    }

    const requestId = `${order.id}-${Date.now()}`;
    const claimBody = {
      emergency_contact_name: data.customerName,
      emergency_contact_phone: data.customerPhone,
      items,
      client_requirements: { taxi_class: TARIFF_CLASSES[data.tariff][0] },
      route_points: [
        {
          point_id: 1,
          visit_order: 1,
          address: {
            fullname: dropoff.address,
            coordinates: [dropoff.longitude, dropoff.latitude],
          },
          contact: { name: data.customerName, phone: data.customerPhone },
          type: "source",
        },
        {
          point_id: 2,
          visit_order: 2,
          address: {
            fullname: data.pickupPoint.address,
            coordinates: [data.pickupPoint.longitude, data.pickupPoint.latitude],
          },
          contact: { name: data.customerName, phone: data.customerPhone },
          type: "destination",
          pickup_point_id: data.pickupPoint.id,
        },
      ],
      comment: [`Самопривоз в ${dropoff.address}`, data.comment].filter(Boolean).join(". "),
    };


    const response = await fetch(
      `${YANDEX_DELIVERY_BASE_URL}/claims/create?request_id=${encodeURIComponent(requestId)}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(claimBody),
      }
    );

    const result = (await response.json()) as {
      claim_id?: string;
      status?: string;
      price?: string;
      code?: string;
      message?: string;
    };

    if (!response.ok || result.code) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "delivery_error", yandex_status: result.status || "error" })
        .eq("id", order.id);

      throw new Error(result.message || `Yandex Delivery claim error: ${response.status}`);
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        yandex_claim_id: result.claim_id ?? null,
        yandex_status: result.status ?? null,
        delivery_price: result.price ? Number(result.price) : null,
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
