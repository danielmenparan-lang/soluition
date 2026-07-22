export const loader = () => {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

  return Response.json(
    {
      ok: true,
      shopify: {
        apiKeySet: Boolean(process.env.SHOPIFY_API_KEY?.trim()),
        apiSecretSet: Boolean(process.env.SHOPIFY_API_SECRET?.trim()),
        appUrl: process.env.SHOPIFY_APP_URL || "missing",
      },
      database: {
        configured: databaseUrl.startsWith("postgres"),
        usesPooler: databaseUrl.includes("pooler.supabase.com"),
      },
      supabase: {
        urlSet: Boolean(process.env.SUPABASE_URL?.trim()),
        keySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      },
    },
    { status: 200 },
  );
};
