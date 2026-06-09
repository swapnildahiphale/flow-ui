# OAuth login (Google + GitHub)

## What
Add OAuth sign-in with Google and GitHub, alongside the existing email login.
`#backend #api`.

## Why
Lower the signup friction before GA. The dev-leaning beta audience expects
GitHub login; everyone else expects Google. Pairs with
[stripe-billing](../stripe-billing/brief.md) on the road to GA.

## Where
work_dir: `repos/tideline-app` · part of [tideline-app](../../projects/tideline-app/brief.md).

## Done when
- Google + GitHub OAuth flows work end-to-end.
- Existing email accounts can link an OAuth identity.
- Sessions and CSRF handling reviewed (see review rule in
  [processes.md](../../kb/processes.md)).

## Out of scope
- Apple sign-in, SAML/SSO. Not for indie users.

## Open questions
- Auto-create an account on first OAuth login, or require an explicit signup step?
