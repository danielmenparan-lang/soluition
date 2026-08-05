export type PageHelp = {
  title: string;
  subtitle: string;
  tips: string[];
  helpTitle: string;
  helpItems: Array<{ label: string; text: string }>;
};

export const PAGE_HELP: Record<string, PageHelp> = {
  overview: {
    title: "One brain, all your skills",
    subtitle: "Signals flow in → Solution brain → one verdict and one action for today.",
    tips: [
      "Green signals = data the brain is using",
      "Do today = the brain's top marketing move",
      "Every page feeds the same brain",
    ],
    helpTitle: "How the brain works",
    helpItems: [
      { label: "Signals", text: "Visitors, orders, funnel, products, traffic." },
      { label: "Skills", text: "Diagnostic, drop-offs, segments, actions, chat — connected." },
      { label: "Output", text: "One sharp verdict + Do today. You approve before acting." },
    ],
  },
  analytics: {
    title: "Funnel",
    subtitle: "See where visitors drop — use it in ads, email, and product pages.",
    tips: [
      "Big drop on product page? Fix the offer or creative",
      "Drop at checkout? Check shipping and trust",
      "Compare traffic sources for marketing spend",
    ],
    helpTitle: "How to read this",
    helpItems: [
      { label: "Funnel", text: "Each step shows where people leave." },
      { label: "Exit pages", text: "Pages people leave from — fix in marketing or UX." },
      { label: "Sources", text: "Which channels deserve budget." },
    ],
  },
  segments: {
    title: "Visitor groups",
    subtitle: "Who buys and who leaves — for smarter marketing.",
    tips: ["Tap Refresh after traffic", "Compare phone vs desktop", "Target the group that almost buys"],
    helpTitle: "Why this helps",
    helpItems: [
      { label: "Traffic source", text: "Different sources need different marketing." },
      { label: "Return visitors", text: "Retarget or email — they almost bought." },
      { label: "Refresh", text: "Tap Refresh groups to update." },
    ],
  },
  recommendations: {
    title: "Marketing actions",
    subtitle: "Ranked from your data. Check the box to approve — then apply.",
    tips: ["Start with Start here", "Each item uses your numbers", "Scan again for fresh ideas"],
    helpTitle: "How to use",
    helpItems: [
      { label: "Approve", text: "Check the responsibility box before you act." },
      { label: "Why", text: "Based on your store data — not generic tips." },
      { label: "Steps", text: "Marketing steps in Shopify Admin or ad platforms." },
    ],
  },
  reports: {
    title: "Weekly summary",
    subtitle: "Marketing recap — what changed and what to do next.",
    tips: ["One report per week", "Read summary first", "Share with your team"],
    helpTitle: "What's inside",
    helpItems: [
      { label: "Summary", text: "Traffic and sales in plain words." },
      { label: "Actions", text: "What to market or fix next." },
      { label: "Drop-offs", text: "Where visitors left without buying." },
    ],
  },
  chat: {
    title: "Marketing chat",
    subtitle: "Ask anything — answers use your store data and suggest marketing actions.",
    tips: ["Try: What should I market first?", "Try: Ready for ads?", "You approve every action"],
    helpTitle: "Try asking",
    helpItems: [
      { label: "Focus", text: "What should I market first?" },
      { label: "Ads", text: "Am I ready to run ads?" },
      { label: "Product", text: "Which product to push?" },
    ],
  },
};
