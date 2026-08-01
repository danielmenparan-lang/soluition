import getSupabase from "../supabase.server";
import type { Json } from "../types/database.types";
import { anonymizeCustomerOrders } from "./shop-orders.server";

/** Deletes shop row; ON DELETE CASCADE removes analytics, chat, recommendations, etc. */
export async function deleteShopDataByDomain(shopDomain: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("shops")
    .delete()
    .eq("shop_domain", shopDomain);

  if (error) {
    throw new Error(`Failed to delete shop data: ${error.message}`);
  }
}

/** Best-effort purge of visitor rows tied to a Shopify customer id from order webhooks. */
export async function redactCustomerData(
  shopDomain: string,
  customerId: number,
): Promise<void> {
  const supabase = getSupabase();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (!shop) return;

  const visitorKey = `customer_${customerId}`;
  const { data: visitors } = await supabase
    .from("visitors")
    .select("id")
    .eq("shop_id", shop.id)
    .eq("visitor_id", visitorKey);

  const visitorIds = (visitors ?? []).map((v) => v.id);
  if (visitorIds.length === 0) {
    await anonymizeCustomerOrders(shop.id, customerId);
    return;
  }

  await supabase.from("visitors").delete().in("id", visitorIds);
  await anonymizeCustomerOrders(shop.id, customerId);
}

export async function exportCustomerData(
  shopDomain: string,
  customerId: number,
): Promise<Record<string, unknown>> {
  const supabase = getSupabase();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, shop_domain")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (!shop) {
    return { shop: shopDomain, customerId, records: [] };
  }

  const visitorKey = `customer_${customerId}`;
  const { data: visitors } = await supabase
    .from("visitors")
    .select("*")
    .eq("shop_id", shop.id)
    .eq("visitor_id", visitorKey);

  const visitorUuids = (visitors ?? []).map((v) => v.id);

  const { data: orders } = await supabase
    .from("shop_orders")
    .select(
      "shopify_order_id, order_number, total_price, currency, ordered_at, financial_status, country_code",
    )
    .eq("shop_id", shop.id)
    .eq("customer_id", customerId);

  if (visitorUuids.length === 0) {
    return {
      shop: shopDomain,
      customerId,
      exportedAt: new Date().toISOString(),
      visitors: [],
      sessions: [],
      events: [],
      orders: orders ?? [],
    };
  }

  const [sessions, events] = await Promise.all([
    supabase
      .from("visitor_sessions")
      .select("*")
      .eq("shop_id", shop.id)
      .in("visitor_uuid", visitorUuids),
    supabase.from("events").select("*").eq("shop_id", shop.id).in("visitor_uuid", visitorUuids),
  ]);

  return {
    shop: shopDomain,
    customerId,
    exportedAt: new Date().toISOString(),
    visitors: visitors ?? [],
    sessions: sessions.data ?? [],
    events: events.data ?? [],
    orders: orders ?? [],
  };
}

/** Persist GDPR export in shop settings so the merchant can retrieve it. */
export async function storeCustomerDataExport(
  shopDomain: string,
  customerId: number,
  exportPayload: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabase();
  const { data: shop } = await supabase
    .from("shops")
    .select("id, settings")
    .eq("shop_domain", shopDomain)
    .maybeSingle();

  if (!shop) return;

  const settings =
    shop.settings && typeof shop.settings === "object"
      ? (shop.settings as Record<string, unknown>)
      : {};

  const existing = Array.isArray(settings.gdprExports)
    ? (settings.gdprExports as Record<string, unknown>[])
    : [];

  const nextExports = [
    ...existing.filter(
      (entry) =>
        typeof entry === "object" &&
        entry !== null &&
        (entry as { customerId?: number }).customerId !== customerId,
    ),
    { customerId, storedAt: new Date().toISOString(), data: exportPayload },
  ].slice(-20);

  await supabase
    .from("shops")
    .update({ settings: { ...settings, gdprExports: nextExports as Json } })
    .eq("id", shop.id);
}
