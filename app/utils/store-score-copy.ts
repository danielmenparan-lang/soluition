import type { StoreIntelligence } from "../types/store-intelligence.types";

type ScoreCopy = {
  verdict: string;
  explain: string;
  tone: "great" | "good" | "ok" | "warn" | "bad";
};

export function getStoreScoreCopy(
  grade: StoreIntelligence["storeHealthGrade"],
  _score: number,
): ScoreCopy {
  switch (grade) {
    case "A":
      return {
        verdict: "Looking good",
        explain: "Keep going — small fixes below can still help.",
        tone: "great",
      };
    case "B":
      return {
        verdict: "Doing well",
        explain: "A few fixes below could lift sales.",
        tone: "good",
      };
    case "C":
      return {
        verdict: "Could be better",
        explain: "See fixes below or ask Chat.",
        tone: "ok",
      };
    case "D":
      return {
        verdict: "Needs work",
        explain: "Start with fix #1 below, or ask Chat.",
        tone: "warn",
      };
    default:
      return {
        verdict: "Fix this first",
        explain: "Work through the fix list below today.",
        tone: "bad",
      };
  }
}

export function getScoreHint(score: number): string {
  return `${score}/100 — higher = more ready to sell`;
}
