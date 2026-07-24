import { LOW_VALUE_TACTICS } from "../config/chat-voice";

/** Reject replies that slip into generic free advice. */
export function rejectLowValueReply(text: string): boolean {
  const lower = text.toLowerCase();
  return LOW_VALUE_TACTICS.some((phrase) => lower.includes(phrase));
}
