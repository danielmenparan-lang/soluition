export type DiagnosticStatus = "pass" | "warn" | "fail";

export type DiagnosticCategory =
  | "tracking"
  | "funnel"
  | "product_page"
  | "checkout"
  | "traffic";

export type DiagnosticCheck = {
  id: string;
  category: DiagnosticCategory;
  label: string;
  status: DiagnosticStatus;
  detail: string;
  fixHint: string;
  adminUrl: string | null;
};

export type DropOffSpot = {
  id: string;
  title: string;
  detail: string;
  evidence: string;
  fixHint: string;
  adminUrl: string | null;
};

export type StoreDiagnostic = {
  adReadinessScore: number;
  readyForAds: boolean;
  verdict: string;
  summary: string;
  checks: DiagnosticCheck[];
  blockers: DiagnosticCheck[];
  dropOffs: DropOffSpot[];
  hasEnoughData: boolean;
};
