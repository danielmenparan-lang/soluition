/** Customer-facing product copy */
export const POSITIONING = {
  productName: "Solution",

  tagline: "One marketing move for today — from your store data.",

  todayLabel: "Do today",

  /** Answers in 5 sec: what / first action / time */
  landingHeadline: "Know what to market today",
  landingSubhead:
    "Solution reads your Shopify store and gives you one clear action — not a dashboard to figure out.",
  landingTime: "About 3 minutes to set up",
  landingOutcome: "You'll get a ranked marketing action you can apply today.",

  welcomeTitle: "Connect your store data",
  welcomeLead:
    "Enable visitor tracking, browse your storefront once — then get clear marketing actions.",

  homeTitle: "Home",
  homeActiveLead: "Your store data is connected. Scan anytime for fresh actions.",

  diagnosticTitle: "Ad readiness",
  diagnosticPending:
    "Need a few visitors first. Enable tracking and browse your storefront once.",

  dropOffTitle: "Where buyers drop off",
  dropOffLead: "Use this in ads, email, and product pages.",

  chatTitle: "Marketing chat",
  chatLead: "Ask about your store — answers use the same data as Home.",

  actionsTitle: "Today's move",
  actionsLead: "Based on your last 30 days. Approve, then apply in Shopify or your ad account.",

  responsibilityNotice:
    "Suggestions only. You approve every action — outcomes are your responsibility.",

  responsibilityAck:
    "I approve this action and accept that results are my responsibility.",

  responsibilityAckShort: "I approve this action.",

  proTitle: "Pro — $19.99/month",
  proText: "Unlimited scans, chat, and order sync.",

  starterTitle: "Starter — $9.99/month",
  starterText: "10 scans and 10 chat messages per week.",
} as const;

export const LANDING_BENEFITS = [
  {
    id: "actions",
    title: "Daily actions",
    text: "Ranked steps — what to fix or market first.",
  },
  {
    id: "ads",
    title: "Ad readiness",
    text: "A score that tells you when paid traffic is safe.",
  },
  {
    id: "chat",
    title: "Marketing chat",
    text: "Ask anything — answers use your store numbers.",
  },
] as const;

export const CHAT_STARTERS = [
  "What should I market first?",
  "Which product to push in ads?",
  "Why no sales from my traffic?",
] as const;

export const APP_STORE = {
  name: "Solution — Marketing for Shopify",
  subtitle: "Store data → one clear action today.",
  keywords:
    "marketing, shopify, ads, conversion, traffic, chat, actions, sales",
} as const;
