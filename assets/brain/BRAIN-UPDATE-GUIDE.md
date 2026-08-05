# Solution Brain — what updates it

## When the brain refreshes

| Trigger | What updates |
|---------|----------------|
| New visitor sessions | Signals, funnel, drop-offs, segments |
| **Scan for actions** | Marketing actions, todayAction, domains |
| **Chat message** | Uses latest brain JSON (same snapshot) |
| Order sync (Starter+) | Orders, LTV, products, commerce domain |
| New month / day | Usage limits reset per plan |

## 82 skills in v1 (18 waived)

See `app/config/marketing-skills.ts` — modes `live` + `ai` only.

## Product image

`assets/brain/solution-brain-skills-diagram.png` — use in listing, pitch, onboarding.

## To reach product 10/10 before submit

1. Home = Brain visual loads < 3s with real store data
2. Verdict + Do today always visible after tracking
3. Scan → action #1 matches brain todayAction
4. Chat starts from verdictSharp (same brain)
5. Responsibility checkbox on every action card
6. Onboarding → verdict in one session
7. Listing screenshots: Brain + Do today + Chat + Billing
8. No broken copy, no fake CPA/ROAS claims
