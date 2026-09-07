import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const YANDEX_DELIVERY_BASE_URL = "https://b2b.taxi.yandex.net/b2b/cargo/integration/v2";

const priceInputSchema = z.object({
  addressFrom: z.string().min(3, "Укажите адрес отправителя"),
  addressTo: z.string().min(3, "Укажите адрес получателя"),
});

const orderInputSchema = z.object({
  customerName: z.string().min(1, "Укажите имя"),
  customerPhone: z.string().min(6, "Укажите телефон"),
  customerEmail: z.string().email("Укажите корректный e-mail").optional().or(z.literal("")),
  addressFrom: z.string().min(3, "Укажите адрес отправителя"),
  addressTo: z.string().min(3, "Укажите адрес получателя"),
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

export const calculateDeliveryPrice = createServerFn({ method: "POST" })
  .validator((data) => priceInputSchema.parse(data))
  .handler(async ({ data }) => {
    const body = {
      items: defaultItems(),
      route_points: [
        {
          address: { fullname: data.addressFrom },
          type: "source",
        },
        {
          address: { fullname: data.addressTo },
          type: "destination",
        },
      ],
    };

    const response = await fetch(`${YANDEX_DELIVERY_BASE_URL}/check-price`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Yandex Delivery price error: ${response.status} ${text}`);
    }

    const result = (await response.json()) as {
      price?: string;
      currency?: string;
      offer?: string;
      code?: string;
      message?: string;
    };

    if (result.code) {
      throw new Error(result.message || `Yandex Delivery error: ${result.code}`);
    }

    return {
      price: result.price ? Number(result.price) : null,
      currency: result.currency || "RUB",
      offer: result.offer || null,
    };
  });

export const createDeliveryOrder = createServerFn({ method: "POST" })
  .validator((data) => orderInputSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const items = defaultItems();

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        address_from: data.addressFrom,
        address_to: data.addressTo,
        comment: data.comment || null,
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
      route_points: [
        {
          address: { fullname: data.addressFrom },
          contact: { name: data.customerName, phone: data.customerPhone },
          type: "source",
        },
        {
          address: { fullname: data.addressTo },
          contact: { name: data.customerName, phone: data.customerPhone },
          type: "destination",
        },
      ],
      client_requirements: {
        taxi_class: "courier",
      },
      comment: data.comment || undefined,
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

      throw new Error(
        result.message || `Yandex Delivery claim error: ${response.status}`
      );
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

    return {
      orderId: order.id,
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
