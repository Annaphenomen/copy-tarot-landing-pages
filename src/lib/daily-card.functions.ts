import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

const DECK_SIZE = 78;

function getClientIp(request: Request): string {
  const headers = request.headers;
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return "unknown";
}

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(`tarot-day:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const drawDailyCard = createServerFn({ method: "POST" }).handler(
  async () => {
    const request = getRequest();
    const ip = getClientIp(request);
    const ipHash = await hashIp(ip);

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabaseAdmin
      .from("daily_card_draws")
      .select("card_index")
      .eq("ip_hash", ipHash)
      .eq("day", today)
      .maybeSingle();

    if (existing) {
      return { cardIndex: existing.card_index, alreadyDrawn: true };
    }

    const cardIndex = Math.floor(Math.random() * DECK_SIZE);
    await supabaseAdmin.from("daily_card_draws").insert({
      ip_hash: ipHash,
      day: today,
      card_index: cardIndex,
    });

    return { cardIndex, alreadyDrawn: false };
  },
);
