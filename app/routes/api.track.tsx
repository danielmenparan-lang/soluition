import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { resolveCountryFromRequest } from "../services/geo.server";
import { processTrackEvent } from "../services/tracking.server";

async function parseTrackPayload(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const text = await request.text();
  if (!text) {
    throw new Error("Empty request body");
  }

  return JSON.parse(text);
}

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
    const payload = await parseTrackPayload(request);
    const country =
      typeof payload === "object" &&
      payload !== null &&
      "country" in payload &&
      typeof payload.country === "string"
        ? payload.country
        : await resolveCountryFromRequest(request);

    const result = await processTrackEvent(payload, { country: country ?? undefined });

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
