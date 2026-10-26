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
- Quote submit uses `QUOTE_WEBHOOK_URL` — **never fake success** if missing/failing; PII only with consent
- Same-category combo conflict warning (keep both / replace)
- Admin can explicitly confirm fitment (verified / unverified / incompatible) — never defaults to verified
- Catalog images under `public/placeholders/` (replace with brand assets when ready)
- Customer UI/PDF: no fake business contact; neutral “liên hệ cửa hàng” until real details exist
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

Missing fitment record → **needs verification / cần xác minh**. UI badges, chat stub, and PDF disclaimers all enforce this.

## Env

Copy `.env.example` → `.env.local`. Names only for quote submit:

- `QUOTE_WEBHOOK_URL` — required for successful quote request
- `QUOTE_WEBHOOK_SECRET` — optional bearer for the webhook

`OPENAI_API_KEY` is never required for this MVP.

## Quote input validation

Quote submission accepts only the current storefront catalog, a valid vehicle cascade (or no vehicle), USD, and explicit boolean consent. Quantities are integers from 1 to 99; requests are limited to 100 distinct product lines. Names, contact fields and notes have bounded lengths. Contact details **or free-form notes** require consent.

The server rebuilds product labels, SKU, vehicle labels and fitment from the same current catalog used by the storefront. It recomputes prices and totals; stale or altered monetary fields are rejected rather than silently changing the submitted quote. Zero line labor remains the existing parts-only option. Unknown products, duplicate IDs and malformed data are rejected before any webhook request. This does not replace sample data with verified products, add durable hosted storage, configure a webhook, or authorize production use.

Regression tests stub transport; they never submit actual contact details to a webhook.

### Local catalog consistency trial (no paid provider)

`readCatalog()` is the one runtime catalog source used by recommendations, combo,
quote/PDF models, and server-side quote validation. It reads the same product and
fitment adapter as the admin API. Pages render at request time; `/api/catalog`
returns `Cache-Control: no-store`. Client navigation/tab focus refreshes the catalog,
and PDF/export or request submission obtains a fresh snapshot immediately before
building the quote. Submission is independently validated again on the server.
An item hidden since combo selection must be removed from the combo; it is not
silently dropped from a PDF. Invalid/corrupt overrides fail visibly, not as seed data.

Storage policy:
- `npm run dev` and tests use local JSON overrides in `data/admin` (missing files
  read seed demo data without writing anything).
- For an **explicit local production-build test only**, use
  `CATALOG_STORAGE=local npm start`. `CATALOG_LOCAL_DIR=/absolute/test/directory`
  can isolate disposable test data. Writes replace files atomically; this is a
  single-process local trial adapter, **not a concurrent durable database**.
- Production without that opt-in is read-only demo seed mode. Vercel, Netlify and
  AWS Lambda always remain read-only even with the local opt-in. Admin mutations
  return HTTP 503 with a storage explanation instead of claiming a successful save.
  A genuine durable provider is still required before enabling hosted editing.
- No provider, account, deployment, webhook, or paid service was configured by this
  change. The existing demo authentication and public storefront/catalog boundary
  are unchanged; this is **not a privacy/authentication production hardening**.
- Only demo retail price and billed installation labor are intended for the public
  catalog (`laborCostUsd` is the existing billed-labor field name, not a private
  procurement-cost field). The public DTO allowlists fields and excludes extra
  internal metadata and verifier email. Do not put real private customer/business
  data into seed files, tracked admin JSON, or the public storefront.
- Vehicle creation and a complete product/fitment administration redesign are not
  included. Existing-product admin edits accept price, billed labor and visibility;
  translation keys and product metadata are preserved.

Regression coverage includes admin API save → no-store catalog → quote/PDF model →
server validation, fresh export after a price change, hidden items, persisted rereads,
fitment/evidence, malformed storage, and refusal to save on unsupported hosts.

### Toyota / Lexus catalog trial

`/vi/catalog` and `/en/catalog` browse 45 unverified CarPlay configurations,
not 45 independently priced products. Configuration references have unknown
price, labor, stock and shipping; they cannot be added to a priced combo or
exported as a completed priced quote. There is no Camry CarPlay match in this
source. Source supplier codes, costs, raw notes, source identifiers and photos
are deliberately absent from the public reference data.

The two owner-priced Botslab cameras are USD 115 / USD 230, **hardware only**.
Installation is excluded, tax inclusion and shipping remain unconfirmed. The
2CH exact model and package contents require confirmation. Neutral placeholders
are not actual product photos. Quotes/PDFs show known-price subtotals, not final
payable totals. Sample products remain available only through an explicit toggle
and are marked as unapproved sample pricing in combos, quotes and saved drafts.
No paid API, operational system integration, image publication or production
storage was added; existing hosted admin mutations remain read-only (503).
