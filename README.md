# KietAuto — AI Car Upgrade (Phase 1 MVP)

Greenfield Next.js app for honest accessory recommendations, combo quotes, and a mock AI chat stub.

**Independent repo** — not related to any legacy KietAuto system.

## Stack

- Next.js App Router · TypeScript · Tailwind CSS
- `next-intl` (default locale **`vi`**, English switch)
- Auth.js (NextAuth v5) credentials + RBAC roles (`admin` | `editor`) — **dev stub**
- `@react-pdf/renderer` for PDF quotes
- `AiClient` interface + `MockAiClient` (rule-based). `OpenAiClient` stub throws / no network in Phase 1

## Phase 1 constraints

- JSON sample data only (`data/`) — no real customer PII
- No paid API calls (OpenAI etc.)
- Fitment defaults to **unverified**; never claim compatibility unless verified
- Admin edits persist to `data/admin/products.json` and `data/admin/fitment.json` (sample mode)
- Categories include dashcam, CarPlay, Android head unit, 360 camera, lights, **power liftgate (cốp điện)**, and other accessories
- Clear **Yêu cầu báo giá / Request quote** CTA on product cards, combo, and quote page
- Admin can explicitly confirm fitment (verified / unverified / incompatible) — never defaults to verified
- Placeholder images/logos under `public/placeholders/`
- Preview hosting OK; **no production deploy** until requested

## Scripts

```bash
npm install
npm run dev      # http://localhost:3000 → redirects to /vi
npm run build
npm start
npm test
npm run lint
```

## Demo admin

| Role   | Email                 | Password     |
|--------|-----------------------|--------------|
| admin  | admin@kietauto.local  | admin-demo   |
| editor | editor@kietauto.local | editor-demo  |

Production must use a real IdP (OAuth/OIDC). This credentials stub models sessions/roles only.

## Fitment honesty

Missing fitment record → **unverified**. UI badges, chat stub, and PDF disclaimers all enforce this.

## Env

Copy `.env.example` → `.env.local`. See variables there. `OPENAI_API_KEY` is never required for Phase 1.
