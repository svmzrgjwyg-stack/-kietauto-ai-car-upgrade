# Local demo quote drafts

This increment extends the existing AI Car Upgrade app, without a new provider or remote deployment.

## Trial workflow

On `/vi/quote` or `/en/quote`, choose a complete vehicle and at least one product, enter a non-personal demo title, then save. The list supports review/reopen, duplicate and confirmed delete. Reopening always asks for confirmation and refreshes the catalog again at acceptance. Price, labor, SKU and fitment changes are displayed explicitly. Missing products or vehicles block restore; no lines are silently removed. Historical snapshots remain unchanged. Customer fields on the current quote form are cleared after successful restore.

Export a JSON backup before clearing browser data or changing Preview hostname. Import validates the entire file and adds new copies; it does not overwrite matching drafts. Invalid, oversized or unsupported backups leave existing drafts intact. Corrupt saved-draft storage is not automatically overwritten.

## Important boundaries

- LocalStorage belongs to this browser and origin only. This is NOT cloud storage, cross-device synchronization or shared access for two people.
- Demo data only. No customer/contact/note fields or supplier metadata are included. The free-text title still depends on the user following the explicit no-personal-information warning.
- Backups are plain JSON, not encrypted. Stored snapshots are reference values, not proof of current prices or fitment. Imported fitment is never promoted into the actual catalog.
- Maximum 50 drafts, 30 items per draft, quantity 1–99, backup 1 MB.
- Working vehicle and combo are stored in a single validated localStorage envelope. Legacy current-state keys are read if the new envelope does not exist. Restore writes the envelope successfully before changing React state.
- Current quote/PDF pricing is still calculated by the canonical model with catalog refresh. A saved demo draft is not an issued quote; this does not change the PDF quote-number behavior.
- Vercel catalog writes still fail honestly with 503 when durable storage is unavailable. No webhook, authentication, admin catalog, provider, API key, paid service or deployment behavior was added.
- Cross-tab changes refresh the draft list, but there is no distributed locking or multi-user concurrency guarantee.

## Validation

- 160 tests passed (16 files), including 27 new core/storage/UI cases.
- TypeScript and production build passed.
- ESLint: no errors, two existing admin hook warnings.
- Tests cover persistence/remount, imports as copies, corrupted storage, quota failure, atomic restore failure, changed prices and fitment, hidden products, confirmation recheck, cancel, repeated clicks, duplicate/delete, VI/EN text and quantity normalization.
- Headless Chromium visual QA could not run in the execution sandbox: browser launch failed with `socket() failed: Operation not permitted`. No screenshot or real iPhone/Safari verification is claimed. Browser/Preview QA remains required before treating the UI as release-ready.
