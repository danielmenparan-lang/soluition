const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(
  amount: number,
  currency = "USD",
  options?: { compact?: boolean },
): string {
  const key = `${currency}-${options?.compact ? "c" : "f"}`;
  let formatter = currencyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: options?.compact ? "compact" : "standard",
      maximumFractionDigits: options?.compact ? 1 : 2,
    });
    currencyFormatters.set(key, formatter);
  }
  return formatter.format(amount);
}

export function dominantCurrency(
  rows: Array<{ currency?: string | null }>,
  fallback = "USD",
): string {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const code = row.currency?.trim() || fallback;
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  let best = fallback;
  let bestCount = 0;
  for (const [code, count] of counts) {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  }
  return best;
}
