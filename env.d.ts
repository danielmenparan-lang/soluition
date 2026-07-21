/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly SHOPIFY_API_KEY: string;
  readonly SHOPIFY_API_SECRET: string;
  readonly SHOPIFY_APP_URL: string;
  readonly SCOPES: string;
  readonly SUPABASE_URL: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly ANTHROPIC_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
