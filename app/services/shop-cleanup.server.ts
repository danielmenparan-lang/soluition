import getSupabase from "../supabase.server";

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
  if (visitorIds.length === 0) return;

  await supabase.from("visitors").delete().in("id", visitorIds);
}
