export type PageHelp = {
  title: string;
  subtitle: string;
  tips: string[];
  helpTitle: string;
  helpItems: Array<{ label: string; text: string }>;
};

export const PAGE_HELP: Record<string, PageHelp> = {
  overview: {
    title: "Why no sales?",
    subtitle: "Your store score and top fixes — simple and clear.",
    tips: [
      "Turn on tracking in your theme (1 minute)",
      "Browse your store — 2–3 product pages",
      "Open Chat or tap Get fixes",
    ],
    helpTitle: "How it works",
    helpItems: [
      { label: "1. Track", text: "We see who visits and what they view." },
      { label: "2. Find", text: "We spot where people leave without buying." },
      { label: "3. Fix", text: "You get a short list — start with Do first." },
    ],
  },
  analytics: {
    title: "Traffic & sales",
    subtitle: "Who visited, where they came from, and where they left — last 30 days.",
    tips: [
      "Many views but no sales? Fix the product page first",
      "Lots of traffic but no sales? It's not an ads problem yet",
      "Check exit pages — where people give up",
    ],
    helpTitle: "How to read this",
    helpItems: [
      { label: "Visitors", text: "How many people came to your store." },
      { label: "Product views", text: "Views without sales = something on the page is wrong." },
      { label: "Exit pages", text: "Pages people leave from — often price or shipping." },
    ],
  },
  segments: {
    title: "Visitor groups",
    subtitle: "Who buys and who leaves — by source, phone vs desktop, country.",
    tips: ["Tap Refresh after you have traffic", "Compare phone vs desktop", "Fix the group that almost buys"],
    helpTitle: "Why this helps",
    helpItems: [
      { label: "Traffic source", text: "Facebook that never buys needs a different fix than Google." },
      { label: "Return visitors", text: "Came back but didn't buy? Often price or shipping." },
      { label: "Refresh", text: "Tap Refresh groups to update." },
    ],
  },
  recommendations: {
    title: "What to fix",
    subtitle: "A short list — most important first. Tap Done when finished.",
    tips: ["Start with Do first", "Each item says why", "Tap Get fixes for a fresh list"],
    helpTitle: "How to use",
    helpItems: [
      { label: "Do first", text: "Fix this before anything else." },
      { label: "Why", text: "Each item uses your store numbers — not generic tips." },
      { label: "Steps", text: "Plain steps you can do in Shopify Admin." },
    ],
  },
  reports: {
    title: "Weekly summary",
    subtitle: "What changed this week and what to fix next.",
    tips: ["Make one report per week", "Read the summary first", "Share with your team"],
    helpTitle: "What's inside",
    helpItems: [
      { label: "Summary", text: "Traffic and sales in plain words." },
      { label: "Fixes", text: "What to work on next." },
      { label: "Waste", text: "Traffic that visits but never buys." },
    ],
  },
  chat: {
    title: "Chat",
    subtitle: "Ask anything. Get a clear answer based on your store.",
    tips: ["Try: Why no sales?", "Short answers, plain English", "Only you see this — not customers"],
    helpTitle: "Try asking",
    helpItems: [
      { label: "Sales", text: "Why no sales?" },
      { label: "First fix", text: "What should I fix first?" },
      { label: "Bad page", text: "Which page loses buyers?" },
    ],
  },
};
