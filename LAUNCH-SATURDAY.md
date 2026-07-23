# הגשה עד שבת — תוכנית פעולה

> **מטרה:** אפליקציה עובדת + הגשה ל-Shopify App Store עד **שבת**  
> **לא עובד:** שישי ערב → שבת ערב

---

## למה תקועים (בשורה אחת)

Render **עובד** (`Your service is live`). הבעיה = **3 משתני סביבה שגויים** ב-Render (מפתחות Profit Brain + סיסמת DB).

**זה לא באג בקוד — זה copy-paste שגוי.** תיקון: 20 דקות.

---

## שני מסלולים — בחר אחד

### מסלול A — Render (מהיר, אם מתקנים env) ⚡ 20 דק

1. Render → Environment — **מחק הכל ותדביק מחדש:**

| Key | Value |
|-----|-------|
| `SHOPIFY_API_KEY` | `00eb38f774ffba914d98a6800f4c5df5` |
| `SHOPIFY_API_SECRET` | Partners → **solution** → Client secret |
| `SHOPIFY_APP_URL` | `https://shopify-marketing-solution.onrender.com` |
| `DATABASE_URL` | Supabase → Connect → Session pooler (URI חדש אחרי reset password) |
| `SUPABASE_URL` | `https://brmcddfmkgvsfbmtvtwf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API → service_role |
| `ANTHROPIC_API_KEY` | Anthropic |
| `HOST` | `0.0.0.0` |
| **אל תגדיר `PORT`** | |

2. Supabase → Database → **Reset password** → Connect → Session pooler → URI חדש
3. Supabase SQL Editor → הרץ `supabase/session-table.sql`
4. Render → Manual Deploy
5. בדוק: `/health` → `apiKeyPrefix: "00eb38f7"`, `connected: true`

### מסלול B — Fly.io (כיוון חדש, יציב יותר) 🚀 ~45 דק

```powershell
cd C:\Users\User\Projects\shopify-marketing-solution
fly auth login
fly apps create marketing-solution-app
fly secrets set SHOPIFY_API_KEY=00eb38f774ffba914d98a6800f4c5df5
fly secrets set SHOPIFY_API_SECRET=shpss_...
fly secrets set SHOPIFY_APP_URL=https://marketing-solution-app.fly.dev
fly secrets set DATABASE_URL="postgresql://postgres.brmcddfmkgvsfbmtvtwf:PASS@...pooler..."
fly secrets set SUPABASE_URL=https://brmcddfmkgvsfbmtvtwf.supabase.co
fly secrets set SUPABASE_SERVICE_ROLE_KEY=eyJ...
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

אחרי deploy — עדכן `shopify.app.toml` + `npm run deploy` עם URL החדש.

---

## היום (רביעי/חמישי) — התקדמות **בלי Render**

```powershell
cd C:\Users\User\Projects\shopify-marketing-solution
```

`.env` מקומי:
```
DATABASE_URL=postgresql://postgres.brmcddfmkgvsfbmtvtwf:PASS@...pooler.../postgres
SHOPIFY_API_KEY=00eb38f774ffba914d98a6800f4c5df5
SHOPIFY_API_SECRET=shpss_...
SHOPIFY_APP_URL=https://shopify-marketing-solution.onrender.com
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
```

```powershell
npm run db:migrate
npm run db:test
shopify app dev
```

→ פתח Admin → Apps → solution. **תראה את האפליקציה עובדת היום.**

---

## לוח זמנים עד שבת

| יום | משימה |
|-----|--------|
| **היום** | `shopify app dev` — אפליקציה עובדת בחנות dev |
| **מחר (חמישי)** | תקן Render env **או** Fly deploy + `/health` ירוק |
| **חמישי אחה"צ** | Privacy policy, screenshots, תיאור listing |
| **שישי בוקר** | `npm run deploy` → Partners → **Submit for review** |
| **שישי ערב+** | לא עובד — הכל מוכן לפני |

---

## הגשה ל-App Store — checklist

- [ ] App URL עובד (Render או Fly)
- [ ] `/health` → `ok: true`
- [ ] Privacy policy: `https://YOUR-URL/privacy`
- [ ] Partners → App listing (שם, תיאור, screenshots)
- [ ] Test on dev store: solution-vyndgruj
- [ ] Submit for review

---

## אל תבזבז זמן על

- ❌ trycloudflare ישירות בדפדפן
- ❌ מפתחות Profit Brain (`fe4d2284...`)
- ❌ `profit-brain-ai.fly.dev`
- ❌ Render PORT override
- ❌ `db.*.supabase.co` (Direct — רק pooler)

---

## קישור נכון לפתיחה

https://admin.shopify.com/store/solution-vyndgruj/apps/00eb38f774ffba914d98a6800f4c5df5
