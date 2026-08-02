export type RevenueLeakType =
  | "cart_abandonment"
  | "product_exit"
  | "page_exit"
  | "wasted_traffic"
  | "funnel_drop";

export type RevenueLeak = {
  id: string;
  type: RevenueLeakType;
  title: string;
  detail: string;
  monthlyLoss: number;
  evidence: string;
  fixAction: string;
  adminUrl: string | null;
};

export type RevenueLeakReport = {
  totalMonthlyLoss: number;
  periodDays: number;
  currency: string;
  leaks: RevenueLeak[];
  hasEnoughData: boolean;
  aovUsed: number;
  disclaimer: string;
};
