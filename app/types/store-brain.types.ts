export type BrainSignalStatus = "active" | "pending" | "off";

export type BrainInput = {
  id: string;
  label: string;
  status: BrainSignalStatus;
  detail: string;
};

export type BrainSkill = {
  id: string;
  label: string;
  status: BrainSignalStatus;
  summary: string;
};

export type BrainSkillDomain = {
  id: string;
  label: string;
  status: BrainSignalStatus;
  activeCount: number;
  totalCount: number;
  headline: string;
};

export type TodayActionSource = "recommendation" | "blocker" | "dropoff" | "setup";

export type BrainTodayAction = {
  title: string;
  why: string;
  proof: string;
  source: TodayActionSource;
};

export type BrainOutput = {
  verdict: string;
  verdictSharp: string;
  score: number;
  readyForAds: boolean;
  summary: string;
  todayAction: BrainTodayAction | null;
  confidence: "high" | "medium" | "low";
};

export type StoreBrain = {
  hasEnoughData: boolean;
  inputs: BrainInput[];
  skills: BrainSkill[];
  domains: BrainSkillDomain[];
  activeDomainCount: number;
  totalSkillCount: number;
  output: BrainOutput;
  /** One line — how the brain connected signals to the verdict */
  thinkingLine: string;
};
