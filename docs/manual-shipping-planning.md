# Local manual shipping-planning prototype

Scope: AI Car Upgrade only; no provider calls, purchases, external storage, deployment, or KietAuto integration.

## Try it locally

Use the existing demo admin login and open `/vi/admin/products` or `/en/admin/products`.
Expand a product's **Manual internal shipping planning** section. Enter supplier/source, separate stock status and manual order note, an earliest/latest calendar arrival date and the date the source was actually checked. Select the products required for a package using the checkboxes.

For shipping costs, set a shipment/order group ID and the **whole-group** fee in USD. Use the same supplier, fee and fee-status on every member of one group. Save each product using its existing Save button. These are internal sourcing costs, not approved customer selling charges. A known fee requires supplier, group, amount and checked date. Zero is allowed only when explicitly estimated/confirmed; unknown has no amount. Calendar dates must be real, arrival ranges ordered, and checked dates cannot be in the future.

The summary previews current edits including unsaved ones; group selection itself is ephemeral. Save/reload persists product metadata only through the existing local catalog adapter. Hosted/serverless environments remain read-only without a supported durable adapter. Existing seed products have no fulfillment metadata and show unknowns.

## Safety/semantics

- Distinct groups are added; one shared group is counted once. Any inconsistent amount, supplier or fee status invalidates that group's fee. Unknown groups/ungrouped items prevent a complete-total claim.
- Known estimated and manually confirmed portions are shown separately, never as a total when incomplete. Unknown is not interpreted as free.
- All-items-ready window is max(earliest dates) through max(latest dates), only when every selected required product has both arrival dates, a checked date, and usable stock status. Otherwise it is incomplete. No inferred business days, live availability, actual tracking or arrival guarantee.
- Product selections do not represent an actual placed order or a customer quote's quantities. Recheck supplier fee and ETA after any quantity, destination or shipment change. Stock/order statuses are manual notes, not operations performed by the app.
- Data can become stale; the operator must recheck current source information. No automatic freshness guarantee.
- Public catalog DTO excludes the entire fulfillment object. Customer quote/PDF code and totals are unchanged. Supplier/source/cost data never become customer prices; owner approval and a separate selling-shipping model are required before adding shipping to customer quotes.
- No change to fitment status or technician verification requirements. Demo access controls are not a production privacy/security certification; do not enter real sensitive supplier/customer data into the demo.

## Regression coverage

`shipping-planning.test.ts`: legacy/missing metadata, multiple vendors, shared group deduplication/conflicts, incomplete fees/ETA, date/cents validation, explicit zero, public DTO/PDF-model privacy and unchanged customer totals.

`shipping-planning-ui.test.tsx`: manual/private/incomplete boundary labels, old-product empty fields, entering metadata, clearing unknown fee.

`catalog-consistency.test.ts`: admin write/local reread, invalid metadata rejection, public projection privacy and unchanged pricing.

PDF layout was not modified. Existing PDF layout/format/export tests continue to run; no new rendered PDF is claimed.
