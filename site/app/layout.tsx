import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { MailIcon } from "@/components/MailIcon";

const manrope = localFont({
  src: "../public/fonts/Manrope-VariableFont_wght.ttf",
  variable: "--font-manrope",
  display: "swap",
  weight: "200 800",
});

export const metadata: Metadata = {
  title: "Welcome Labs",
  description:
    "We are experts at introducing new ideas to the culture through design, talent, tools, and distribution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={manrope.className}>
        <a href="#main-content" className="sr-only" style={{ position: 'absolute', top: 0, left: 0, zIndex: 9999 }}>
          Skip to main content
        </a>
        <MailIcon />
        {children}
      </body>
    </html>
  );
}
