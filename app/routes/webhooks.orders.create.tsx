import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../services/shop.server";
import { processTrackEvent } from "../services/tracking.server";

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
    }>;
    customer?: { id: number };
  };

  for (const item of order.line_items) {
    await processTrackEvent({
      trackingId: shopRecord.tracking_id,
      visitorId: order.customer
        ? `customer_${order.customer.id}`
        : `order_${order.id}`,
      sessionId: `webhook_${order.id}`,
      eventType: "purchase",
      productId: String(item.product_id),
      productTitle: item.title,
      orderValue: parseFloat(order.total_price),
    });
  }

  return new Response();
};
