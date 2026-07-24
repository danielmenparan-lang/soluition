export const CATEGORY_LABELS: Record<string, string> = {
  marketing: "פרסום",
  product: "מוצרים",
  conversion: "מכירות",
  retargeting: "חזרה ללקוחות",
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "דחוף",
  medium: "בינוני",
  low: "אפשר לחכות",
};

export function priorityClass(priority: string): string {
  if (priority === "high") return "ms-badge ms-badge-high";
  if (priority === "medium") return "ms-badge ms-badge-medium";
  return "ms-badge ms-badge-low";
}
