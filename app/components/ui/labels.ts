export const CATEGORY_LABELS: Record<string, string> = {
  marketing: "שיווק",
  product: "מוצרים",
  conversion: "המרות",
  retargeting: "רימרקטינג",
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "עדיפות גבוהה",
  medium: "עדיפות בינונית",
  low: "עדיפות נמוכה",
};

export function priorityClass(priority: string): string {
  if (priority === "high") return "ms-badge ms-badge-high";
  if (priority === "medium") return "ms-badge ms-badge-medium";
  return "ms-badge ms-badge-low";
}
