/** Marketing product positioning — store data → marketing actions */
export const POSITIONING = {
  productName: "Solution",

  tagline: "Your store data, turned into marketing actions.",

  welcomeTitle: "Connect your store data",
  welcomeLead:
    "Enable tracking, browse your store once, then get marketing actions based on real visitors.",

  diagnosticTitle: "Store snapshot",
  diagnosticPending:
    "Need a few visitors first. Enable tracking and browse your storefront once.",

  dropOffTitle: "Where buyers drop off",
  dropOffLead: "Use this in ads, email, and product pages.",

  chatTitle: "Marketing chat",
  chatLead:
    "Ask anything about your store. We read your data and suggest marketing actions — you decide what to run.",

  actionsTitle: "Marketing actions",
  actionsLead:
    "Ranked ideas from your data. You approve and run each one — results are your responsibility.",

  responsibilityNotice:
    "Suggestions only. You approve every action — outcomes are your responsibility.",

  responsibilityAck:
    "I approve this action and accept that results are my responsibility.",

  proTitle: "Pro — $19.99/month",
  proText: "Unlimited scans, chat, and order sync.",

  starterTitle: "Starter — $9.99/month",
  starterText: "10 scans and 5 chat messages per day.",
} as const;

export const CHAT_STARTERS = [
  "What should I market first?",
  "Which product to push in ads?",
  "Why no sales from my traffic?",
] as const;

export const APP_STORE = {
  name: "Solution — Marketing Actions for Shopify",
  subtitle: "Store data → marketing actions. Chat + ranked steps in Admin.",
  keywords:
    "marketing, shopify, ads, conversion, traffic, chat, recommendations, store data, sales",
} as const;
