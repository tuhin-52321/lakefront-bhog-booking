// Shared booking data for the standalone Maha Shashthi (16 Oct) Bhog
// coupon booking app. This is a single-day, single-price variant of the
// main app's lib/days.ts — kept in its own `shashthi/` subfolder so it can
// be deployed as its own Vercel project from this same repo.

export const PRICE = 350;

export type DayDef = {
  key: string; // stable id used in form state + submitted payload
  label: string; // short label, e.g. "Fri, 16 Oct — Maha Shashthi"
  date: string; // e.g. "16 Oct"
  tithi: string; // e.g. "Maha Shashthi"
  menu: string[];
};

export const DAYS: DayDef[] = [
  {
    key: "shashthi",
    label: "Fri, 16 Oct — Maha Shashthi",
    date: "16 Oct",
    tithi: "Maha Shashthi",
    menu: [
      "Basanti Pulao",
      "Jhuri Aloo Bhaja",
      "Chanar Dalna",
      "Potol Curry",
      "Tomato Khejur Chutney",
      "Papad",
      "Rossogolla",
    ],
  },
];

// Menus are tentative and may change closer to the day.
export const MENU_NOTE = "tentative — may change";

// Short, plain-language descriptions for dishes that first-time readers may
// not recognise by name, shown as an optional "What's on the menu?" glossary
// under the day's dish list.
export const DISH_GLOSSARY: Record<string, string> = {
  "Basanti Pulao": "Mildly sweet, saffron-yellow festive rice.",
  "Jhuri Aloo Bhaja": "Thin, crisp julienned fried potato strips.",
  "Chanar Dalna": "Bengali cottage-cheese (paneer) cubes in a light spiced curry.",
  "Potol Curry": "Pointed gourd cooked in a light Bengali-style curry.",
  "Tomato Khejur Chutney": "Sweet-and-tangy tomato and date chutney.",
  Papad: "Thin, crisp lentil or rice wafer, roasted or fried.",
  Rossogolla: "Soft, spongy cottage-cheese balls in light sugar syrup.",
};

export const BANK_DETAILS = {
  accountName: "Lakefront Socio Cultural Society",
  bank: "Axis Bank, Hoodi Branch",
  accountNumber: "926010017429184",
  ifsc: "UTIB0004162",
};

// The society's real merchant UPI ID (VPA), decoded from the same UPI QR
// code already used for collections (public/upi-qr.png) rather than typed
// in separately — so it's guaranteed to match what the QR already pays into.
export const UPI_ID = "037349041620055@AXISBANK";
export const UPI_PAYEE_NAME = "Lakefront Socio Cultural Society";

// Builds a `upi://pay` deep link that opens directly in the user's UPI app
// (Google Pay, PhonePe, Paytm, etc.) with the amount and a note pre-filled,
// as a one-tap alternative to scanning the QR code. Deep links like this
// only open an installed UPI app on a phone — on desktop, tapping it does
// nothing useful, so the QR code stays as the fallback for that case.
export function buildUpiPayUrl(amount: number, note: string): string {
  const params = new URLSearchParams({
    pa: UPI_ID,
    pn: UPI_PAYEE_NAME,
    am: String(amount),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

// Per-day plate count: 0 means "I do not want any plate this day".
export type PlateSelection = Record<string, number>;

export function totalPlates(sel: PlateSelection): number {
  return DAYS.reduce((sum, d) => sum + (sel[d.key] || 0), 0);
}

export function totalAmount(sel: PlateSelection): number {
  return totalPlates(sel) * PRICE;
}
