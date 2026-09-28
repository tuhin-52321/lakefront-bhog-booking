"use client";

import { useMemo, useRef, useState } from "react";
import {
  DAYS,
  PRICE,
  BANK_DETAILS,
  DISH_GLOSSARY,
  MENU_NOTE,
  FREE_BHOG_DAY,
  PlateSelection,
  totalPlates,
  totalAmount,
  buildUpiPayUrl,
} from "@/lib/days";

type Details = {
  flat: string;
  name: string;
  email: string;
  phone: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

const PHONE_RE = /^[6-9][0-9]{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Page() {
  const [details, setDetails] = useState<Details>({
    flat: "",
    name: "",
    email: "",
    phone: "",
  });
  const [plates, setPlates] = useState<PlateSelection>(
    Object.fromEntries(DAYS.map((d) => [d.key, 0]))
  );
  const [utr, setUtr] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");

  const detailsRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const utrRef = useRef<HTMLDivElement>(null);

  const plateTotal = useMemo(() => totalPlates(plates), [plates]);
  const amountTotal = useMemo(() => totalAmount(plates), [plates]);

  function setPlate(key: string, value: number) {
    const clamped = Math.max(0, Math.min(20, value));
    setPlates((p) => ({ ...p, [key]: clamped }));
  }

  function validateAll() {
    const e: Record<string, string> = {};
    if (!details.flat.trim()) e.flat = "Flat number is required.";
    if (!details.name.trim()) e.name = "Name is required.";
    if (!EMAIL_RE.test(details.email.trim()))
      e.email = "Enter a valid email address.";
    if (!PHONE_RE.test(details.phone.trim()))
      e.phone = "Enter a valid 10-digit mobile number.";
    if (plateTotal <= 0)
      e.booking = "Please book at least 1 plate on at least one day.";
    if (!utr.trim())
      e.utr = "Please enter the UTR / UPI transaction reference.";
    return e;
  }

  async function submit() {
    const e = validateAll();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const target =
        e.flat || e.name || e.email || e.phone
          ? detailsRef
          : e.booking
          ? bookingRef
          : utrRef;
      target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSubmitState("submitting");
    setSubmitError("");
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flat: details.flat.trim(),
          name: details.name.trim(),
          email: details.email.trim(),
          phone: details.phone.trim(),
          plates,
          totalPlates: plateTotal,
          totalAmount: amountTotal,
          utr: utr.trim(),
          remarks: remarks.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setSubmitState("success");
    } catch (err: any) {
      setSubmitState("error");
      setSubmitError(err.message || "Something went wrong. Please try again.");
    }
  }

  if (submitState === "success") {
    return (
      <div className="page">
        <div className="card status-card">
          <div className="icon">🙏</div>
          <h2 className="title">Thank you!</h2>
          <p>
            Your Bhog coupon booking has been received. Once the committee
            verifies your payment, your coupons will be issued. Subho Durga
            Puja!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-with-total-bar">
      <div className="card">
        <div className="card-body">
          <span className="pill">Durga Puja 2026</span>
          <h1 className="title" style={{ marginTop: 10 }}>
            Bhog Coupon Booking
          </h1>
          <p className="subtitle">Lakefront Socio Cultural Society</p>
          <p>
            Namaskar! Bhog is served every puja day outside Party Hall 2 from
            1:00 PM. All menus are pure vegetarian, with no onion and no
            garlic.
          </p>
          <p>
            <strong>Price: Rs.{PRICE} per plate</strong> (per person, per day)
          </p>
          <div className="policy-note">
            <strong>Please note:</strong> coupons are date-specific and{" "}
            <strong>not transferable</strong>. A coupon booked for one day
            cannot be used to claim Bhog on a different day — even if it
            wasn&apos;t used on the day it was booked for.
          </div>
        </div>
      </div>

      <div className="card" ref={detailsRef}>
        <div className="card-header">Your details</div>
        <div className="card-body">
          <div className={`field ${errors.flat ? "has-error" : ""}`}>
            <label htmlFor="flat">Flat Number *</label>
            <input
              id="flat"
              type="text"
              placeholder="Tower and flat, e.g. T3-1204"
              value={details.flat}
              onChange={(e) =>
                setDetails((d) => ({ ...d, flat: e.target.value }))
              }
            />
            {errors.flat && <div className="error-text">{errors.flat}</div>}
          </div>
          <div className={`field ${errors.name ? "has-error" : ""}`}>
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={details.name}
              onChange={(e) =>
                setDetails((d) => ({ ...d, name: e.target.value }))
              }
            />
            {errors.name && <div className="error-text">{errors.name}</div>}
          </div>
          <div className={`field ${errors.email ? "has-error" : ""}`}>
            <label htmlFor="email">Email ID *</label>
            <input
              id="email"
              type="email"
              value={details.email}
              onChange={(e) =>
                setDetails((d) => ({ ...d, email: e.target.value }))
              }
            />
            {errors.email && <div className="error-text">{errors.email}</div>}
          </div>
          <div className={`field ${errors.phone ? "has-error" : ""}`}>
            <label htmlFor="phone">Phone Number *</label>
            <input
              id="phone"
              type="tel"
              placeholder="10-digit mobile number"
              value={details.phone}
              onChange={(e) =>
                setDetails((d) => ({ ...d, phone: e.target.value }))
              }
            />
            {errors.phone && <div className="error-text">{errors.phone}</div>}
          </div>
        </div>
      </div>

      <div className="card" ref={bookingRef}>
        <div className="card-header">Your booking</div>
        <div className="card-body">
          <p className="hint" style={{ marginBottom: 16 }}>
            Choose the number of plates (0–20) for each day. Days you leave
            at &ldquo;Do not want this day&rdquo; won&apos;t be booked. Your
            total updates live in the bar below as you pick.
          </p>
          {DAYS.map((d) => {
            const count = plates[d.key] || 0;
            return (
              <div key={d.key}>
                <div className="day-card">
                  <div className="day-head">
                    <p className="day-title">{d.label}</p>
                    <p className="day-price">Price: Rs.{PRICE} per plate</p>
                    <p className="day-menu">Menu: {d.menu.join(", ")} ({MENU_NOTE})</p>
                    <details className="menu-glossary">
                      <summary>What&apos;s on the menu?</summary>
                      <ul>
                        {d.menu.map((item) => (
                          <li key={item}>
                            <strong>{item}</strong>
                            {DISH_GLOSSARY[item] ? ` — ${DISH_GLOSSARY[item]}` : ""}
                          </li>
                        ))}
                      </ul>
                    </details>
                  </div>
                  <div className="day-body">
                    <div className="stepper">
                      <button
                        type="button"
                        onClick={() => setPlate(d.key, count - 1)}
                        disabled={count <= 0}
                        aria-label={`Decrease plates for ${d.label}`}
                      >
                        −
                      </button>
                      <div className={`count ${count === 0 ? "skip" : ""}`}>
                        {count === 0
                          ? "Do not want this day"
                          : `${count} plate${count > 1 ? "s" : ""}`}
                      </div>
                      <button
                        type="button"
                        onClick={() => setPlate(d.key, count + 1)}
                        disabled={count >= 20}
                        aria-label={`Increase plates for ${d.label}`}
                      >
                        +
                      </button>
                    </div>
                    {count > 0 && (
                      <div className="day-amount">
                        {count} × Rs.{PRICE} = Rs.{count * PRICE}
                      </div>
                    )}
                  </div>
                </div>
                {d.key === FREE_BHOG_DAY.afterDayKey && (
                  <div className="day-note">
                    <p className="day-note-title">{FREE_BHOG_DAY.label}</p>
                    <p className="day-note-text">{FREE_BHOG_DAY.note}</p>
                  </div>
                )}
              </div>
            );
          })}
          {errors.booking && (
            <div className="error-text" style={{ marginBottom: 12 }}>
              {errors.booking}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">Review & pay</div>
        <div className="card-body">
          <table className="summary-table">
            <tbody>
              {DAYS.map((d) => {
                const count = plates[d.key] || 0;
                if (count === 0) return null;
                return (
                  <tr key={d.key}>
                    <td>
                      {d.date} — {count} plate{count > 1 ? "s" : ""}
                    </td>
                    <td>Rs.{count * PRICE}</td>
                  </tr>
                );
              })}
              <tr className="total">
                <td>Total ({plateTotal} plates)</td>
                <td>Rs.{amountTotal}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ marginTop: 18, marginBottom: 6 }}>
            Pay <strong>Rs.{amountTotal}</strong> by any UPI app — tap the
            button below on your phone, or scan the QR code — or by bank
            transfer:
          </p>
          {amountTotal > 0 && (
            <div className="upi-pay-wrap">
              <a
                className="btn btn-primary upi-pay-btn"
                href={buildUpiPayUrl(
                  amountTotal,
                  `Bhog booking${details.flat.trim() ? " - Flat " + details.flat.trim() : ""}`
                )}
              >
                Pay Rs.{amountTotal} via UPI app
              </a>
              <p className="hint" style={{ marginTop: 6, marginBottom: 0 }}>
                Opens your UPI app directly on a phone (Google Pay, PhonePe,
                Paytm, etc.). On a computer, use the QR code below instead.
              </p>
            </div>
          )}
          <div className="bank-details">
            Account name: {BANK_DETAILS.accountName}
            <br />
            Bank: {BANK_DETAILS.bank}
            <br />
            A/c No.: {BANK_DETAILS.accountNumber}
            <br />
            IFSC: {BANK_DETAILS.ifsc}
          </div>
          <div className="qr-wrap">
            <img src="/upi-qr.png" alt="Scan to pay with any UPI app" />
          </div>

          <div
            className={`field ${errors.utr ? "has-error" : ""}`}
            style={{ marginTop: 18 }}
            ref={utrRef}
          >
            <label htmlFor="utr">UTR / UPI transaction reference number *</label>
            <input
              id="utr"
              type="text"
              placeholder="The 12-digit UTR / UPI reference from your payment app"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
            />
            {errors.utr && <div className="error-text">{errors.utr}</div>}
          </div>
          <div className="field">
            <label htmlFor="remarks">Remarks (optional)</label>
            <textarea
              id="remarks"
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          {submitState === "error" && (
            <div className="error-text" style={{ marginBottom: 12 }}>
              {submitError}
            </div>
          )}

          <div className="actions" style={{ justifyContent: "flex-end" }}>
            <button
              className="btn btn-primary"
              onClick={submit}
              disabled={submitState === "submitting"}
            >
              {submitState === "submitting" ? "Submitting…" : "Submit booking"}
            </button>
          </div>
        </div>
      </div>

      <p className="footer-note">
        Coupons are date-specific and non-transferable. Your coupons will be
        issued once the payment is verified. Menus are tentative and may
        change.
      </p>

      <div className="total-bar total-bar-fixed">
        <div>
          <div className="label">
            {plateTotal} plate{plateTotal !== 1 ? "s" : ""} selected
          </div>
          <div className="amount">Rs.{amountTotal}</div>
        </div>
      </div>
    </div>
  );
}
