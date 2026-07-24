import getSupabase from "../supabase.server";
import type { Shop } from "../types/database.types";

export async function getOrCreateShop(
  shopDomain: string,
  shopName?: string,
): Promise<Shop> {
  const supabase = getSupabase();

  const { data: existing, error: lookupError } = await supabase
    .from("shops")
    .select("*")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed to lookup shop: ${lookupError.message}`);
  }

  if (existing) return existing;

  const { data: created, error } = await supabase
    .from("shops")
    .insert({ shop_domain: shopDomain, shop_name: shopName ?? shopDomain })
    .select("*")
    .single();

  if (error || !created) {
    throw new Error(`Failed to create shop: ${error?.message}`);
  }

  return created;
}

export async function getShopByDomain(shopDomain: string): Promise<Shop | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("shop_domain", shopDomain)
    .maybeSingle();
  return data;
}

export async function getShopByTrackingId(
  trackingId: string,
): Promise<Shop | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("shops")
    .select("*")
    .eq("tracking_id", trackingId)
    .maybeSingle();
  return data;
}
