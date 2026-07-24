import type { ActionFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";
import {
  deleteShopDataByDomain,
  exportCustomerData,
  redactCustomerData,
  storeCustomerDataExport,
} from "../services/shop-cleanup.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`Received compliance webhook ${topic} for ${shop}`);

  if (topic === "shop/redact") {
    const sessions = await sessionStorage.findSessionsByShop(shop);
    if (sessions.length > 0) {
      await sessionStorage.deleteSessions(sessions.map((s) => s.id));
    }
    await deleteShopDataByDomain(shop);
    return new Response();
  }

  if (topic === "customers/redact") {
    const customer = payload as { customer?: { id?: number } };
    const customerId = customer.customer?.id;
    if (customerId) {
      await redactCustomerData(shop, customerId);
    }
    return new Response();
  }

  if (topic === "customers/data_request") {
    const customer = payload as { customer?: { id?: number } };
    const customerId = customer.customer?.id;
    if (customerId) {
      const exportPayload = await exportCustomerData(shop, customerId);
      await storeCustomerDataExport(shop, customerId, exportPayload);
      console.log(`GDPR data export stored for ${shop} customer ${customerId}`);
    }
    return new Response();
  }

  return new Response(null, { status: 404 });
};
