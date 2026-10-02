import { NextRequest, NextResponse } from "next/server";
import { DAYS, PRICE } from "@/lib/days";

export const runtime = "nodejs";

const PHONE_RE = /^[6-9][0-9]{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const webAppUrl = process.env.SHEETS_WEBAPP_URL;
  const secret = process.env.SUBMIT_SECRET;

  if (!webAppUrl || !secret) {
    return NextResponse.json(
      { ok: false, error: "Server is not configured yet. Missing SHEETS_WEBAPP_URL / SUBMIT_SECRET." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const { flat, name, email, phone, plates, totalPlates, totalAmount, utr, remarks } = body || {};

  if (!flat || typeof flat !== "string" || !flat.trim()) {
    return NextResponse.json({ ok: false, error: "Flat number is required." }, { status: 400 });
  }
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "A valid email is required." }, { status: 400 });
  }
  if (!phone || !PHONE_RE.test(phone)) {
    return NextResponse.json({ ok: false, error: "A valid 10-digit phone number is required." }, { status: 400 });
  }
  if (!utr || typeof utr !== "string" || !utr.trim()) {
    return NextResponse.json({ ok: false, error: "UTR / UPI reference is required." }, { status: 400 });
  }
  if (!plates || typeof plates !== "object") {
    return NextResponse.json({ ok: false, error: "Booking selection is missing." }, { status: 400 });
  }

  // Re-derive totals server-side rather than trusting the client.
  let computedPlates = 0;
  const perDay: Record<string, number> = {};
  for (const d of DAYS) {
    const raw = Number(plates[d.key] ?? 0);
    const n = Number.isFinite(raw) ? Math.max(0, Math.min(20, Math.round(raw))) : 0;
    perDay[d.key] = n;
    computedPlates += n;
  }
  if (computedPlates <= 0) {
    return NextResponse.json(
      { ok: false, error: "Please book at least 1 plate." },
      { status: 400 }
    );
  }
  const computedAmount = computedPlates * PRICE;

  const payload = {
    secret,
    flat: flat.trim(),
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    perDay,
    totalPlates: computedPlates,
    totalAmount: computedAmount,
    utr: String(utr).trim(),
    remarks: remarks ? String(remarks).trim() : "",
  };

  try {
    const upstream = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Apps Script Web Apps issue a redirect (302) to the actual execution URL.
      redirect: "follow",
    });

    const text = await upstream.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      // Apps Script sometimes wraps errors in HTML; treat non-JSON as failure.
      return NextResponse.json(
        { ok: false, error: "Booking service returned an unexpected response." },
        { status: 502 }
      );
    }

    if (!upstream.ok || !data.ok) {
      return NextResponse.json(
        { ok: false, error: data.error || "Booking service rejected the submission." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: "Could not reach the booking service. Please try again." },
      { status: 502 }
    );
  }
}
