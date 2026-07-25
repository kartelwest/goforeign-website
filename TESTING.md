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

---

# Testing — Phase 3 (Payments Page)

1. Visit `/payments` — shows the same message as the booking confirmation screen,
   pulled live from `settings.payments.public_message`.
2. Confirm your Zelle handle (or any specific payment detail) is **nowhere** on this
   page or anywhere else public — it's meant to be shared privately after booking.
3. Read `PAYMENTS.md` for the reasoning and the `PaymentProvider` architecture — this
   is documentation + a `ManualProvider` implementation, nothing to click yet (the
   backoffice controls that use it are Phase 4, below).

---

# Testing — Phase 4 (Backoffice)

## Seed your admin user (required before you can log in at all)
Signing in doesn't require an allowlisted email — anyone can request a magic link.
What gates access is the `admin_users` table: only an email present there **and**
`is_active = true` can actually reach `/admin`. Nothing is seeded by the migration, so
after applying `0001_init.sql`, run this once in the Supabase SQL editor with your real
email:

```sql
insert into admin_users (email, display_name, role) values ('you@example.com', 'Your Name', 'owner');
```

**Recommended extra step**: in Supabase Dashboard → Authentication → Providers → Email,
turn off "Allow new user signups" (or equivalent) so magic-link requests don't silently
create Supabase Auth users for random emails. Not required for security — the
`admin_users` check still blocks them from doing anything — just tidier.

## What to click / verify
1. Go to `/admin` — should redirect to `/admin/login`.
2. Enter your seeded email, click "Send sign-in link", check your inbox, click the link.
   You should land on `/admin/today`.
3. Try entering an email that's **not** in `admin_users` — you should get sent back to
   `/admin/login?error=not_authorized` after clicking that link.
4. **Today** — shows today's appointments (empty until you create one).
5. **New Appointment** — create one manually. Try a time outside your weekly hours —
   you should get a warning with a "Book anyway" override, per the build prompt's
   requirement to allow squeezing someone in. Try booking the exact same slot twice —
   the second should fail with a conflict error (same DB constraint as the public flow).
6. **Appointment detail** — change status, record a payment (check it moves to "paid"
   automatically), add a note, confirm it appears in the notes thread with a timestamp.
7. **Clients** — search by name/email, open a client, confirm their appointment history
   shows up.
8. **Availability** — toggle a day off/on and change hours, save, then check `/book`
   reflects it (that day's slots disappear/reappear). Add a blackout block — if it
   overlaps an existing appointment you should get a warning (and the appointment
   should NOT be silently cancelled — verify it's untouched afterward).
9. **Settings** — edit a service's name/description/price, save, confirm `/book` shows
   the updated text.
10. **Security headers**: `curl -sI https://your-deployed-url/` and confirm
    `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
    and `Strict-Transport-Security` are all present (verified locally against a prod
    build in this pass — no CSP-related console errors on a headless-browser pass of
    every public page).
11. **RLS/service-role check**: confirm `SUPABASE_SERVICE_ROLE_KEY` never appears in
    any file under `.next/static` after `npm run build` (spot-checked in this pass —
    grep for it yourself to be sure after you deploy).

## Known limitations in this pass
- Settings screen edits existing services only; adding a brand-new service (new
  duration tier) still needs a manual insert — ask and I'll add a form for it.
- Calendar is a simple week-list view, not drag-and-drop.

---

# Testing — Phase 5 (Nu Nu)

## Before you can test this
1. Apply `supabase/migrations/0003_nunu_storage.sql` (creates the private
   `nunu-uploads` storage bucket — review it first, same as the other migrations).
2. Set `ANTHROPIC_API_KEY` in `.env.local` (server-side only — never exposed to the
   browser; verified no secret strings appear in `.next/static` after `npm run build`
   in this pass).

## What to click / verify
1. Go to `/admin/nunu`. Try each text command from the build prompt's list:
   - "Block next Tuesday all day"
   - "What's on my calendar Thursday?" (should answer directly, no confirm button)
   - "Move my 2pm Friday to 3pm" (only works if you have a matching appointment —
     otherwise it should say so rather than guessing)
   - "Add a note to the Johnson appointment: sent follow-up resources"
2. For anything that mutates the calendar, confirm you see **Confirm / Dismiss**
   buttons and nothing happens until you click Confirm — verify by checking
   `/admin/availability` or `/admin/calendar` before and after.
3. Try a command that would collide with an existing booked appointment (e.g. block a
   range that overlaps a confirmed appointment) — confirm it refuses and tells you why
   instead of silently overwriting.
4. Upload a schedule photo (JPEG/PNG/HEIC). Confirm you land on an editable review
   table, not an immediate write — edit a row, delete a row, then click Apply.
5. Upload something illegible or a non-schedule image — confirm it reports low
   confidence / an `unclear` note rather than fabricating shifts.
6. Try uploading an 11MB+ file or a `.pdf` — confirm both are rejected client-side
   error messages, not silently accepted.
7. Check the `audit_log` table after a few confirmed actions — each should have a row
   with `actor_type = 'nunu'` and the actual admin's id as `actor_id`.
8. Rate limit: send 11 messages within a minute — the 11th should be refused with a
   friendly rate-limit message rather than erroring.

## Known limitations in this pass
- "Open a range" only removes blocks **fully contained** in the requested range —
  a block that only partially overlaps is left alone with a note to adjust it manually
  in Availability, rather than attempting to split it automatically.
- `move_appointment` / `add_note` resolve the target appointment by a fuzzy
  client-name + approximate-date match; if that's ambiguous (0 or 2+ candidates) it
  asks you to use the Appointments screen instead of guessing.
