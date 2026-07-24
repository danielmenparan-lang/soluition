const geoCache = new Map<string, { country: string; expires: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return request.headers.get("x-real-ip");
}

export async function resolveCountryFromRequest(
  request: Request,
): Promise<string | null> {
  const fromHeader =
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("x-country-code");

  if (fromHeader && fromHeader !== "XX" && fromHeader.length === 2) {
    return fromHeader.toUpperCase();
  }

  const ip = getClientIp(request);
  if (!ip || ip === "127.0.0.1" || ip.startsWith("::1")) {
    return null;
  }

  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return cached.country;
  }

  try {
    const response = await fetch(
      `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=countryCode`,
      { signal: AbortSignal.timeout(2500) },
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { countryCode?: string };
    const country = data.countryCode?.toUpperCase() ?? null;
    if (country) {
      geoCache.set(ip, { country, expires: Date.now() + CACHE_TTL_MS });
    }
    return country;
  } catch {
    return null;
  }
}
