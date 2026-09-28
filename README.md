# Durga Puja 2026 — Bhog Coupon Booking

A small Next.js app that replaces the Google Form for booking Bhog coupons,
with a live-updating total (Google Forms can't compute a total across
earlier answers — this app can, since it's just React state).

- **Step 1** — Flat number, name, email, phone.
- **Step 2** — Pick plates (0–20) for each of the 4 Bhog days with `+`/`−`
  steppers. A sticky bar at the bottom shows the running total plates and
  amount live as you adjust them.
- **Step 3** — Review, pay by UPI/bank transfer, enter the UTR, submit.

Submissions are posted to `/api/submit`, which forwards them (server-side,
with a shared secret) to an Apps Script Web App endpoint that appends a row
to the same "Form Responses 1" sheet the old Google Form used — so the
existing "Booking Summary" and "Day-wise Totals" tabs keep working
unchanged.

## Setup

1. **Apps Script side** — in the "Bhog Coupon Booking Form Builder" Apps
   Script project, add the `doPost` handler (see the project doc / commit
   history for the exact function) and deploy it as a Web App (**Deploy →
   New deployment → Web app**, execute as *Me*, access *Anyone*). Copy the
   `/exec` URL it gives you.
2. Copy `.env.example` to `.env.local` and fill in:
   - `SHEETS_WEBAPP_URL` — the Apps Script Web App URL from step 1.
   - `SUBMIT_SECRET` — any random string, must match the `SECRET` constant
     in the Apps Script's `doPost` handler.
3. `npm install`
4. `npm run dev` and open http://localhost:3000

## Deploying

Deploy to Vercel (or any Next.js host) and set the same two environment
variables (`SHEETS_WEBAPP_URL`, `SUBMIT_SECRET`) in the project's
Environment Variables settings.

## Editing day/pricing details

All day names, dates, menus and the per-plate price live in `lib/days.ts` —
edit that one file to change any of them; both the UI and the server-side
total recomputation in `app/api/submit/route.ts` read from it.
