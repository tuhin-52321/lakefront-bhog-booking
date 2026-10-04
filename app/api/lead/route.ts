import { NextRequest, NextResponse } from "next/server";
import { DAYS } from "@/lib/days";

export const runtime = "nodejs";

// Logs a "lead": someone tapped the UPI pay link but may never come back to
// submit the form. Best-effort and intentionally lenient — unlike /api/submit,
// most fields here can legitimately be blank (the Pay button is reachable as
// soon as a plate count is picked, before any detail fields are filled in).
// Never let a failure here block the UPI app handoff on the client.
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

  const { flat, name, email, phone, plates, totalPlates, totalAmount, paymentApp } = body || {};

  const perDay: Record<string, number> = {};
  if (plates && typeof plates === "object") {
    for (const d of DAYS) {
      const raw = Number(plates[d.key] ?? 0);
      perDay[d.key] = Number.isFinite(raw) ? Math.max(0, Math.min(20, Math.round(raw))) : 0;
    }
  }

  const appName =
    typeof paymentApp === "string" && paymentApp.trim() ? paymentApp.trim() : "main";

  const payload = {
    secret,
    action: "lead",
    app: appName,
    flat: typeof flat === "string" ? flat.trim() : "",
    name: typeof name === "string" ? name.trim() : "",
    email: typeof email === "string" ? email.trim() : "",
    phone: typeof phone === "string" ? phone.trim() : "",
    plates: perDay,
    totalPlates: Number.isFinite(Number(totalPlates)) ? Number(totalPlates) : 0,
    totalAmount: Number.isFinite(Number(totalAmount)) ? Number(totalAmount) : 0,
    note: `Clicked Pay via ${appName === "main" ? "UPI" : appName}`,
  };

  try {
    const upstream = await fetch(webAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    const text = await upstream.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "Lead service returned an unexpected response." }, { status: 502 });
    }

    if (!upstream.ok || !data.ok) {
      return NextResponse.json({ ok: false, error: data.error || "Lead service rejected the request." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not reach the lead service." }, { status: 502 });
  }
}
