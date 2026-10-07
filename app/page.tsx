"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  buildAppLaunchUrl,
  UPI_ID,
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
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({});
  const [isPhone, setIsPhone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
    const isMobilePhone =
      /Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|webOS/i.test(ua) ||
      Boolean((navigator as any)?.userAgentData?.mobile);
    setIsPhone(isMobilePhone);
    setIsAndroid(/Android/i.test(ua));
  }, []);

  const detailsRef = useRef<HTMLDivElement>(null);
  const bookingRef = useRef<HTMLDivElement>(null);
  const utrRef = useRef<HTMLDivElement>(null);
  const isSubmittingRef = useRef(false);

  const plateTotal = useMemo(() => totalPlates(plates), [plates]);
  const amountTotal = useMemo(() => totalAmount(plates), [plates]);
  const detailsReady = Boolean(
    details.flat.trim() && details.name.trim() && details.email.trim()
  );

  // "bhog-pay" is a fixed, greppable prefix so the committee can find these
  // payments in the bank's settlement/statement by searching one word,
  // regardless of which flat or app (main vs. Shashthi) paid.
  const upiNote = `bhog-pay${details.flat.trim() ? " Flat " + details.flat.trim() : ""}`;

  function setPlate(key: string, value: number) {
    if (!detailsReady) return;
    const clamped = Math.max(0, Math.min(20, value));
    setPlates((p) => ({ ...p, [key]: clamped }));
  }

  // Fire-and-forget: logs a "lead" row when someone taps a UPI pay link,
  // in case they never come back to submit the form. Never blocks or
  // cancels the app handoff — uses sendBeacon/keepalive.
  function logLead(paymentApp: string = "Other UPI") {
    try {
      const payload = JSON.stringify({
        flat: details.flat.trim(),
        name: details.name.trim(),
        email: details.email.trim(),
        phone: details.phone.trim(),
        plates,
        totalPlates: plateTotal,
        totalAmount: amountTotal,
        paymentApp,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/lead", blob);
      } else {
        fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: payload,
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  function copyText(value: string, key: string) {
    let success = false;
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(() => {
        setCopied((prev) => ({ ...prev, [key]: true }));
        window.setTimeout(() => {
          setCopied((prev) => ({ ...prev, [key]: false }));
        }, 1500);
      }).catch(() => {});
    }

    try {
      const textArea = document.createElement("textarea");
      textArea.value = value;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      success = document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch {
      // ignore copy failure
    }

    if (success) {
      setCopied((prev) => ({ ...prev, [key]: true }));
      window.setTimeout(() => {
        setCopied((prev) => ({ ...prev, [key]: false }));
      }, 1500);
    }
  }

  function handleAppLaunch(app: "gpay" | "phonepe" | "paytm") {
    const appName = app === "gpay" ? "GPay" : app === "phonepe" ? "PhonePe" : "Paytm";
    logLead(appName);
    copyText(UPI_ID, "upi-id-main");
  }

  async function saveQrImage() {
    try {
      const res = await fetch("/upi-qr.png");
      const blob = await res.blob();
      const file = new File([blob], "Lakefront-Bhog-UPI-QR.png", { type: "image/png" });
      if (typeof navigator !== "undefined" && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
        });
        return;
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
    }
    const a = document.createElement("a");
    a.href = "/upi-qr.png";
    a.download = "Lakefront-Bhog-UPI-QR.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
    if (isSubmittingRef.current) return;
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
    isSubmittingRef.current = true;
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
      isSubmittingRef.current = false;
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
            Namaskar! Bhog is served on the below mentioned days outside
            Party Hall 2 from 1:00 PM. All menus are pure vegetarian, with no
            onion and no garlic.
          </p>
          <p>
            <strong>Price: ₹{PRICE} per plate</strong> (per person, per day)
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
          {!detailsReady ? (
            <p className="hint" style={{ marginBottom: 16, color: "#9b5c00", fontWeight: 600 }}>
              Please fill your details before selecting plates.
            </p>
          ) : (
            <p className="hint" style={{ marginBottom: 16 }}>
              Choose the number of plates (0–20) for each day. Days you leave
              at &ldquo;Do not want this day&rdquo; won&apos;t be booked. Your
              total updates live in the bar below as you pick.
            </p>
          )}
          {DAYS.map((d) => {
            const count = plates[d.key] || 0;
            return (
              <div key={d.key}>
                <div className="day-card">
                  <div className="day-head">
                    <p className="day-title">{d.label}</p>
                    <p className="day-price">Price: ₹{PRICE} per plate</p>
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
                        disabled={count <= 0 || !detailsReady}
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
                        disabled={count >= 20 || !detailsReady}
                        aria-label={`Increase plates for ${d.label}`}
                      >
                        +
                      </button>
                    </div>
                    {count > 0 && (
                      <div className="day-amount">
                        {count} × ₹{PRICE} = ₹{count * PRICE}
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
                    <td>₹{count * PRICE}</td>
                  </tr>
                );
              })}
              <tr className="total">
                <td>Total ({plateTotal} plates)</td>
                <td>₹{amountTotal}</td>
              </tr>
            </tbody>
          </table>

          <p style={{ marginTop: 18, marginBottom: 6 }}>
            Pay <strong>₹{amountTotal}</strong> using one of the payment options below:
          </p>

          <div
            style={{
              background: "#fff9ec",
              border: "1px solid #f6d899",
              borderRadius: 10,
              padding: "10px 14px",
              marginTop: 10,
              marginBottom: 14,
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}
          >
            <span style={{ color: "#9b5c00", fontWeight: 700, display: "block" }}>
              ⚠️ Important: Please submit this form after payment!
            </span>
            <span style={{ color: "#6b4700", fontSize: "0.82rem", display: "inline-block", marginTop: 2 }}>
              After your payment is done, note the UTR / UPI transaction reference and enter it below to complete your booking. Otherwise your booking will not be recorded.
            </span>
          </div>
          {/* Option 1: Scan QR Code (Top Option) */}
          <div className="qr-wrap" style={{ marginTop: 14, marginBottom: 16 }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--purple-dark)", marginBottom: 6 }}>
              Option 1: Scan QR Code to Pay
            </div>
            <div className="qr-frame">
              <img src="/upi-qr.png" alt="Scan to pay with any UPI app" />
            </div>

            {/* If amount <= 2000: Offer Save to Gallery */}
            {amountTotal > 0 && amountTotal <= 2000 && (
              <div style={{ marginTop: 10 }}>
                <button
                  type="button"
                  onClick={saveQrImage}
                  className="qr-download-btn"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Save QR to Gallery / Photos</span>
                </button>
                <div style={{ fontSize: "0.78rem", color: "#666", marginTop: 8, maxWidth: 320, marginInline: "auto", lineHeight: 1.45 }}>
                  💡 <strong>iPhone / iOS:</strong> Press &amp; hold the QR code above ➔ tap <strong>&quot;Save to Photos&quot;</strong> (or tap button to share).<br />
                  💡 <strong>Android:</strong> Tap the button to download directly to Gallery.
                </div>
              </div>
            )}

            {/* If amount > 2000: Note about UPI gallery restriction */}
            {amountTotal > 2000 && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "#8a5800",
                  background: "#fff9ec",
                  border: "1px solid #f6d899",
                  borderRadius: 8,
                  padding: "8px 12px",
                  marginTop: 10,
                  maxWidth: 340,
                  marginInline: "auto",
                  textAlign: "left",
                  lineHeight: 1.45,
                }}
              >
                ℹ️ <strong>Amount is above ₹2,000:</strong> UPI apps restrict scanning saved gallery photos above ₹2,000. Please scan this code directly using another phone, or use Option 2 below.
              </div>
            )}
          </div>

          {/* Option 2: Pay via UPI ID */}
          <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 14, marginTop: 14 }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--purple-dark)", marginBottom: 8 }}>
              Option 2: Pay via UPI ID {isPhone ? "(On this phone)" : ""}
            </div>

            <div className="upi-pay-wrap">
              {/* UPI ID card with Copy Button */}
              <div className="upi-id-card">
                <div>
                  <div style={{ fontSize: "0.72rem", color: "#666", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>
                    UPI ID (Payee: {BANK_DETAILS.accountName})
                  </div>
                  <div className="upi-id-text">{UPI_ID}</div>
                </div>
                <button
                  type="button"
                  className={`upi-copy-action-btn ${copied["upi-id-main"] ? "copied" : ""}`}
                  onClick={() => copyText(UPI_ID, "upi-id-main")}
                >
                  {copied["upi-id-main"] ? "✓ Copied!" : "Copy UPI ID"}
                </button>
              </div>

              {isPhone && (
                amountTotal > 0 ? (
                  <>
                    <div className="upi-step-guide">
                      <strong>How to pay on this phone:</strong>
                      <ol>
                        <li>Tap your app below (copies the UPI ID and opens the app).</li>
                        <li>
                          In your app, paste the copied UPI ID:
                          <div style={{ marginTop: 4, color: "#444", fontSize: "0.8rem", lineHeight: 1.4 }}>
                            • <strong>PhonePe:</strong> Tap <strong>&quot;To Mobile Number&quot;</strong> (or &quot;To UPI ID&quot;) ➔ paste the UPI ID into the search / mobile number box.<br />
                            • <strong>Google Pay / Paytm:</strong> Tap <strong>&quot;Pay UPI ID / anyone&quot;</strong> ➔ paste the UPI ID.
                          </div>
                        </li>
                        <li>Pay <strong>₹{amountTotal}</strong>, note the UTR / reference number, and enter it below.</li>
                      </ol>
                    </div>

                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--purple-dark)", textAlign: "left", marginBottom: 6 }}>
                      Tap to copy ID &amp; open app:
                    </div>
                    <div className="upi-apps-grid">
                      <a
                        href={buildAppLaunchUrl("gpay", isAndroid)}
                        className="upi-app-btn"
                        onClick={() => handleAppLaunch("gpay")}
                      >
                        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17Z" />
                          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                          <path fill="#FBBC05" d="M5.28 14.27a7.18 7.18 0 0 1 0-4.54V6.58H1.25a11.98 11.98 0 0 0 0 10.84l4.03-3.15Z" />
                          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                        </svg>
                        <span>Google Pay</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
                          Pay UPI ID
                        </span>
                      </a>

                      <a
                        href={buildAppLaunchUrl("phonepe", isAndroid)}
                        className="upi-app-btn"
                        onClick={() => handleAppLaunch("phonepe")}
                      >
                        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                          <rect width="24" height="24" rx="6" fill="#5f259f" />
                          <path d="M16.5 7.5h-5.2c-.3 0-.5.2-.5.5v1.2c0 .3.2.5.5.5h1.2v2.1c-.8 0-1.6.4-2.1 1-.5.7-.6 1.6-.3 2.4.3.8 1.1 1.4 2 1.5.2 0 .4 0 .6-.1v2.4c0 .3.2.5.5.5h1.2c.3 0 .5-.2.5-.5v-4.8h1.6c.3 0 .5-.2.5-.5V12c0-.3-.2-.5-.5-.5h-1.6V9.7h1.6c.3 0 .5-.2.5-.5V8c0-.3-.2-.5-.5-.5Zm-4 6.7c-.5 0-.9-.4-.9-.9s.4-.9.9-.9.9.4.9.9-.4.9-.9.9Z" fill="#fff" />
                        </svg>
                        <span>PhonePe</span>
                        <span style={{ fontSize: "0.68rem", color: "#5f259f", fontWeight: 600, lineHeight: 1.1, marginTop: 2 }}>
                          Pay to Mobile No.
                        </span>
                      </a>

                      <a
                        href={buildAppLaunchUrl("paytm", isAndroid)}
                        className="upi-app-btn"
                        onClick={() => handleAppLaunch("paytm")}
                      >
                        <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
                          <rect width="24" height="24" rx="6" fill="#002e6e" />
                          <text x="12" y="15.5" fill="#00b9f5" fontSize="8.5" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">paytm</text>
                        </svg>
                        <span>Paytm</span>
                        <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
                          To UPI Apps
                        </span>
                      </a>
                    </div>

                    <div style={{ marginTop: 10, fontSize: "0.8rem", color: "#555", background: "#fbfbfc", border: "1px solid #e0e0e0", borderRadius: 8, padding: "8px 12px", lineHeight: 1.45, textAlign: "left" }}>
                      💡 <strong>Note:</strong> If the app does not open, click on <strong>&quot;Copy UPI ID&quot;</strong> above, then switch to your UPI app yourself and paste the ID.
                    </div>
                  </>
                ) : (
                  <div style={{ marginTop: 10 }}>
                    <button
                      className="btn btn-primary upi-pay-btn"
                      type="button"
                      disabled
                      aria-disabled="true"
                      style={{ opacity: 0.7, cursor: "not-allowed", width: "100%" }}
                    >
                      Select at least one plate to pay
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Option 3: Bank Transfer */}
          <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 14, marginTop: 14 }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--purple-dark)", marginBottom: 6 }}>
              Option 3: Bank Transfer (NEFT / IMPS)
            </div>
          <div className="bank-details" style={{ marginTop: 10 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
              <span>Account name: {BANK_DETAILS.accountName}</span>
            </div>
            <br />
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "nowrap" }}>
              <span>Bank: {BANK_DETAILS.bank}</span>
            </div>
            <br />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "nowrap",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                overflow: "hidden",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                A/c No.: {BANK_DETAILS.accountNumber}
              </span>
              <button
                type="button"
                onClick={() => copyText(BANK_DETAILS.accountNumber, "account-number")}
                aria-label="Copy account number"
                title={copied["account-number"] ? "Copied" : "Copy account number"}
                style={{
                  padding: 0,
                  margin: 0,
                  border: "none",
                  background: "transparent",
                  color: "var(--purple-dark)",
                  fontSize: "0.9rem",
                  borderRadius: 0,
                  flexShrink: 0,
                  minWidth: 18,
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                {copied["account-number"] ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5 9.5 17 19 7.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </span>
            <br />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "nowrap",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                overflow: "hidden",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                IFSC: {BANK_DETAILS.ifsc}
              </span>
              <button
                type="button"
                onClick={() => copyText(BANK_DETAILS.ifsc, "ifsc")}
                aria-label="Copy IFSC code"
                title={copied["ifsc"] ? "Copied" : "Copy IFSC code"}
                style={{
                  padding: 0,
                  margin: 0,
                  border: "none",
                  background: "transparent",
                  color: "var(--purple-dark)",
                  fontSize: "0.9rem",
                  borderRadius: 0,
                  flexShrink: 0,
                  minWidth: 18,
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                {copied["ifsc"] ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5 9.5 17 19 7.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </span>
            <br />
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "nowrap",
                whiteSpace: "nowrap",
                maxWidth: "100%",
                overflow: "hidden",
              }}
            >
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                UPI ID: {UPI_ID}
              </span>
              <button
                type="button"
                onClick={() => copyText(UPI_ID, "upi-id")}
                aria-label="Copy UPI ID"
                title={copied["upi-id"] ? "Copied" : "Copy UPI ID"}
                style={{
                  padding: 0,
                  margin: 0,
                  border: "none",
                  background: "transparent",
                  color: "var(--purple-dark)",
                  fontSize: "0.9rem",
                  borderRadius: 0,
                  flexShrink: 0,
                  minWidth: 18,
                  width: 18,
                  height: 18,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  lineHeight: 1,
                }}
              >
                {copied["upi-id"] ? (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12.5 9.5 17 19 7.5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="9" y="9" width="11" height="11" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </span>
              <div style={{ marginTop: 8, fontSize: "0.78rem", fontStyle: "italic", color: "var(--muted)" }}>
                Tap the copy icon to copy the values.
              </div>
            </div>
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
              style={{
                pointerEvents: submitState === "submitting" ? "none" : "auto",
                cursor: submitState === "submitting" ? "not-allowed" : "pointer",
                opacity: submitState === "submitting" ? 0.75 : 1,
              }}
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
          <div className="amount">₹{amountTotal}</div>
        </div>
      </div>
    </div>
  );
}
