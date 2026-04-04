import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

export const metadata: Metadata = {
  title: "TrendTube — discover without leaving",
  description:
    "Trend-focused video discovery with inline playback. News, music, and movies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${syne.variable} min-h-screen font-sans antialiased`}
      >
        <AppNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
