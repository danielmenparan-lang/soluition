# Marketing Solution

**AI Marketing Intelligence Platform for Shopify**

מערכת AI מתקדמת שמתחברת לחנות Shopify, אוספת נתוני מבקרים והתנהגות, מנתחת אותם עם Claude AI, ומספקת מנהל שיווק AI שמזהה בעיות, מוצא הזדמנויות וממליץ על פעולות להגדלת מכירות.

## תכונות

| מודול | תיאור |
|-------|--------|
| **Data Collection** | מעקב מבקרים, sessions, דפים, פעולות e-commerce |
| **Product Intelligence** | ניתוח conversion לפי מוצר, זיהוי פוטנציאל |
| **Marketing Attribution** | UTM, מקורות תנועה, revenue לפי ערוץ |
| **Visitor Segmentation** | High Intent, Window Shoppers, Returning Customers |
| **Analytics Engine** | KPIs, bounce pages, peak hours |
| **AI Brain (Claude)** | ניתוח חכם והמלצות מבוססות נתונים |
| **AI Recommendations** | שיווק, מוצר, conversion, retargeting |
| **AI Chat** | צ'אט שמכיר את נתוני החנות |
| **Weekly Report** | דוח שבועי אוטומטי עם 10 תובנות |
| **Admin Dashboard** | 6 מסכים מלאים בתוך Shopify Admin |

## ארכיטקטורה

```
shopify-marketing-solution/
├── app/
│   ├── routes/          # Dashboard + API endpoints
│   ├── services/        # Business logic
│   └── types/           # TypeScript types
├── extensions/
│   └── marketing-tracker/  # Theme app extension
├── public/
│   └── tracker.js       # Storefront tracking script
├── supabase/
│   └── migrations/      # PostgreSQL schema
└── prisma/              # Shopify session storage
```

## דרישות

- Node.js 20+
- Shopify Partner account + dev store
- Supabase project
- Anthropic API key (Claude)

## התקנה

### 1. Clone & Install

```bash
cd shopify-marketing-solution
npm install
cp .env.example .env
```

### 2. Supabase

1. צור פרויקט ב-[Supabase](https://supabase.com)
2. הרץ את המיגרציה:
   ```bash
   # העתק את supabase/migrations/001_initial_schema.sql ל-SQL Editor ב-Supabase
   ```
3. העתק `SUPABASE_URL` ו-`SUPABASE_SERVICE_ROLE_KEY` ל-`.env`

### 3. Claude AI

הוסף ל-`.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Shopify App

```bash
npm run dev
```

בפעם הראשונה, Shopify CLI יבקש:
- לבחור Partner organization
- ליצור/לקשר app
- לבחור dev store

### 5. התקנת Tracking

**אופציה A — Theme Extension (מומלץ):**
1. `shopify app deploy` לפריסת ה-extension
2. ב-Theme Editor → App embeds → הפעל "Marketing Solution Tracker"
3. הזן Tracking ID (ממסך הסקירה באפליקציה)

**אופציה B — Script Tag ידני:**
```html
<script src="https://YOUR-APP-URL/tracker.js" data-tracking-id="YOUR_TRACKING_ID" async></script>
```

## מסכי Dashboard

| מסך | נתיב | תיאור |
|-----|------|--------|
| סקירה | `/app` | KPIs, המלצות אחרונות, Tracking ID |
| אנליטיקה | `/app/analytics` | מקורות, מוצרים, bounce pages |
| קהלים | `/app/segments` | Segments אוטומטיים + פילוח |
| המלצות AI | `/app/recommendations` | המלצות לפי קטגוריה |
| דוחות | `/app/reports` | דוח שבועי AI |
| צ'אט | `/app/chat` | שיחה עם מנהל השיווק AI |

## API Endpoints

| Endpoint | Method | תיאור |
|----------|--------|--------|
| `/api/track` | POST | קבלת events מה-storefront |
| `/tracker.js` | GET | סקריפט המעקב |

## פקודות

```bash
npm run dev          # פיתוח עם Shopify CLI
npm run build        # Build production
npm run deploy       # Deploy app + extensions
npm run typecheck    # TypeScript check
```

## Future Automation Layer

המערכת מוכנה להרחבה עתידית:
- יצירת קהלי פרסום אוטומטית
- יצירת creative ideas
- כתיבת טקסטים למודעות
- שיפור תוכן מוצר
- Retargeting automation
- ביצוע פעולות מאושרות דרך Shopify API

## Tech Stack

- **Frontend:** React Router 7 + Shopify Polaris Web Components
- **Backend:** Node.js + Shopify App React Router
- **Database:** Supabase (PostgreSQL) + SQLite (sessions)
- **AI:** Claude Sonnet (Anthropic)
- **Tracking:** Custom JS + Theme App Extension
