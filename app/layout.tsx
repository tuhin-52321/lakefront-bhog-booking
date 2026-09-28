import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Durga Puja 2026 — Bhog Coupon Booking | Lakefront Socio Cultural Society",
  description:
    "Book your Bhog coupons for Durga Puja 2026 at Lakefront Socio Cultural Society.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
