# Render Environment — העתק ל-Dashboard

> Render → shopify-marketing-solution → **Environment** → Add each variable → **Save** → **Deploy**

## ⚠️ בעיה נפוצה — מפתחות של Profit Brain

אם האפליקציה פותחת `profit-brain-ai.fly.dev` — **SHOPIFY_API_KEY שגוי ב-Render**.

| ❌ שגוי (Profit Brain) | ✅ נכון (solution) |
|------------------------|-------------------|
| `fe4d228456a8721ec3e9a21a78448ec6` | `00eb38f774ffba914d98a6800f4c5df5` |
| `https://profit-brain-ai.fly.dev` | `https://shopify-marketing-solution.onrender.com` |

## חובה

| Key | ערך נכון |
|-----|----------|
| `SHOPIFY_API_KEY` | `00eb38f774ffba914d98a6800f4c5df5` |
| `SHOPIFY_API_SECRET` | מ-Partners → **solution** → Client secret (לא Profit Brain!) |
| `SHOPIFY_APP_URL` | `https://shopify-marketing-solution.onrender.com` |
| `DATABASE_URL` | Supabase Session pooler (ראה למטה) |
| `SUPABASE_URL` | `https://brmcddfmkgvsfbmtvtwf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | מ-Supabase → Settings → API |
| `ANTHROPIC_API_KEY` | מ-Anthropic |
| `HOST` | `0.0.0.0` |
| `SCOPES` | *(leave empty — app uses theme embed only, no Admin API scopes)* |

> **אל תגדיר `PORT` ידנית** — Render מזריק PORT אוטומטית.

## DATABASE_URL

```
postgresql://postgres.brmcddfmkgvsfbmtvtwf:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

### ECIRCUITBREAKER (too many authentication failures)

1. Supabase → **Database** → **Reset database password**
2. Connect → Session pooler → העתק URI **חדש**
3. Render → עדכן `DATABASE_URL`
4. **המתן 15–30 דקות** (Supabase חוסם זמנית)
5. Manual Deploy

### Session table

הרץ `supabase/session-table.sql` ב-Supabase SQL Editor.

## Settings

**Build Command:**
```
npm ci --include=dev && npm run build && npx prisma generate
```

**Start Command:**
```
node scripts/render-start.mjs
```

## בדיקה

```
https://shopify-marketing-solution.onrender.com/health
```

חפש:
- `"apiKeyPrefix": "00eb38f7"`
- `"apiKeyMatchesApp": true`
- `"appUrlMatches": true`
- `"connected": true`
- `"sessionTableReady": true`

## פתיחת האפליקציה

https://admin.shopify.com/store/solution-vyndgruj/apps/00eb38f774ffba914d98a6800f4c5df5
