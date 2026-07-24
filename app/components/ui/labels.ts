export const CATEGORY_LABELS: Record<string, string> = {
  marketing: "Marketing",
  product: "Products",
  conversion: "Conversion",
  retargeting: "Retargeting",
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function priorityClass(priority: string): string {
  if (priority === "high") return "ms-badge ms-badge-high";
  if (priority === "medium") return "ms-badge ms-badge-medium";
  return "ms-badge ms-badge-low";
}
