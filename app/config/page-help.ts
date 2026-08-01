export type PageHelp = {
  title: string;
  subtitle: string;
  tips: string[];
  helpTitle: string;
  helpItems: Array<{ label: string; text: string }>;
};

export const PAGE_HELP: Record<string, PageHelp> = {
  overview: {
    title: "What's blocking sales?",
    subtitle:
      "Store health, conversion funnel, and your top 3 fixes — ranked by revenue impact.",
    tips: [
      "Enable tracking in your theme (about one minute)",
      "Browse your storefront — 2–3 product pages",
      "Generate priorities to see ranked fixes",
    ],
    helpTitle: "How Solution finds blockers",
    helpItems: [
      {
        label: "1. Track",
        text: "We see who visits, what they view, and where they leave — no tracking means no diagnosis.",
      },
      {
        label: "2. Diagnose",
        text: "Funnel drop-offs, high-exit pages, and views-without-sales point to what's broken.",
      },
      {
        label: "3. Fix",
        text: "AI ranks concrete fixes (copy, product page, pricing signals) — start with High priority.",
      },
    ],
  },
  analytics: {
    title: "Conversion & traffic",
    subtitle:
      "Funnel, traffic sources, product views, and exit pages — last 30 days.",
    tips: [
      "Big drop between product views and cart? Check product pages first",
      "High traffic + low sales = conversion problem, not a traffic problem",
      "Exit pages show where buyers give up",
    ],
    helpTitle: "Reading conversion signals",
    helpItems: [
      {
        label: "Funnel",
        text: "Visitors → product views → add to cart → purchase. The biggest drop is your first fix.",
      },
      {
        label: "Product views",
        text: "Many views, few purchases = price, images, trust, or description — not 'more ads'.",
      },
      {
        label: "Exit pages",
        text: "Where people leave without buying — often shipping, pricing, or weak product pages.",
      },
    ],
  },
  segments: {
    title: "Visitor groups",
    subtitle:
      "See who converts vs who bounces — by source, device, and country.",
    tips: [
      "Refresh after you have traffic",
      "Compare mobile vs desktop conversion",
      "Use groups to focus fixes, not just ads",
    ],
    helpTitle: "Why segments matter for CRO",
    helpItems: [
      {
        label: "Source quality",
        text: "Facebook mobile traffic that never buys is a different fix than Google desktop that almost converts.",
      },
      {
        label: "Return visitors",
        text: "People who came back but didn't buy — often price, shipping, or trust.",
      },
      {
        label: "Refresh",
        text: "Run Refresh groups after new traffic or campaign changes.",
      },
    ],
  },
  recommendations: {
    title: "Fixes ranked by impact",
    subtitle:
      "What to change on your store first — dismiss or mark done as you go.",
    tips: [
      "Start with High priority — biggest revenue lift",
      "Each fix explains why it matters from your data",
      "Refresh after you ship a change",
    ],
    helpTitle: "How to use the fix list",
    helpItems: [
      {
        label: "Priority",
        text: "High = likely blocking sales now. Medium = next. Low = polish when you have time.",
      },
      {
        label: "Evidence",
        text: "Each item ties to your funnel, products, or orders — not generic tips.",
      },
      {
        label: "Action steps",
        text: "Concrete changes in Shopify Admin — product, theme, or checkout.",
      },
    ],
  },
  reports: {
    title: "Weekly conversion summary",
    subtitle:
      "What changed in traffic and sales — and which fixes to focus on next.",
    tips: [
      "Generate once per week",
      "Read Key takeaways first",
      "Share with whoever runs the store",
    ],
    helpTitle: "What's in the report",
    helpItems: [
      {
        label: "What changed",
        text: "Traffic, conversion, and product shifts in plain language.",
      },
      {
        label: "Fixes",
        text: "Ranked actions for the week ahead.",
      },
      {
        label: "Waste",
        text: "Traffic or pages that visit but never buy.",
      },
    ],
  },
  chat: {
    title: "Conversion coach",
    subtitle:
      "Ask why visitors aren't buying — answers use your funnel and order data.",
    tips: [
      "Try: Why aren't visitors buying?",
      "Plain English, no jargon",
      "Private — customers never see this",
    ],
    helpTitle: "Example prompts",
    helpItems: [
      {
        label: "No sales",
        text: "Why aren't visitors buying?",
      },
      {
        label: "First fix",
        text: "What should I fix first this week?",
      },
      {
        label: "Product page",
        text: "Which product page is hurting conversion?",
      },
    ],
  },
};
