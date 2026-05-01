import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VillageOS",
  description: "AI tools for parents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b bg-white dark:bg-zinc-900 px-6 py-4 flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            VillageOS
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/calendar" className="hover:text-foreground transition-colors">
              Calendar
            </Link>
            <Link href="/create_event" className="hover:text-foreground transition-colors">
              Extract event
            </Link>
            <Link href="/search" className="hover:text-foreground transition-colors">
              Find providers
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
