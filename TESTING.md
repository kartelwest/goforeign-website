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
