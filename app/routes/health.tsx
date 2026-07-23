import prisma from "../db.server";

export const loader = async () => {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

  let dbConnected = false;
  let sessionTableReady = false;
  let dbError: string | null = null;

  if (databaseUrl.startsWith("postgres")) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbConnected = true;
      sessionTableReady =
        (await prisma.session.count().catch(() => -1)) >= 0;
    } catch (error) {
      dbError = error instanceof Error ? error.message : "Database connection failed";
    }
  }

  return Response.json(
    {
      ok: dbConnected && sessionTableReady,
      shopify: {
        apiKeySet: Boolean(process.env.SHOPIFY_API_KEY?.trim()),
        apiSecretSet: Boolean(process.env.SHOPIFY_API_SECRET?.trim()),
        appUrl: process.env.SHOPIFY_APP_URL || "missing",
      },
      database: {
        configured: databaseUrl.startsWith("postgres"),
        usesPooler: databaseUrl.includes("pooler.supabase.com"),
        connected: dbConnected,
        sessionTableReady,
        error: dbError,
      },
      supabase: {
        urlSet: Boolean(process.env.SUPABASE_URL?.trim()),
        keySet: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      },
    },
    { status: 200 },
  );
};
