import {
  DAYS,
  PRICE,
  DISH_GLOSSARY,
  MENU_NOTE,
  FREE_BHOG_DAY,
} from "@/lib/days";

function getDishIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("khichuri")) return "🍲";
  if (n.includes("labra")) return "🥗";
  if (n.includes("payesh")) return "🍧";
  if (n.includes("rice") || n.includes("pulao")) return "🍚";
  if (n.includes("dal") && !n.includes("dalna")) return "🥣";
  if (n.includes("radhaballabhi") || n.includes("puri") || n.includes("luchi")) return "🫓";
  if (n.includes("chop") || n.includes("pakoda") || n.includes("bhaja")) return "🥟";
  if (n.includes("chutney")) return "🍯";
  if (n.includes("papad")) return "🍘";
  if (n.includes("lengcha") || n.includes("bonde") || n.includes("doi") || n.includes("rossogolla") || n.includes("sweet")) return "🍬";
  return "🍲";
}

export default function Page() {
  return (
    <div className="page">
      {/* Closed Booking Notice Banner */}
      <div className="closed-banner" role="alert" aria-live="polite">
        <div className="closed-banner-icon" aria-hidden="true">📢</div>
        <div className="closed-banner-content">
          <div className="closed-banner-title">
            <span>Online Booking Closed</span>
            <span className="closed-banner-badge">Spot Booking Only</span>
          </div>
          <p className="closed-banner-text">
            Booking is closed, please come to venue during lunch for spot booking - limited stock only.
          </p>
          <div className="closed-banner-sub">
            Please visit the Bhog coupon registration desk outside Party Hall 2 from 1:00 PM onwards.
          </div>
        </div>
      </div>

      {/* Main Header / Event Info Card */}
      <div className="card">
        <div className="card-body">
          <span className="pill">Durga Puja 2026</span>
          <h1 className="title" style={{ marginTop: 10 }}>
            Bhog Menu &amp; Event Details
          </h1>
          <p className="subtitle">Lakefront Socio Cultural Society</p>
          
          <div className="venue-highlights-grid">
            <div className="venue-highlight-item">
              <div className="venue-highlight-label">📍 Venue</div>
              <div className="venue-highlight-value">Outside Party Hall 2</div>
            </div>
            <div className="venue-highlight-item">
              <div className="venue-highlight-label">⏰ Serving Time</div>
              <div className="venue-highlight-value">From 1:00 PM (Lunch)</div>
            </div>
            <div className="venue-highlight-item">
              <div className="venue-highlight-label">💰 Spot Price</div>
              <div className="venue-highlight-value">₹{PRICE} per plate / day</div>
            </div>
            <div className="venue-highlight-item">
              <div className="venue-highlight-label">🌿 Dietary</div>
              <div className="venue-highlight-value">Pure Veg (No Onion / Garlic)</div>
            </div>
          </div>

          <p style={{ marginTop: 14, marginBottom: 10, fontSize: "0.93rem" }}>
            Namaskar! Online bookings for Bhog coupons are now closed. If you could not book online in advance, spot booking coupons will be available directly at the venue during lunch hours.
          </p>

          <div className="policy-note">
            <strong>Please note:</strong> Coupons are date-specific and <strong>strictly non-transferable</strong>. Spot booking coupons are issued on a <strong>first-come, first-served basis</strong> subject to limited stock.
          </div>
        </div>
      </div>

      {/* Prominent Menus Section */}
      <div style={{ marginTop: 24, marginBottom: 12 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 4px", color: "var(--purple-dark)" }}>
          Festive Bhog Menus
        </h2>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
          Full daily menus displayed below ({MENU_NOTE}):
        </p>
      </div>

      {DAYS.map((d) => (
        <div key={d.key}>
          <div className="menu-day-card">
            <div className="menu-day-head">
              <div className="menu-day-title-wrap">
                <h3 className="menu-day-title">{d.label}</h3>
              </div>
              <span className="menu-day-price-badge">
                ₹{PRICE} / plate (Spot)
              </span>
            </div>
            <div className="menu-day-body">
              <div className="menu-day-subtitle">
                Complete Menu for {d.tithi}
              </div>
              <div className="dish-list">
                {d.menu.map((item) => {
                  const desc = DISH_GLOSSARY[item];
                  const icon = getDishIcon(item);
                  return (
                    <div key={item} className="dish-item">
                      <div className="dish-icon" aria-hidden="true">{icon}</div>
                      <div className="dish-details">
                        <div className="dish-name">{item}</div>
                        {desc && <div className="dish-desc">{desc}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sandhi Puja / Free Bhog Day Full Menu Card */}
          {d.key === FREE_BHOG_DAY.afterDayKey && (
            <div className="menu-day-card" style={{ borderColor: "#86efac", boxShadow: "0 3px 10px rgba(16, 185, 129, 0.08)" }}>
              <div
                className="menu-day-head"
                style={{
                  background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                  borderBottomColor: "#bbf7d0",
                }}
              >
                <div className="menu-day-title-wrap">
                  <h3 className="menu-day-title" style={{ color: "#065f46" }}>
                    {FREE_BHOG_DAY.label}
                  </h3>
                </div>
                <span className="menu-day-free-badge">
                  ✨ FREE BHOG (Complimentary)
                </span>
              </div>
              <div className="menu-day-body">
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: 8,
                    padding: "8px 12px",
                    marginBottom: 14,
                    fontSize: "0.86rem",
                    color: "#047857",
                    lineHeight: 1.45,
                  }}
                >
                  🎉 <strong>Free Bhog for all devotees!</strong> No coupon or booking required. Served during lunch outside Party Hall 2 from 1:00 PM on a first-come, first-served basis (limited stock only).
                </div>
                <div className="menu-day-subtitle" style={{ color: "#047857" }}>
                  Complete Menu for Sandhi Puja
                </div>
                <div className="dish-list">
                  {FREE_BHOG_DAY.menu.map((item) => {
                    const desc = DISH_GLOSSARY[item];
                    const icon = getDishIcon(item);
                    return (
                      <div
                        key={item}
                        className="dish-item"
                        style={{ background: "#fbfefc", borderColor: "#dcfce7" }}
                      >
                        <div className="dish-icon" aria-hidden="true">{icon}</div>
                        <div className="dish-details">
                          <div className="dish-name" style={{ color: "#065f46" }}>{item}</div>
                          {desc && <div className="dish-desc">{desc}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Spot Booking Instructions Card */}
      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-header">
          Spot Booking Information
        </div>
        <div className="card-body">
          <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7, fontSize: "0.92rem", color: "var(--text)" }}>
            <li>
              <strong>Location:</strong> Outside Party Hall 2, Lakefront.
            </li>
            <li>
              <strong>Timing:</strong> Opens around <strong>1:00 PM</strong> during lunch on each Bhog day.
            </li>
            <li>
              <strong>Availability:</strong> <strong>Limited stock only</strong> — issued strictly on a first-come, first-served basis.
            </li>
            <li>
              <strong>Pricing:</strong> ₹{PRICE} per plate per day.
            </li>
            <li>
              <strong>Validity:</strong> Each coupon is strictly valid only for the designated day and cannot be exchanged or transferred.
            </li>
          </ul>
        </div>
      </div>

      <p className="footer-note" style={{ marginTop: 28 }}>
        Lakefront Socio Cultural Society • Durga Puja 2026<br />
        Coupons are date-specific and non-transferable. Menus are tentative and may change.
      </p>
    </div>
  );
}
