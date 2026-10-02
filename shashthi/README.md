# Shashthi Bhog Coupon Booking

Standalone, single-day booking form for Maha Shashthi (16 Oct) only, at
Rs.350/plate. This is a separate Vercel project (own URL) built from this
`shashthi/` subfolder of the main `lakefront-bhog-booking` repo — the two
apps share no runtime state, but are kept in the same repo for convenience.

The main multi-day booking form (Saptami/Ashtami/Nabami, Rs.275/plate) lives
at the repo root and deploys as the `lakefront-bhog-booking` Vercel project.

## Setup

Same as the root app — see the root `README.md`. This subfolder needs its
own `SHEETS_WEBAPP_URL` and `SUBMIT_SECRET` environment variables configured
in its own Vercel project (these are **not** shared with the root app's
Vercel project).

```bash
cd shashthi
npm install
npm run dev
```

## Deploying

In Vercel, create a new project pointing at this GitHub repo with **Root
Directory** set to `shashthi`, or deploy this folder's contents directly via
the Vercel API/CLI as its own project.
