export type PageHelp = {
  title: string;
  subtitle: string;
  tips: string[];
  helpTitle: string;
  helpItems: Array<{ label: string; text: string }>;
};

export const PAGE_HELP: Record<string, PageHelp> = {
  overview: {
    title: "Solution — sell more with clear next steps",
    subtitle:
      "Solution tracks store visitors, analyzes behavior, and gives you a short list of what to fix or promote.",
    tips: [
      "First — turn on tracking in your theme (about one minute)",
      "Then — browse your storefront once or twice",
      "Finally — run a scan and get AI recommendations",
    ],
    helpTitle: "How it works",
    helpItems: [
      {
        label: "1. Track",
        text: "Solution counts who visits, where they came from, and what they viewed. No tracking = no data.",
      },
      {
        label: "2. Analyze",
        text: "We find what drives sales, what causes drop-off, and where you lose money.",
      },
      {
        label: "3. Act",
        text: "You get recommendations, chat answers, and weekly reports — all inside Shopify Admin.",
      },
    ],
  },
  analytics: {
    title: "Store activity",
    subtitle:
      "See who visited, where traffic came from, what they viewed, and how they converted — last 30 days.",
    tips: [
      "If everything is empty, enable tracking on the Home page first",
      "High views with low purchases usually means something to fix",
      "Check which channels bring real buyers, not just clicks",
    ],
    helpTitle: "How to read the numbers",
    helpItems: [
      {
        label: "Traffic sources",
        text: "Facebook, Google, direct — see what actually drives sales.",
      },
      {
        label: "Product views",
        text: "Many views but few purchases may mean price, images, or copy needs work.",
      },
      {
        label: "Exit pages",
        text: "Pages people leave quickly — worth checking what's missing.",
      },
    ],
  },
  segments: {
    title: "Customer groups",
    subtitle:
      "Visitors grouped by traffic source, device, and country — updated from your tracking data.",
    tips: [
      "Click Refresh groups after you have store traffic",
      "Groups use roughly the last month of data",
      "Use them to target ads to the right audience",
    ],
    helpTitle: "Why this helps",
    helpItems: [
      {
        label: "Focused ads",
        text: "Example: mobile visitors from Facebook vs desktop from Google — different audiences.",
      },
      {
        label: "Return visitors",
        text: "People who already browsed your store are easier to reach again.",
      },
      {
        label: "Refresh",
        text: "Run Refresh groups to recompute from the latest data.",
      },
    ],
  },
  recommendations: {
    title: "What to do next",
    subtitle:
      "AI recommendations sorted by impact — what can grow sales and what to fix first.",
    tips: [
      "First run uses your free output credit",
      "Need a refresh? Click Generate new recommendations",
      "Start with items marked High priority",
    ],
    helpTitle: "How to use the list",
    helpItems: [
      {
        label: "Priority",
        text: "High = do first. Medium = next. Low = when you have time.",
      },
      {
        label: "Why it matters",
        text: "Each item explains why it matters based on your store data.",
      },
      {
        label: "Action steps",
        text: "Under each recommendation you'll see concrete steps in Shopify Admin.",
      },
    ],
  },
  reports: {
    title: "Weekly summary",
    subtitle:
      "A short report for the last 7 days: what changed, what to do, and where budget may be wasted.",
    tips: [
      "Generate a new report once per week",
      "Read Key takeaways first",
      "Share with whoever runs your ads",
    ],
    helpTitle: "What's in the report",
    helpItems: [
      {
        label: "What changed",
        text: "Ups and downs in traffic, products, and conversion — in plain language.",
      },
      {
        label: "What to do",
        text: "Suggested actions for next week, ordered by impact.",
      },
      {
        label: "Waste",
        text: "Traffic or pages that spend budget without returning sales.",
      },
    ],
  },
  chat: {
    title: "Ask the assistant",
    subtitle:
      "Get clear action steps for your store — what to fix, promote, or improve this week.",
    tips: [
      "Every reply ends with numbered action items",
      "Tap a prompt below to start",
      "This chat is for you — customers never see it",
    ],
    helpTitle: "Example prompts",
    helpItems: [
      {
        label: "This week",
        text: "What should I do this week? — get 3–5 concrete steps.",
      },
      {
        label: "First sales",
        text: "How can I get my first sales? — priorities for a new store.",
      },
      {
        label: "Marketing",
        text: "Where should I focus my marketing? — based on your traffic data.",
      },
    ],
  },
};
