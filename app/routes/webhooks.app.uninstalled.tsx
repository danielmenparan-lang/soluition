import type { ActionFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";
import { deleteShopDataByDomain } from "../services/shop-cleanup.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const sessions = await sessionStorage.findSessionsByShop(shop);
  if (sessions.length > 0) {
    await sessionStorage.deleteSessions(sessions.map((s) => s.id));
  }

  await deleteShopDataByDomain(shop).catch((error) => {
    console.error(`[webhook] shop data cleanup failed for ${shop}:`, error);
  });

  return new Response();
};
