import type { Metadata } from "next";
import { Newsreader, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
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
      className={`${newsreader.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="line-divider-bottom bg-village-surface px-6 py-4 flex items-center gap-6">
          <Link href="/" className="text-heading">
            VillageOS
          </Link>
          <nav className="flex gap-[22px] text-meta">
            <Link href="/calendar" className="hover:text-village-ink transition-colors">
              Calendar
            </Link>
            <Link href="/create_event" className="hover:text-village-ink transition-colors">
              Extract event
            </Link>
            <Link href="/search" className="hover:text-village-ink transition-colors">
              Find providers
            </Link>
            <Link href="/meadow" className="hover:text-village-ink transition-colors">
              Meadow
            </Link>
            <Link href="/design" className="hover:text-village-ink transition-colors">
              Design
            </Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
