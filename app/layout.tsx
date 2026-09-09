import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SaveServe — PCOS Healthcare Platform",
  description:
    "Patient-Centric Orchestration System connecting patients with mobile healthcare practitioners across Zambia via web and USSD.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

