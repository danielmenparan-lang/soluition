import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { processTrackEvent } from "../services/tracking.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return new Response("Marketing Solution Tracking API", {
    headers: CORS_HEADERS,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  try {
    const payload = await request.json();
    const result = await processTrackEvent(payload);

    return Response.json(result, {
      status: result.success ? 200 : 400,
      headers: CORS_HEADERS,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: "Invalid request body" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
};
