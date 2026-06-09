# Tideline Site

## What
The public marketing/landing site for [Tideline](../tideline-app/brief.md) —
the page people hit before they sign up. A small static site: hero, feature
blurbs, pricing, and a sign-up call to action. Separate from the app itself.

## Why
The app is getting close to GA (the streak dashboard is landing, billing is the
last gate — see [business.md](../../kb/business.md)). When billing unblocks,
there needs to be a front door that explains what Tideline is and sends people
to sign up. Today there's nothing. Low priority until GA is in sight, but it
can't be missing on launch day.

## Where
work_dir: `repos/tideline-site`. Built and deployed alongside
[tideline-infra](../tideline-infra/brief.md), but kept as its own small repo so
the marketing site can ship independently of the app.

## Done when
- Landing page is live with a hero, feature blurbs, and the $8/mo pricing
  (see [business.md](../../kb/business.md)).
- Product copy reads in Ren's voice and matches Priya's brand mocks.
- Analytics + SEO meta are in place so launch traffic is measurable.

## Out of scope
- A blog/CMS. The [launch blog post](../../tasks/launch-blog-post/brief.md) lives
  in `personal` for now; the marketing site stays static.
- Anything behind auth. That's the app, not the site.

## Open questions
- Reuse confetti-rs for a celebratory hero animation, or keep the landing page
  lightweight for fast load?
