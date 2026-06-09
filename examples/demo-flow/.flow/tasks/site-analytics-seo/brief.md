# Set up analytics + SEO meta

## What
Wire up privacy-friendly analytics and the SEO meta tags (title, description,
Open Graph card) on the marketing site so launch traffic is measurable and links
preview nicely.

## Why
Launch day brings a spike — the [launch blog post](../launch-blog-post/brief.md)
and word of mouth. Without analytics there's no way to know which channel worked;
without OG tags the shared links look broken. Small task, but it's the difference
between a measured launch and a blind one for
[tideline-site](../../projects/tideline-site/brief.md).

## Where
work_dir: `repos/tideline-site`.

## Done when
- Page-view + sign-up-click events fire to a privacy-friendly analytics endpoint.
- Title/description/OG/Twitter meta render on every page.
- A shared link previews with the right card image and copy.

## Out of scope
- In-app product analytics. That lives in the app + the rollup pipeline, not the
  marketing site.

## Open questions
- Self-host the analytics, or use a lightweight hosted one to avoid infra work?
