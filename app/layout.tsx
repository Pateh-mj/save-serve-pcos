import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter for the whole UI (self-hosted by next/font); numbers use tabular figures (globals.css).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "SaveServe — PCOS Healthcare Platform",
  description:
    "Patient-Centric Orchestration System connecting patients with mobile healthcare practitioners across Zambia via web and USSD.",
  applicationName: "SaveServe",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "SaveServe", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
