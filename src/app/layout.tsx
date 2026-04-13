import type { Metadata } from "next";
import { JetBrains_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "pulse. — live dashboard",
  description: "Persoonlijk live dashboard met 17 widgets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={`${mono.variable} ${sans.variable}`}>
      <body style={{ fontFamily: "var(--font-sans), sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
