import type { ShopifySyncStatus } from "../types/store-intelligence.types";
import getSupabase from "../supabase.server";
import { getShopSettings } from "./usage.server";

type SyncSettings = {
  shopifySyncLastAt?: string;
  lastShopifySyncAt?: string;
  shopifySyncLastError?: string | null;
  shopifySyncLastOrders?: number;
  shopifySyncLastProducts?: number;
};

export async function getSyncStatus(shopId: string): Promise<ShopifySyncStatus> {
  const settings = (await getShopSettings(shopId)) as SyncSettings;
  return {
    lastSyncAt: settings.shopifySyncLastAt ?? null,
    lastSyncError: settings.shopifySyncLastError ?? null,
    lastOrdersSynced: settings.shopifySyncLastOrders ?? 0,
    lastProductsSynced: settings.shopifySyncLastProducts ?? 0,
  };
}

export async function recordSyncSuccess(
  shopId: string,
  ordersSynced: number,
  productsSynced: number,
): Promise<void> {
  const supabase = getSupabase();
  const settings = await getShopSettings(shopId);
  await supabase
    .from("shops")
    .update({
      settings: {
        ...settings,
        shopifySyncLastAt: new Date().toISOString(),
        shopifySyncLastError: null,
        shopifySyncLastOrders: ordersSynced,
        shopifySyncLastProducts: productsSynced,
        lastShopifySyncAt: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", shopId);
}

export async function recordSyncFailure(
  shopId: string,
  message: string,
): Promise<void> {
  const supabase = getSupabase();
  const settings = await getShopSettings(shopId);
  await supabase
    .from("shops")
    .update({
      settings: {
        ...settings,
        shopifySyncLastError: message.slice(0, 500),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", shopId);
}

export async function shouldAutoSync(shopId: string): Promise<boolean> {
  const settings = (await getShopSettings(shopId)) as SyncSettings;
  const last = settings.shopifySyncLastAt ?? settings.lastShopifySyncAt;
  if (!last) return true;
  const elapsed = Date.now() - new Date(last).getTime();
  return elapsed > 60 * 60 * 1000;
}
