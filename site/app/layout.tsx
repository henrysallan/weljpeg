import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { MailIcon } from "@/components/MailIcon";

const manrope = Manrope({
  subsets: ["latin"],
  weight: "200",
  variable: "--font-manrope",
  display: "swap",
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
