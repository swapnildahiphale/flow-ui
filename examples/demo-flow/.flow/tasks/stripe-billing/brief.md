# Stripe billing integration

## What
Wire up Stripe so Tideline can charge the flat $8/mo. Checkout, subscription
lifecycle, and webhook handling. *Waiting on Stripe support* to add our webhook
endpoint to their allowlist. `#api #backend`.

## Why
This is **the GA gate**. Until billing works we can't charge the ~120 beta users
or open public signups (see [business.md](../../kb/business.md)).

## Where
work_dir: `repos/tideline-app` · part of [tideline-app](../../projects/tideline-app/brief.md).

## Done when
- Stripe Checkout creates a subscription at $8/mo.
- Webhooks reconcile subscription state (created/updated/canceled/past_due).
- Account page shows plan status and a manage-billing link.

## Out of scope
- Annual plans, coupons, seats. Single monthly tier only.

## Open questions
- **Blocked:** waiting on Stripe support to allowlist our webhook endpoint.
  Unblock action: follow up on the support thread; nothing else can land first.
