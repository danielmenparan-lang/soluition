const LOCK_PREFIX = "ms-auto-gen";
const LOCK_TTL_MS = 5 * 60 * 1000;

function lockKey(shopId: string): string {
  return `${LOCK_PREFIX}:${shopId}`;
}

export function isAutoGenerateLocked(shopId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = sessionStorage.getItem(lockKey(shopId));
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { at?: number };
    return Boolean(parsed.at && Date.now() - parsed.at < LOCK_TTL_MS);
  } catch {
    return false;
  }
}

export function setAutoGenerateLock(shopId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(lockKey(shopId), JSON.stringify({ at: Date.now() }));
}

export function clearAutoGenerateLock(shopId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(lockKey(shopId));
}
