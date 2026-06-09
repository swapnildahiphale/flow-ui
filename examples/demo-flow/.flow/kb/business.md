# Business

## Model
[Tideline](../projects/tideline-app/brief.md) is a simple self-serve SaaS.
- **Pricing:** flat **$8/mo**, single tier. No seats, no enterprise plan — the
  audience is individuals and tiny teams.
- **Stage:** private beta. **~120 beta users** today, all on free access.

## The GA gate
Going to General Availability means turning on billing. That's the
[Stripe billing integration](../tasks/stripe-billing/brief.md) — currently
*waiting on Stripe support* to add our webhook endpoint to the allowlist. Until
billing is live, we can't charge the beta cohort or open public signups.

## Early customers (beta)
A handful of friendly design-forward indie shops are kicking the tires:
- **Marrow & Pine** — a two-person product studio.
- **Lumen Letterpress** — a solo stationery maker tracking studio focus time.
- **Hearthwood Goods** — a small woodworking shop; our most active beta account.

These are the accounts I'd most want to convert first when billing flips on.

## Open-source angle
[confetti-rs](kb/../projects/confetti-rs/brief.md) isn't a revenue line — it's
credibility and a funnel. The WASM v0.4 release powers Tideline's
streak-celebration animation, so the OSS work directly improves the product.
