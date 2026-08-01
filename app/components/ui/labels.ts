export const CATEGORY_LABELS: Record<string, string> = {
  marketing: "Traffic",
  product: "Products",
  conversion: "Sales",
  retargeting: "Return buyers",
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: "Do first",
  medium: "Do next",
  low: "Later",
};

export function priorityClass(priority: string): string {
  if (priority === "high") return "ms-badge ms-badge-high";
  if (priority === "medium") return "ms-badge ms-badge-medium";
  return "ms-badge ms-badge-low";
}
