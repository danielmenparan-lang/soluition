# Render Environment — העתק ל-Dashboard

> Render → shopify-marketing-solution → **Environment** → Add each variable → **Save** → **Deploy**

## חובה

| Key | מאיפה | דוגמה |
|-----|--------|--------|
| `DATABASE_URL` | Supabase → **Connect** → Session pooler → URI | `postgresql://postgres.brmcddfmkgvsfbmtvtwf:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?connect_timeout=30` |
| `SHOPIFY_API_KEY` | dev.shopify.com → solution → Client ID | `00eb38f774ffba914d98a6800f4c5df5` |
| `SHOPIFY_API_SECRET` | dev.shopify.com → solution → Client secret → Reveal | `shpss_...` |
| `SHOPIFY_APP_URL` | כתובת Render | `https://shopify-marketing-solution.onrender.com` |
| `SUPABASE_URL` | Supabase → Settings → API | `https://brmcddfmkgvsfbmtvtwf.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role | `eyJ...` |
| `ANTHROPIC_API_KEY` | Anthropic dashboard | `sk-ant-...` |
| `HOST` | קבוע | `0.0.0.0` |
| `PORT` | קבוע | `10000` |
| `SCOPES` | קבוע | `read_products,read_orders,read_customers,read_analytics,write_script_tags,read_content` |

## DATABASE_URL — טעויות נפוצות

- ❌ `db.xxx.supabase.co` (Direct — לא עובד ב-Render, IPv4)
- ❌ `postgresql://postgres:pass@pooler...` (חסר `.brmcddfmkgvsfbmtvtwf` אחרי postgres)
- ✅ `postgresql://postgres.brmcddfmkgvsfbmtvtwf:pass@aws-0-REGION.pooler.supabase.com:5432/postgres`

## בדיקה

```
https://shopify-marketing-solution.onrender.com/health  →  ok
```

## אחרי Live

```powershell
cd C:\Users\User\Projects\shopify-marketing-solution
npm run deploy
```

(מעדכן URL ב-Shopify Partners)
