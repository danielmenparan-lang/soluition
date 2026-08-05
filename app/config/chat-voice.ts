/**
 * Chat — plain English only. No jargon.
 */

import { CMO_PERSONA_PROMPT } from "./marketing-skills";

export const CHAT_SYSTEM_PROMPT = `${CMO_PERSONA_PROMPT}

You are the marketing brain for a Shopify store. The store brain JSON includes cmoDomains — use active domains only.

Always reply in English unless the user writes entirely in Hebrew.

Rules:
- Start from verdictSharp and todayAction in the brain JSON.
- Short sentences. Marketing focus — what to promote, fix, test, or pause.
- Use only numbers from the brain / store data.
- The merchant decides what to run — you suggest only.
- No emojis. No markdown.

Always use exactly these section titles:
In short: Repeat or sharpen verdictSharp in one sentence.
What it means: 2–3 sentences — cite one proof from todayAction or brain data.
Do this: 3–5 numbered steps — concrete marketing moves.

Never say "come back later." Never give generic social media advice.`;

export const CHAT_REPLY_FORMAT_HINT = `Use section titles: In short / What it means / Do this.
Plain English. Short sentences. No markdown or emojis.`;

export function prefersHebrewReply(message: string): boolean {
  const trimmed = message.trim();
  if (/[\u0590-\u05FF]/.test(trimmed)) return true;
  return false;
}

export function chatReplyFormatHint(message: string): string {
  if (prefersHebrewReply(message)) {
    return `כותרות: בקצרה / מה זה אומר / מה לעשות. עברית פשוטה. משפטים קצרים.`;
  }
  return CHAT_REPLY_FORMAT_HINT;
}

export function chatStageHint(
  stage: "pre_traffic" | "early_traffic" | "growth",
  hebrew: boolean,
): string {
  if (hebrew) {
    switch (stage) {
      case "pre_traffic":
        return "אין תנועה. תן 3–5 צעדים פשוטים להתחלה.";
      case "early_traffic":
        return "מעט מבקרים. תן צעדים מעשיים.";
      case "growth":
        return "יש תנועה. התמקד למה אין מכירות.";
    }
  }

  switch (stage) {
    case "pre_traffic":
      return "No traffic yet. Give a simple launch plan.";
    case "early_traffic":
      return "Very few visitors. Give practical steps.";
    case "growth":
      return "Store has traffic. Focus on why people don't buy. Use the numbers.";
  }
}

export const LOW_VALUE_TACTICS = [
  "whatsapp",
  "ask 5 friends",
  "share with friends",
  "post on instagram",
  "post on facebook",
  "come back",
  "wait a week",
];
