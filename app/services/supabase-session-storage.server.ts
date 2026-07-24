import { Session } from "@shopify/shopify-api";
import type { SessionStorage } from "@shopify/shopify-app-session-storage";
import getSupabase from "../supabase.server";

const SESSION_TABLE = "Session";

type SessionRow = {
  id: string;
  shop: string;
  state: string;
  isOnline: boolean;
  scope: string | null;
  expires: string | null;
  accessToken: string;
  userId: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  accountOwner: boolean;
  locale: string | null;
  collaborator: boolean | null;
  emailVerified: boolean | null;
  refreshToken: string | null;
  refreshTokenExpires: string | null;
};

function sessionToRow(session: Session): SessionRow {
  const sessionParams = session.toObject();

  return {
    id: session.id,
    shop: session.shop,
    state: session.state,
    isOnline: session.isOnline,
    scope: session.scope ?? null,
    expires: session.expires ? session.expires.toISOString() : null,
    accessToken: session.accessToken ?? "",
    userId:
      (sessionParams.onlineAccessInfo?.associated_user.id as number | undefined) ??
      null,
    firstName: sessionParams.onlineAccessInfo?.associated_user.first_name ?? null,
    lastName: sessionParams.onlineAccessInfo?.associated_user.last_name ?? null,
    email: sessionParams.onlineAccessInfo?.associated_user.email ?? null,
    accountOwner:
      sessionParams.onlineAccessInfo?.associated_user.account_owner ?? false,
    locale: sessionParams.onlineAccessInfo?.associated_user.locale ?? null,
    collaborator:
      sessionParams.onlineAccessInfo?.associated_user.collaborator ?? false,
    emailVerified:
      sessionParams.onlineAccessInfo?.associated_user.email_verified ?? false,
    refreshToken: sessionParams.refreshToken ?? null,
    refreshTokenExpires: sessionParams.refreshTokenExpires
      ? new Date(sessionParams.refreshTokenExpires).toISOString()
      : null,
  };
}

function rowToSession(row: SessionRow): Session {
  const sessionParams: Record<string, boolean | string | number> = {
    id: row.id,
    shop: row.shop,
    state: row.state,
    isOnline: row.isOnline,
    userId: String(row.userId ?? ""),
    firstName: String(row.firstName ?? ""),
    lastName: String(row.lastName ?? ""),
    email: String(row.email ?? ""),
    locale: String(row.locale ?? ""),
  };

  if (row.accountOwner !== null) sessionParams.accountOwner = row.accountOwner;
  if (row.collaborator !== null) sessionParams.collaborator = row.collaborator;
  if (row.emailVerified !== null) sessionParams.emailVerified = row.emailVerified;
  if (row.expires) sessionParams.expires = new Date(row.expires).getTime();
  if (row.scope) sessionParams.scope = row.scope;
  if (row.accessToken) sessionParams.accessToken = row.accessToken;
  if (row.refreshToken) sessionParams.refreshToken = row.refreshToken;
  if (row.refreshTokenExpires) {
    sessionParams.refreshTokenExpires = new Date(row.refreshTokenExpires).getTime();
  }

  return Session.fromPropertyArray(Object.entries(sessionParams), true);
}

export function isSupabaseSessionStorageConfigured(): boolean {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(url && key && !url.includes("your-project"));
}

export class SupabaseSessionStorage implements SessionStorage {
  private ready: Promise<boolean>;

  constructor() {
    this.ready = this.checkReady();
  }

  private async checkReady(): Promise<boolean> {
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from(SESSION_TABLE).select("id").limit(1);
      if (error) {
        console.error("[shopify] Supabase Session table check failed:", error.message);
        return false;
      }
      return true;
    } catch (error) {
      console.error("[shopify] Supabase session storage unavailable:", error);
      return false;
    }
  }

  async isReady(): Promise<boolean> {
    return this.ready;
  }

  private async ensureReady(): Promise<void> {
    if (!(await this.ready)) {
      throw new Error(
        "Supabase Session table not ready — run supabase/session-table.sql in SQL Editor",
      );
    }
  }

  async storeSession(session: Session): Promise<boolean> {
    await this.ensureReady();
    const supabase = getSupabase();
    const { error } = await supabase
      .from(SESSION_TABLE)
      .upsert(sessionToRow(session), { onConflict: "id" });

    if (error) throw new Error(error.message);
    return true;
  }

  async loadSession(id: string): Promise<Session | undefined> {
    await this.ensureReady();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(SESSION_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return undefined;
    return rowToSession(data as SessionRow);
  }

  async deleteSession(id: string): Promise<boolean> {
    await this.ensureReady();
    const supabase = getSupabase();
    const { error } = await supabase.from(SESSION_TABLE).delete().eq("id", id);
    if (error && error.code !== "PGRST116") throw new Error(error.message);
    return true;
  }

  async deleteSessions(ids: string[]): Promise<boolean> {
    await this.ensureReady();
    const supabase = getSupabase();
    const { error } = await supabase.from(SESSION_TABLE).delete().in("id", ids);
    if (error) throw new Error(error.message);
    return true;
  }

  async findSessionsByShop(shop: string): Promise<Session[]> {
    await this.ensureReady();
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(SESSION_TABLE)
      .select("*")
      .eq("shop", shop)
      .order("expires", { ascending: false })
      .limit(25);

    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => rowToSession(row as SessionRow));
  }
}

export function getSupabaseKeyRole(): string | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key || key.split(".").length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(key.split(".")[1], "base64url").toString("utf8"),
    ) as { role?: string };
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export async function checkSupabaseSessionTable(): Promise<{
  ready: boolean;
  error: string | null;
}> {
  if (!isSupabaseSessionStorageConfigured()) {
    return { ready: false, error: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing" };
  }

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from(SESSION_TABLE).select("id").limit(1);
    if (error) return { ready: false, error: error.message };
    return { ready: true, error: null };
  } catch (error) {
    return {
      ready: false,
      error: error instanceof Error ? error.message : "Session table check failed",
    };
  }
}
