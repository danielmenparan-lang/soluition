import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../services/shop.server";
import { processTrackEvent } from "../services/tracking.server";
import { upsertProductAnalytics } from "../services/product-intelligence.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const shopRecord = await getShopByDomain(shop);
  if (!shopRecord) return new Response();

  const order = payload as {
    id: number;
    total_price: string;
    line_items: Array<{
      product_id: number;
      title: string;
      quantity: number;
      price: string;
    }>;
    customer?: { id: number };
  };

  const lineItems = order.line_items ?? [];
  if (lineItems.length === 0) return new Response();

  const visitorId = order.customer
    ? `customer_${order.customer.id}`
    : `order_${order.id}`;
  const sessionId = `webhook_${order.id}`;
  const orderTotal = parseFloat(order.total_price);

  const [firstItem, ...restItems] = lineItems;

  await processTrackEvent({
    trackingId: shopRecord.tracking_id,
    visitorId,
    sessionId,
    eventType: "purchase",
    productId: String(firstItem.product_id),
    productTitle: firstItem.title,
    orderValue: orderTotal,
  });

  for (const item of restItems) {
    const lineRevenue = parseFloat(item.price || "0") * item.quantity;
    await upsertProductAnalytics(
      shopRecord.id,
      String(item.product_id),
      item.title,
      "purchases",
    );
    if (lineRevenue > 0) {
      await upsertProductAnalytics(
        shopRecord.id,
        String(item.product_id),
        item.title,
        "revenue",
        1,
        lineRevenue,
      );
    }
  }

  return new Response();
};
