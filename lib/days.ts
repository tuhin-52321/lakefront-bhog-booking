// Shared booking data: the 4 Bhog days, per-plate price, and menus.
// Keep this in sync with the Apps Script project's dayDefs if either changes.

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
  {
    key: "saptami",
    label: "Sat, 17 Oct — Maha Saptami",
    date: "17 Oct",
    tithi: "Maha Saptami",
    menu: [
      "Veg Fried Rice",
      "Dhokar Dalna",
      "Cholar Dal",
      "Navratan Korma",
      "Tomato Khejur Chutney",
      "Papad",
      "Lengcha",
    ],
  },
  {
    key: "ashtami",
    label: "Sun, 18 Oct — Maha Ashtami",
    date: "18 Oct",
    tithi: "Maha Ashtami",
    menu: [
      "Veg Pulao",
      "Chanar Dal",
      "Paneer Butter Masala",
      "Veg Pakoda",
      "Pineapple Chutney",
      "Papad",
      "Bonde",
    ],
  },
  {
    key: "nabami",
    label: "Tue, 20 Oct — Maha Nabami",
    date: "20 Oct",
    tithi: "Maha Nabami",
    menu: [
      "Radhaballabhi",
      "Alur Dom",
      "Cholar Dal",
      "Veg Chop",
      "Pineapple Chutney",
      "Papad",
      "Mishti Doi",
    ],
  },
];

// Menus are tentative and may change closer to the day.
export const MENU_NOTE = "tentative — may change";

// 19 Oct is a free Bhog day (no booking, no payment) — separate from the
// paid, bookable DAYS above. `canceled` items are still shown, struck
// through, so people know what was planned and dropped rather than being
// surprised when it's missing.
export type FreeMenuItem = { name: string; canceled?: boolean };

export const FREE_BHOG_DAY = {
  label: "Mon, 19 Oct",
  menu: [
    { name: "Khichuri" },
    { name: "Labra" },
    { name: "Bandhakopir Tarkari", canceled: true },
    { name: "Beguni" },
    { name: "Mango Chutney" },
    { name: "Papad" },
    { name: "Gulab Jamun" },
  ] as FreeMenuItem[],
};

// Short, plain-language descriptions for dishes that first-time readers may
// not recognise by name, shown as an optional "What's on the menu?" glossary
// under each day's dish list. Not every dish needs one — keep this to items
// that actually benefit from a one-line explanation.
export const DISH_GLOSSARY: Record<string, string> = {
  "Basanti Pulao": "Mildly sweet, saffron-yellow festive rice.",
  "Jhuri Aloo Bhaja": "Thin, crisp julienned fried potato strips.",
  "Chanar Dalna": "Bengali cottage-cheese (paneer) cubes in a light spiced curry.",
  "Potol Curry": "Pointed gourd cooked in a light Bengali-style curry.",
  "Tomato Khejur Chutney": "Sweet-and-tangy tomato and date chutney.",
  Papad: "Thin, crisp lentil or rice wafer, roasted or fried.",
  Rossogolla: "Soft, spongy cottage-cheese balls in light sugar syrup.",
  "Veg Fried Rice": "Stir-fried rice with mixed vegetables.",
  "Dhokar Dalna": "Steamed-and-fried lentil-cake cubes in a spiced curry.",
  "Cholar Dal": "Bengal-gram lentils cooked sweet-savoury, often with coconut.",
  "Navratan Korma": "Mixed vegetables and paneer in a rich, creamy gravy.",
  "Veg Pulao": "Lightly spiced rice cooked with mixed vegetables.",
  "Paneer Butter Masala": "Cottage cheese in a creamy tomato-butter gravy.",
  "Veg Pakoda": "Mixed vegetable fritters.",
  "Pineapple Chutney": "Sweet-and-tangy pineapple chutney.",
  Bonde: "Small, deep-fried sweet dumplings in sugar syrup.",
  Radhaballabhi: "Deep-fried bread stuffed with a spiced lentil filling.",
  "Alur Dom": "Baby potatoes simmered in a spiced curry.",
  "Veg Chop": "Spiced vegetable croquette, breaded and fried.",
  "Mishti Doi": "Sweetened, set yogurt — a classic Bengali dessert.",
  Lengcha: "Elongated, soft milk-based sweet soaked in sugar syrup.",
  Khichuri: "Rice and lentils cooked together with spices — soft and comforting.",
  Labra: "Mixed-vegetable curry, a classic khichuri side.",
  "Bandhakopir Tarkari": "A light cabbage curry.",
  Beguni: "Deep-fried, batter-coated eggplant slices.",
  "Mango Chutney": "Sweet-and-tangy mango chutney.",
  "Gulab Jamun": "Soft, deep-fried milk-solid balls soaked in sugar syrup.",
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
