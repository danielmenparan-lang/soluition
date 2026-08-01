import type { StoreIntelligence } from "../types/store-intelligence.types";

type ScoreCopy = {
  verdict: string;
  explain: string;
  tone: "great" | "good" | "ok" | "warn" | "bad";
};

export function getStoreScoreCopy(
  grade: StoreIntelligence["storeHealthGrade"],
  score: number,
): ScoreCopy {
  const base = `Your score is ${score} out of 100. We check orders, repeat buyers, stock, and discounts.`;

  switch (grade) {
    case "A":
      return {
        verdict: "Store looks healthy",
        explain: `${base} You're in good shape — keep improving the fix list below.`,
        tone: "great",
      };
    case "B":
      return {
        verdict: "Doing well",
        explain: `${base} A few fixes below could push sales higher.`,
        tone: "good",
      };
    case "C":
      return {
        verdict: "Room to improve",
        explain: `${base} Some things are slowing sales — see fixes below or ask Chat.`,
        tone: "ok",
      };
    case "D":
      return {
        verdict: "Needs work",
        explain: `${base} Sales are likely being held back — start with fix #1 below or open Chat.`,
        tone: "warn",
      };
    default:
      return {
        verdict: "Needs urgent fixes",
        explain: `${base} Focus on the fix list below today.`,
        tone: "bad",
      };
  }
}
