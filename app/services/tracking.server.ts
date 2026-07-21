import { z } from "zod";
import getSupabase from "../supabase.server";
import { resolveTrafficSource } from "./attribution.server";
import { upsertProductAnalytics } from "./product-intelligence.server";
import type { EventType, Json } from "../types/database.types";

const trackEventSchema = z.object({
  trackingId: z.string().min(1),
  visitorId: z.string().min(1),
  sessionId: z.string().min(1),
  eventType: z.string(),
  url: z.string().optional(),
  pageTitle: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmTerm: z.string().optional(),
  utmContent: z.string().optional(),
  productId: z.string().optional(),
  productTitle: z.string().optional(),
  collectionId: z.string().optional(),
  orderValue: z.number().optional(),
  searchQuery: z.string().optional(),
  buttonLabel: z.string().optional(),
  timeOnPage: z.number().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  deviceType: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
  eventData: z.record(z.unknown()).optional(),
});

export type TrackEventPayload = z.infer<typeof trackEventSchema>;

export async function processTrackEvent(
  rawPayload: unknown,
): Promise<{ success: boolean; error?: string }> {
  const parsed = trackEventSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.message };
  }

  const payload = parsed.data;
  const supabase = getSupabase();

  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("tracking_id", payload.trackingId)
    .single();

  if (!shop) {
    return { success: false, error: "Invalid tracking ID" };
  }

  const shopId = shop.id;

  // Upsert visitor
  const { data: existingVisitor } = await supabase
    .from("visitors")
    .select("*")
    .eq("shop_id", shopId)
    .eq("visitor_id", payload.visitorId)
    .single();

  let visitorUuid: string;

  if (existingVisitor) {
    visitorUuid = existingVisitor.id;
    await supabase
      .from("visitors")
      .update({
        is_returning: true,
        visit_count: existingVisitor.visit_count + 1,
        last_seen_at: new Date().toISOString(),
        country: payload.country ?? existingVisitor.country,
        city: payload.city ?? existingVisitor.city,
        device_type: payload.deviceType ?? existingVisitor.device_type,
        browser: payload.browser ?? existingVisitor.browser,
        os: payload.os ?? existingVisitor.os,
      })
      .eq("id", visitorUuid);
  } else {
    const { data: newVisitor, error } = await supabase
      .from("visitors")
      .insert({
        shop_id: shopId,
        visitor_id: payload.visitorId,
        country: payload.country,
        city: payload.city,
        device_type: payload.deviceType,
        browser: payload.browser,
        os: payload.os,
      })
      .select("id")
      .single();

    if (error || !newVisitor) {
      return { success: false, error: "Failed to create visitor" };
    }
    visitorUuid = newVisitor.id;
  }

  // Upsert session
  const trafficSource = resolveTrafficSource({
    referrer: payload.referrer,
    utmSource: payload.utmSource,
    utmMedium: payload.utmMedium,
  });

  const { data: existingSession } = await supabase
    .from("visitor_sessions")
    .select("*")
    .eq("shop_id", shopId)
    .eq("session_id", payload.sessionId)
    .single();

  let sessionUuid: string;

  if (existingSession) {
    sessionUuid = existingSession.id;
    const updates: {
      exit_page?: string | null;
      ended_at?: string;
      duration_seconds?: number;
      converted?: boolean;
      order_value?: number;
    } = {
      exit_page: payload.url ?? existingSession.exit_page,
    };
    if (payload.eventType === "session_end" && payload.timeOnPage) {
      updates.ended_at = new Date().toISOString();
      updates.duration_seconds = payload.timeOnPage;
    }
    if (payload.eventType === "purchase") {
      updates.converted = true;
      updates.order_value = payload.orderValue ?? 0;
    }
    await supabase
      .from("visitor_sessions")
      .update(updates)
      .eq("id", sessionUuid);
  } else {
    const { data: newSession, error } = await supabase
      .from("visitor_sessions")
      .insert({
        shop_id: shopId,
        visitor_uuid: visitorUuid,
        session_id: payload.sessionId,
        landing_page: payload.url,
        exit_page: payload.url,
        referrer: payload.referrer,
        utm_source: payload.utmSource,
        utm_medium: payload.utmMedium,
        utm_campaign: payload.utmCampaign,
        utm_term: payload.utmTerm,
        utm_content: payload.utmContent,
        traffic_source: trafficSource,
      })
      .select("id")
      .single();

    if (error || !newSession) {
      return { success: false, error: "Failed to create session" };
    }
    sessionUuid = newSession.id;
  }

  const eventType = payload.eventType as EventType;

  // Record page view
  if (payload.url && ["page_view", "product_view", "collection_view"].includes(eventType)) {
    await supabase.from("page_views").insert({
      shop_id: shopId,
      session_uuid: sessionUuid,
      visitor_uuid: visitorUuid,
      url: payload.url,
      page_title: payload.pageTitle,
      time_on_page_seconds: payload.timeOnPage,
      is_exit: eventType === "session_end",
    });
  }

  // Record event
  await supabase.from("events").insert({
    shop_id: shopId,
    session_uuid: sessionUuid,
    visitor_uuid: visitorUuid,
    event_type: eventType,
    event_data: (payload.eventData ?? {}) as Json,
    product_id: payload.productId,
    product_title: payload.productTitle,
    collection_id: payload.collectionId,
    order_value: payload.orderValue,
    search_query: payload.searchQuery,
    button_label: payload.buttonLabel,
  });

  // Update product analytics aggregates
  if (payload.productId) {
    if (eventType === "product_view") {
      await upsertProductAnalytics(
        shopId,
        payload.productId,
        payload.productTitle ?? payload.productId,
        "views",
      );
    }
    if (eventType === "add_to_cart") {
      await upsertProductAnalytics(
        shopId,
        payload.productId,
        payload.productTitle ?? payload.productId,
        "add_to_carts",
      );
    }
    if (eventType === "purchase") {
      await upsertProductAnalytics(
        shopId,
        payload.productId,
        payload.productTitle ?? payload.productId,
        "purchases",
      );
      if (payload.orderValue) {
        await upsertProductAnalytics(
          shopId,
          payload.productId,
          payload.productTitle ?? payload.productId,
          "revenue",
          1,
          payload.orderValue,
        );
      }
    }
  }

  return { success: true };
}
