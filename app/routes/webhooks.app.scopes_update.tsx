import type { ActionFunctionArgs } from "react-router";
import { authenticate, sessionStorage } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, payload, session } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const current = (payload as { current?: string[] }).current;
  if (session && current) {
    session.scope = current.join(",");
    await sessionStorage.storeSession(session);
  }

  return new Response();
};
