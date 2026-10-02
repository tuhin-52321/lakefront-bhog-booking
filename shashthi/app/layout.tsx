import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maha Shashthi Bhog Coupon Booking | Lakefront Socio Cultural Society",
  description:
    "Book your Maha Shashthi (16 Oct) Bhog coupons for Durga Puja 2026 at Lakefront Socio Cultural Society.",
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
