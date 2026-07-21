# פריסה ל-Production — GitHub + Render

## סקירה

```
GitHub  →  Render (שרver)  →  Shopify (מעדכן URL)
                ↓
           Supabase (DB)
```

**Render** — חינמי להתחלה, URL קבוע, deploy אוטומטי מ-GitHub.

---

## שלב 1 — GitHub

```powershell
cd C:\Users\User\Projects\shopify-marketing-solution

git add .
git commit -m "Add Render deployment"
```

צור repo: https://github.com/new  
שם: `shopify-marketing-solution`

```powershell
git remote add origin https://github.com/YOUR_USERNAME/shopify-marketing-solution.git
git branch -M main
git push -u origin main
```

---

## שלב 2 — Render

1. כנס ל-https://render.com → **Sign Up** (עם GitHub)
2. **New +** → **Blueprint**
3. חבר את repo `shopify-marketing-solution`
4. Render יזהה את `render.yaml` אוטומטית
5. **Apply**

---

## שלב 3 — Environment Variables

ב-Render Dashboard → **shopify-marketing-solution** → **Environment**:

| Key | מאיפה |
|-----|--------|
| `SHOPIFY_API_KEY` | Partners → Apps → solution → Client ID |
| `SHOPIFY_API_SECRET` | Partners → Apps → solution → Client secret |
| `SHOPIFY_APP_URL` | `https://shopify-marketing-solution.onrender.com` (אחרי deploy) |
| `SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `ANTHROPIC_API_KEY` | Anthropic dashboard |
| `DATABASE_URL` | Supabase → Settings → Database → **URI** (Direct connection, port **5432**) |

> **DATABASE_URL** — חייב להיות Postgres ישיר (לא pooler 6543):
> `postgresql://postgres.[ref]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
> או: `postgresql://postgres:[PASSWORD]@db.brmcddfmkgvsfbmtvtwf.supabase.co:5432/postgres`

### Prisma Sessions (פעם אחת, מהמחשב)

עדכן `.env` מקומי עם `DATABASE_URL` של Supabase Postgres, ואז:

```powershell
npx prisma migrate deploy
```

---

## שלב 4 — Deploy

Render י-deploy אוטומטically אחרי Blueprint.

URL שתקבל:
```
https://shopify-marketing-solution.onrender.com
```

> **שים לב:** Free tier «נרדם» אחרי 15 דקות — הפתיחה הראשונה אחרי שינה לוקחת ~30 שניות.

עדכן ב-Render Environment:
```
SHOPIFY_APP_URL=https://shopify-marketing-solution.onrender.com
```

---

## שלב 5 — עדכון Shopify

```powershell
# מהמחשב — מעדכן application_url + extensions
npm run deploy
```

או ידנית ב-Partners Dashboard → Apps → solution → Configuration:
- **App URL:** `https://shopify-marketing-solution.onrender.com`
- **Allowed redirection URL:** `https://shopify-marketing-solution.onrender.com/auth/callback`

---

## שלב 6 — התקנה על החנות

```
https://admin.shopify.com/store/solution-vyndgruj/apps/00eb38f774ffba914d98a6800f4c5df5
```

---

## Tracking בחנות

1. פתח האפליקציה → **סקירה** → **Tracking ID**
2. Theme Editor → **App embeds** → **Marketing Tracker**
3. **Tracker URL:** `https://shopify-marketing-solution.onrender.com`

---

## Deploys הבאים

כל `git push` ל-`main` → Render מ-deploy אוטומטically.

```powershell
git add .
git commit -m "your changes"
git push
```

---

## עלות

| שירות | עלות |
|-------|------|
| Render Free | $0 (נרדם אחרי חוסר שימוש) |
| Render Starter | $7/חודש (תמיד online) |
| Supabase | חינמי |
| Claude API | לפי שימוש |

> ל-production אמיתי עם Shopify — מומלץ **Starter ($7)** כדי שהאפליקציה לא «תירדם».

---

## פתרון בעיות

| בעיה | פתור |
|------|------|
| Build failed | Render → Logs → בדוק שגיאות |
| `fetch failed` (Supabase) | ודא `SUPABASE_URL` + `SERVICE_ROLE_KEY` |
| Shopify `example.com` | עדכן `SHOPIFY_APP_URL` + `npm run deploy` |
| איטי בפתיחה ראשונה | Free tier — upgrade ל-Starter |
