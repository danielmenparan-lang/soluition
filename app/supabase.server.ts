import "./node-polyfills.server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types/database.types";

declare global {
  // eslint-disable-next-line no-var
  var supabaseGlobal: SupabaseClient<Database> | undefined;
  // eslint-disable-next-line no-var
  var supabaseGlobalKey: string | undefined;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !key || url.includes("your-project")) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env",
    );
  }

  return { url, key };
}

function createSupabaseClient(): SupabaseClient<Database> {
  const { url, key } = getSupabaseConfig();

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabase(): SupabaseClient<Database> {
  const { url, key } = getSupabaseConfig();
  const cacheKey = `${url}:${key.slice(0, 8)}`;

  if (process.env.NODE_ENV !== "production") {
    if (!global.supabaseGlobal || global.supabaseGlobalKey !== cacheKey) {
      global.supabaseGlobal = createSupabaseClient();
      global.supabaseGlobalKey = cacheKey;
    }
    return global.supabaseGlobal;
  }

  return createSupabaseClient();
}

export default getSupabase;
