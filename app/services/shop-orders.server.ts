import getSupabase from "../supabase.server";

export type ShopOrderLineItem = {
  productId: string;
  title: string;
  quantity: number;
  price: number;
};

export type ShopOrderInput = {
  shopifyOrderId: number;
  orderNumber?: string | null;
  customerId?: number | null;
  customerOrdersCount?: number;
  totalPrice: number;
  subtotalPrice?: number;
  totalTax?: number;
  totalDiscounts?: number;
  currency?: string;
  financialStatus?: string | null;
  fulfillmentStatus?: string | null;
  lineItems: ShopOrderLineItem[];
  sourceName?: string | null;
  landingSite?: string | null;
  referringSite?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  countryCode?: string | null;
  isReturningCustomer?: boolean;
  orderedAt: string;
};

function parseUtmFromUrl(
  url: string | null | undefined,
  param: string,
): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://x.test${url}`);
    return parsed.searchParams.get(param);
  } catch {
    return null;
  }
}

function addressCountry(
  address: unknown,
): string | null {
  if (!address || typeof address !== "object") return null;
  const code = (address as Record<string, unknown>).country_code;
  return typeof code === "string" ? code : null;
}

export function orderFromShopifyWebhook(
  payload: Record<string, unknown>,
): ShopOrderInput | null {
  const id = payload.id;
  if (typeof id !== "number") return null;

  const lineItemsRaw = Array.isArray(payload.line_items) ? payload.line_items : [];
  const lineItems: ShopOrderLineItem[] = lineItemsRaw.map((item) => {
    const row = item as Record<string, unknown>;
    const qty = typeof row.quantity === "number" ? row.quantity : 1;
    const price = parseFloat(String(row.price ?? "0"));
    return {
      productId: String(row.product_id ?? ""),
      title: String(row.title ?? "Unknown"),
      quantity: qty,
      price,
    };
  });

  const customer = payload.customer as Record<string, unknown> | undefined;
  const customerId =
    customer && typeof customer.id === "number" ? customer.id : null;
  const customerOrdersCount =
    customer && typeof customer.orders_count === "number"
      ? customer.orders_count
      : 1;

  const landingSite =
    typeof payload.landing_site === "string" ? payload.landing_site : null;
  const referringSite =
    typeof payload.referring_site === "string" ? payload.referring_site : null;

  const countryCode =
    addressCountry(payload.shipping_address) ??
    addressCountry(payload.billing_address);

  return {
    shopifyOrderId: id,
    orderNumber: typeof payload.name === "string" ? payload.name : null,
    customerId,
    customerOrdersCount,
    totalPrice: parseFloat(String(payload.total_price ?? "0")),
    subtotalPrice: parseFloat(String(payload.subtotal_price ?? "0")),
    totalTax: parseFloat(String(payload.total_tax ?? "0")),
    totalDiscounts: parseFloat(String(payload.total_discounts ?? "0")),
    currency: typeof payload.currency === "string" ? payload.currency : "USD",
    financialStatus:
      typeof payload.financial_status === "string"
        ? payload.financial_status
        : null,
    fulfillmentStatus:
      typeof payload.fulfillment_status === "string"
        ? payload.fulfillment_status
        : null,
    lineItems,
    sourceName:
      typeof payload.source_name === "string" ? payload.source_name : null,
    landingSite,
    referringSite,
    utmSource: parseUtmFromUrl(landingSite, "utm_source"),
    utmMedium: parseUtmFromUrl(landingSite, "utm_medium"),
    utmCampaign: parseUtmFromUrl(landingSite, "utm_campaign"),
    countryCode,
    orderedAt:
      typeof payload.created_at === "string"
        ? payload.created_at
        : new Date().toISOString(),
  };
}

async function resolveReturningCustomer(
  shopId: string,
  customerId: number | null | undefined,
  orderedAt: string,
  shopifyOrderId: number,
): Promise<boolean> {
  if (!customerId) return false;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("shop_orders")
    .select("shopify_order_id")
    .eq("shop_id", shopId)
    .eq("customer_id", customerId)
    .lt("ordered_at", orderedAt)
    .neq("shopify_order_id", shopifyOrderId)
    .limit(1);

  if (error) {
    throw new Error(`Failed to resolve returning customer: ${error.message}`);
  }
  return (data?.length ?? 0) > 0;
}

export async function upsertShopOrder(
  shopId: string,
  order: ShopOrderInput,
): Promise<void> {
  const supabase = getSupabase();
  const isReturning =
    order.isReturningCustomer ??
    (await resolveReturningCustomer(
      shopId,
      order.customerId,
      order.orderedAt,
      order.shopifyOrderId,
    ));

  const row = {
    shop_id: shopId,
    shopify_order_id: order.shopifyOrderId,
    order_number: order.orderNumber,
    customer_id: order.customerId,
    customer_orders_count: order.customerOrdersCount ?? 1,
    total_price: order.totalPrice,
    subtotal_price: order.subtotalPrice ?? 0,
    total_tax: order.totalTax ?? 0,
    total_discounts: order.totalDiscounts ?? 0,
    currency: order.currency ?? "USD",
    financial_status: order.financialStatus,
    fulfillment_status: order.fulfillmentStatus,
    line_item_count: order.lineItems.length,
    source_name: order.sourceName,
    landing_site: order.landingSite,
    referring_site: order.referringSite,
    utm_source: order.utmSource,
    utm_medium: order.utmMedium,
    utm_campaign: order.utmCampaign,
    country_code: order.countryCode,
    is_returning_customer: isReturning,
    ordered_at: order.orderedAt,
    raw_line_items: order.lineItems,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("shop_orders").upsert(row, {
    onConflict: "shop_id,shopify_order_id",
  });

  if (error) {
    throw new Error(`shop_orders upsert failed: ${error.message}`);
  }
}

export async function anonymizeCustomerOrders(
  shopId: string,
  customerId: number,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("shop_orders")
    .update({
      customer_id: null,
      landing_site: null,
      referring_site: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      country_code: null,
      is_returning_customer: false,
      updated_at: new Date().toISOString(),
    })
    .eq("shop_id", shopId)
    .eq("customer_id", customerId);

  if (error) {
    throw new Error(`Failed to anonymize orders: ${error.message}`);
  }
}
