# Payments — current approach and why

## Right now
No checkout is wired up. Booking a consultation never asks for payment. The `/payments`
page and the booking confirmation screen both show:

> "Payment methods and rates are discussed and confirmed directly with you after your
> consultation is scheduled. You'll receive everything you need before your session —
> no payment is required to book."

Your Zelle handle is never on a public page — share it privately after booking, and use
a **business** Zelle profile through a business bank account, not a personal one.

Payments that do happen are recorded by hand in the backoffice (Phase 4: Appointment
detail screen → mark Unpaid / Deposit Paid / Paid / Refunded, with method, amount, date,
and reference).

## Why this order

**Zelle** — acceptable and common for a consulting firm. Bank-to-bank, no processing fee,
funds land in minutes. Real drawbacks for a business: no purchase protection, transfers
are irreversible, no invoicing built in, no card acceptance, US-only, bank-set
transaction limits vary.

**Cash App** — weaker for a consulting brand; reads as informal to corporate or
higher-net-worth clients. Running business volume through a *personal* Cash App account
violates their terms and risks a frozen account. If used at all, it must be Cash for
Business (~2.75% per payment) — a convenience option, not the default.

**The professional look is invoice-first**, not which app moves the money: send a
branded invoice with a due date and a payment link, list Zelle as one accepted method on
that invoice. The invoice is what makes it look established.

## Recommended progression
1. **Now** — Keep Zelle. Add branded invoices (Wave is free, Square Invoices is free to
   send). This alone raises perceived professionalism significantly.
2. **Next** — Add card acceptance via Stripe or Square so clients can pay however they
   want. Roughly 2.6–2.9% + $0.10–$0.30 per transaction; worth it for the conversion and
   the automatic records.
3. **Later** — ACH/bank debit for larger retainers (typically under 1%, capped), deposits
   at booking, and recurring billing for ongoing lifestyle management clients.

## Architecture, so step 2 is a swap, not a rewrite
- `payments` table already exists in the schema (`supabase/migrations/0001_init.sql`),
  independent of any specific processor.
- `lib/payments/provider.ts` defines a `PaymentProvider` interface
  (`recordPayment`, `setAppointmentPaymentStatus`).
- `lib/payments/manual-provider.ts` is the only implementation today —
  `ManualProvider` just writes what a human tells it (Zelle/CashApp/cash/check marked
  paid by hand).
- When card acceptance gets added, a `StripeProvider` implementing the same interface
  drops in behind `getPaymentProvider()` without the booking flow or backoffice UI
  needing to change — they only ever call the interface, never a specific provider.
