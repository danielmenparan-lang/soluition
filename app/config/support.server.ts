/** Merchant-facing support contact — override with SUPPORT_EMAIL in Render/.env */
export function getSupportEmail(): string {
  return process.env.SUPPORT_EMAIL?.trim() || "support@solu-ai.com";
}
