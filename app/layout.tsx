import type { Metadata } from "next";
import { Rubik, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-geist-sans",
  subsets: ["latin", "hebrew"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "דירות - אנליסט השקעות פינוי בינוי",
  description:
    "ניתוח מבוסס בינה מלאכותית של פרויקטי התחדשות עירונית, תוכניות תשתית ונתוני נדל״ן בישראל",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="light">
      <body
        className={`${rubik.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster dir="rtl" position="top-center" />
      </body>
    </html>
  );
}
