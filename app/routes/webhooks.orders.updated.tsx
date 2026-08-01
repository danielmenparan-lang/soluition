import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getShopByDomain } from "../services/shop.server";
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
    return new Response();
  } catch (error) {
    console.error(
      "[webhooks/orders/updated]",
      error instanceof Error ? error.message : error,
    );
    return new Response(null, { status: 500 });
  }
};
