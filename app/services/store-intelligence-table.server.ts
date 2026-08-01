export async function checkStoreIntelligenceTables(): Promise<{
  ready: boolean;
  error?: string;
}> {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    return { ready: false, error: "Supabase not configured" };
  }

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };

  const [orders, products] = await Promise.all([
    fetch(`${url}/rest/v1/shop_orders?select=id&limit=1`, { headers }),
    fetch(`${url}/rest/v1/shop_products?select=id&limit=1`, { headers }),
  ]);

  if (orders.ok && products.ok) return { ready: true };

  const missing: string[] = [];
  if (!orders.ok) missing.push("shop_orders");
  if (!products.ok) missing.push("shop_products");
  return {
    ready: false,
    error: `Missing tables: ${missing.join(", ")} — run migration 002`,
  };
}
