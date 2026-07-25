# Testing — Phase 1 (Site Audit)

## What changed
See `AUDIT.md` for the full findings list. This commit fixes the Critical/High items
that were safe to fix without a content/business decision from you. Several Critical
items are **flagged, not fixed** — they need your call (see "Needs your sign-off" in
`AUDIT.md`).

## What to click / verify

1. **Run it**: `npm install && npm run dev`, open `http://localhost:3000`.
2. **Nav**: click "Home" in the top nav — it now goes to `/` instead of doing nothing (`#`).
3. **Font**: text should render in Geist (a clean geometric sans), not Arial/Helvetica —
   compare headings before/after if unsure.
4. **Page titles**: check the browser tab on each page — `/`, `/lifestyle`,
   `/brand-ambassadors`, `/brand-ambassadors/katherine`, `/privacy`, `/terms` should each
   show a real, distinct title instead of "Create Next App".
5. **View source** on `/` and confirm there's exactly one `<h1>` (the hero headline).
6. **Sitemap/robots**: visit `/sitemap.xml` and `/robots.txt` directly — both should
   render (not 404).
7. **Footer**: every page now has a footer with Privacy Policy / Terms of Service links —
   click both, confirm they load.
8. **Katherine's OnlyFans thumbnail**: right-click → inspect, confirm
   `rel="noopener noreferrer"` is present (security fix; the link itself is still live
   pending your decision in AUDIT.md item #7).
9. **375px width**: open dev tools responsive mode at 375px on `/` and `/brand-ambassadors`
   — nothing new was changed layout-wise in this pass, but worth confirming nothing broke.

## Known still-broken (flagged, not fixed — your call, see AUDIT.md)
- Katherine's own gallery images (4 photos + hero) are still broken — no real files exist yet.
- 7 of 12 ambassador thumbnails on `/brand-ambassadors` still 404 (`.jpg` vs `.jpeg` mismatch).
- Ambassadors 2–12 profile links still 404 (no pages built for them).
- `/concierge` link on `/lifestyle` still 404.
- WhatsApp button still points at bare `https://wa.me/` with no number.

## Not run yet
- Lighthouse — recommend running `npm run build && npm run start` then Lighthouse in
  Chrome DevTools once you're ready; I did not run it in this pass since several
  Critical items (broken images) are still open pending your sign-off and would skew
  the score.

---

# Testing — Phase 2 (Booking Schema + Public Booking Flow)

## Before you can test this at all
The booking flow needs a real Supabase project. Nothing in this PR touches a database
until you:

1. Create a new Supabase project (confirmed separately — **not** reusing the
   `KARAYMODELS.COM` project already on your account).
2. **Review `supabase/migrations/0001_init.sql` and `0002_book_appointment_rpc.sql`**
   before running either — this is the ground rule from the build prompt ("show it to
   me and get approval before running it against any database"). `0001` is the schema
   from the build prompt verbatim (tables, RLS, seed data). `0002` adds three
   `SECURITY DEFINER` Postgres functions (`book_appointment`, `cancel_appointment`,
   `reschedule_appointment`) plus a read-only `get_appointment_by_token` — these are
   the *only* way the public `anon` key can write to `clients`/`appointments` at all;
   everything else stays default-deny under RLS.
3. Apply both migrations (Supabase SQL editor, or the CLI, or ask me to apply them via
   the Supabase MCP tools once that connection is working — it wasn't during this
   session).
4. Fill in `.env.local` (copy from `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

## What to click / verify once that's wired up
1. `npm run dev`, go to `/book` — you should see the 3 seeded services (Discovery
   Call / Focused Consultation / Full Consultation).
2. Pick one → calendar should show weekdays (Mon–Fri, per the seeded default hours)
   as clickable, weekends dimmed and unclickable.
3. Pick a day → a grid of 15-minute time slots appears, labeled in **your browser's
   timezone**.
4. Try picking a slot less than 12 hours out (if any render — they shouldn't, since
   the lead-time rule filters them server-side) and one more than 60 days out (same).
5. Fill the intake form, review, confirm — you should land on `/book/confirmation/[token]`
   with a confirmation code, an "Add to Calendar" button (downloads a real `.ics`), and
   the payment message from `settings.payments.public_message`.
6. From there, click "Manage Booking" → `/book/manage/[token]` — try Reschedule (picks a
   new slot, same calendar/slot UI) and Cancel (with an optional reason). Both should
   update the status/time shown immediately.
7. **Double-booking test**: run `node scripts/test-concurrency.mjs` (needs
   `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` in the environment) — it
   fires two simultaneous booking attempts at the exact same slot and asserts exactly
   one succeeds. This is the actual proof that double-booking is DB-enforced
   (`appointments_no_overlap` exclusion constraint), not just an app-level check.
8. **RLS check**: in the Supabase dashboard, run a query as the `anon` role (or use the
   anon key directly) against `select * from appointments` — it should be denied. Only
   `select * from services where is_active and is_public` should work anonymously.
9. 375px width: run through the whole booking flow in mobile responsive view.

## Known limitations in this pass
- No confirmation/notification emails yet — that's Phase 6 (Resend).
- No admin backoffice yet to view/manage bookings from your side — that's Phase 4.
- `/payments` as its own page (with the `PaymentProvider` architecture) is Phase 3;
  this PR only surfaces the payment message text on the confirmation/review screens.
