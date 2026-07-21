/**
 * Demo data seeder for development/testing.
 * Run: npm run db:seed (requires SUPABASE env vars)
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function seed() {
  console.log("Seeding demo data...");

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .upsert(
      {
        shop_domain: "demo-store.myshopify.com",
        shop_name: "Demo Store",
      },
      { onConflict: "shop_domain" },
    )
    .select("*")
    .single();

  if (shopError || !shop) {
    console.error("Failed to create shop:", shopError);
    process.exit(1);
  }

  console.log(`Shop created: ${shop.shop_domain} (tracking: ${shop.tracking_id})`);

  const trafficSources = ["google", "facebook", "instagram", "direct", "email"];
  const products = [
    { id: "prod-1", title: "Premium T-Shirt" },
    { id: "prod-2", title: "Classic Jeans" },
    { id: "prod-3", title: "Running Shoes" },
    { id: "prod-4", title: "Leather Bag" },
    { id: "prod-5", title: "Winter Jacket" },
  ];

  for (let i = 0; i < 50; i++) {
    const visitorId = `visitor_${i}`;
    const { data: visitor } = await supabase
      .from("visitors")
      .upsert(
        {
          shop_id: shop.id,
          visitor_id: visitorId,
          is_returning: i > 30,
          visit_count: i > 30 ? Math.floor(Math.random() * 5) + 2 : 1,
          country: ["IL", "US", "UK", "DE", "FR"][i % 5],
          device_type: ["mobile", "desktop", "tablet"][i % 3],
          browser: ["Chrome", "Safari", "Firefox"][i % 3],
        },
        { onConflict: "shop_id,visitor_id" },
      )
      .select("id")
      .single();

    if (!visitor) continue;

    const sessionId = `session_${i}`;
    const source = trafficSources[i % trafficSources.length];
    const converted = i % 7 === 0;

    const { data: session } = await supabase
      .from("visitor_sessions")
      .upsert(
        {
          shop_id: shop.id,
          visitor_uuid: visitor.id,
          session_id: sessionId,
          traffic_source: source,
          converted,
          order_value: converted ? Math.floor(Math.random() * 200) + 50 : null,
          duration_seconds: Math.floor(Math.random() * 600) + 30,
          landing_page: "/",
          utm_source: source !== "direct" ? source : null,
          utm_medium: source !== "direct" ? "cpc" : null,
        },
        { onConflict: "shop_id,session_id" },
      )
      .select("id")
      .single();

    if (!session) continue;

    const product = products[i % products.length];
    await supabase.from("events").insert([
      {
        shop_id: shop.id,
        session_uuid: session.id,
        visitor_uuid: visitor.id,
        event_type: "product_view",
        product_id: product.id,
        product_title: product.title,
      },
      ...(i % 3 === 0
        ? [
            {
              shop_id: shop.id,
              session_uuid: session.id,
              visitor_uuid: visitor.id,
              event_type: "add_to_cart",
              product_id: product.id,
              product_title: product.title,
            },
          ]
        : []),
      ...(converted
        ? [
            {
              shop_id: shop.id,
              session_uuid: session.id,
              visitor_uuid: visitor.id,
              event_type: "purchase",
              product_id: product.id,
              product_title: product.title,
              order_value: Math.floor(Math.random() * 200) + 50,
            },
          ]
        : []),
    ]);

    const today = new Date().toISOString().split("T")[0];
    await supabase.from("product_analytics").upsert(
      {
        shop_id: shop.id,
        product_id: product.id,
        product_title: product.title,
        date: today,
        views: Math.floor(Math.random() * 100) + 10,
        add_to_carts: Math.floor(Math.random() * 20),
        purchases: converted ? 1 : 0,
        revenue: converted ? Math.floor(Math.random() * 200) + 50 : 0,
      },
      { onConflict: "shop_id,product_id,date" },
    );
  }

  console.log("Demo data seeded successfully!");
  console.log(`Tracking ID: ${shop.tracking_id}`);
}

seed().catch(console.error);
