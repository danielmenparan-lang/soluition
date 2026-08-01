import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../services/shop.server";
import { processTrackEvent } from "../services/tracking.server";
import { upsertProductAnalytics } from "../services/product-intelligence.server";
import {
  orderFromShopifyWebhook,
  upsertShopOrder,
} from "../services/shop-orders.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);

    const shopRecord = await getShopByDomain(shop);
    if (!shopRecord) return new Response();

    const orderInput = orderFromShopifyWebhook(
      payload as Record<string, unknown>,
    );
    if (!orderInput) return new Response();

    await upsertShopOrder(shopRecord.id, orderInput);

    const lineItems = orderInput.lineItems;
    if (lineItems.length === 0) return new Response();

    const visitorId = orderInput.customerId
      ? `customer_${orderInput.customerId}`
      : `order_${orderInput.shopifyOrderId}`;
    const sessionId = `webhook_${orderInput.shopifyOrderId}`;

    await processTrackEvent({
      trackingId: shopRecord.tracking_id,
      visitorId,
      sessionId,
      eventType: "purchase",
      productId: lineItems[0].productId,
      productTitle: lineItems[0].title,
      orderValue: orderInput.totalPrice,
    });

    for (const item of lineItems) {
      const lineRevenue = item.price * item.quantity;
      await upsertProductAnalytics(
        shopRecord.id,
        item.productId,
        item.title,
        "purchases",
      );
      if (lineRevenue > 0) {
        await upsertProductAnalytics(
          shopRecord.id,
          item.productId,
          item.title,
          "revenue",
          1,
          lineRevenue,
        );
      }
    }

    return new Response();
  } catch (error) {
    console.error(
      "[webhooks/orders/create]",
      error instanceof Error ? error.message : error,
    );
    return new Response(null, { status: 500 });
  }
};
