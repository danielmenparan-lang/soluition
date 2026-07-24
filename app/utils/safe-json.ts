export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function asActionItems(
  value: unknown,
): Array<{ action: string; impact: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { action: string; impact: string } =>
      typeof item === "object" &&
      item !== null &&
      "action" in item &&
      "impact" in item &&
      typeof (item as { action: unknown }).action === "string" &&
      typeof (item as { impact: unknown }).impact === "string",
  );
}
