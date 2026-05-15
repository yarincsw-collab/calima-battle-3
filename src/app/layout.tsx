import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calima Battles 3 — תחרות הקליסטניקס הגדולה של השנה",
  description:
    "30-31.7 | תחרות הקליסטניקס Calima Battles 3 — פריסטייל וסיבולת | הכשרת הישוב 10, ראשון לציון. הרשמה לתחרות עכשיו.",
  openGraph: {
    title: "Calima Battles 3",
    description: "תחרות הקליסטניקס הגדולה של השנה — 30-31.7 | ראשל\"צ",
    type: "website",
    locale: "he_IL",
  },
};

export const viewport = {
  themeColor: "#05070A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-ink-950 text-white">{children}</body>
    </html>
  );
}
