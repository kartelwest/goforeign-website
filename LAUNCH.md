# Go Foreign — Launch Checklist

Per the build prompt's Definition of Done (§10), each phase should verify:
- [ ] Works on a real device at 375px wide
- [ ] Double-booking is provably impossible (concurrency test)
- [ ] No secrets in the client bundle
- [ ] RLS verified: anon key can't read `appointments`
- [ ] Lighthouse ≥ 90 Performance and SEO
- [ ] A short testing note

Below is the honest state of each, phase by phase — what I could verify without live infrastructure (Supabase project, Anthropic/Resend keys, a real browser against a deployed site) versus what needs you to run once those exist.

## What's verified as of this session

- **No secrets in the client bundle** — checked after every phase's `npm run build`: grepped `.next/static` for `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY`, zero matches, every time.
- **Build/lint/typecheck clean** — `npm run build`, `npm run lint`, `npx tsc --noEmit` all pass with zero errors after every phase (only pre-existing image-related warnings, since fixed in Phase 6).
- **CSP / security headers don't break rendering** — headless-browser pass (Playwright + the pre-installed Chromium) over every public route against a production build; no CSP-related console errors.
- **Image migration** — visually verified via screenshots that the `next/image` conversion renders correctly (logo, `fill`-mode grids) at 1280px.
- **Double-booking is architecturally impossible, not just untested** — enforced by the `appointments_no_overlap` Postgres exclusion constraint (`supabase/migrations/0001_init.sql`), which is checked transactionally on every INSERT/UPDATE to `appointments` regardless of application code. `scripts/test-concurrency.mjs` is written and ready but needs a real Supabase project to run against (see below).

## What needs your live environment to actually verify

None of this was skipped carelessly — it's genuinely not checkable without a deployed Supabase project, real API keys, and a phone in hand. Once you've done the setup steps in `TESTING.md`:

1. **375px mobile pass** — I don't have a real device or a live deployment to click through. Run each phase's `TESTING.md` checklist at 375px (Chrome DevTools responsive mode is a fine stand-in, but check on an actual phone before launch too).
2. **Double-booking concurrency test** — `node scripts/test-concurrency.mjs` against your real Supabase project (needs `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` in the environment).
3. **RLS check** — in the Supabase SQL editor, confirm `select * from appointments` fails under the `anon` role and `select * from services where is_active and is_public` succeeds. Both migrations need to be applied first.
4. **Lighthouse** — run against your actual Vercel deployment (or `npm run build && npm run start` locally), not against pages that need a live Supabase connection to render meaningfully. Target ≥ 90 Performance and SEO per page.
5. **Color contrast pass** — a real accessibility audit tool (Lighthouse, axe DevTools) against final copy, once you've resolved the flagged content items in `AUDIT.md`.
6. **Email sending** — `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (must be a domain verified in your Resend account) + `NOTIFICATION_EMAIL` need to be set before booking confirmations, admin notifications, cancellations, or reschedule emails will actually send. Without them, `lib/email/resend.ts` no-ops and logs a warning rather than failing the booking.
7. **Nu Nu** — needs `ANTHROPIC_API_KEY` and the `nunu-uploads` storage bucket migration applied.

## Outstanding decisions before this can go live for real clients

From `AUDIT.md` "Needs your sign-off" — none of these block the code from working, but they're real content/business gaps on the live site:
- Katherine's ambassador gallery images (all broken)
- Ambassadors 2–12 (dead links, no profiles)
- The 6 dead `/lifestyle/<slug>` destination pages
- OnlyFans link placement/appropriateness
- `/concierge` page and the WhatsApp number
- `management@goforeign.com` inbox confirmation
- Privacy Policy / Terms of Service — drafted as placeholders, **need real legal review** before you collect client PII or take payments
- Confirm `https://goforeign.com` is the real production domain, or set `NEXT_PUBLIC_SITE_URL` to the right one

## Recommended order once you're ready to go live

1. Resolve the content decisions above (or explicitly defer the ones you're OK shipping without).
2. Create the Supabase project, review and apply all 3 migrations, seed your `admin_users` row (see `TESTING.md`).
3. Set every env var in `.env.example` in your Vercel project settings.
4. Deploy to Vercel, run through every phase's `TESTING.md` checklist against the real deployment.
5. Run the concurrency test, the RLS check, and Lighthouse.
6. Get real legal review on Privacy/Terms before taking any client PII or payments.
7. Disable "Allow new user signups" in Supabase Auth settings (defense-in-depth for the admin login, per `TESTING.md`).
