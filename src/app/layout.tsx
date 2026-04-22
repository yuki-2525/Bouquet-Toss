import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ThemeToggle } from "@/frontend/components/ThemeToggle";
import { UserMenu } from "@/frontend/components/UserMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bouquet-Toss | ブーケを投げるwebアプリ",
  description: "TRPGセッション等でリアルタイムにブーケを投げ合えるwebアプリです。",
  openGraph: {
    title: "Bouquet-Toss",
    description: "ブーケを投げるwebアプリ",
    url: "https://bouquet-toss.vercel.app", // 本番URLが確定していれば書き換えてください
    siteName: "Bouquet-Toss",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bouquet-Toss",
    description: "ブーケを投げるwebアプリ",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`}
      >
        <Providers>
          <header className="fixed top-0 right-0 z-50 flex items-center gap-3 p-4">
            <UserMenu />
            <ThemeToggle />
          </header>
          {children}
        </Providers>
      </body>
    </html>
  );
}
