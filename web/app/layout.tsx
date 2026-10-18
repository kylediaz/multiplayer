import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";

// ABC Diatype is Caddy's typeface. It ships in Regular and Bold only, so
// medium falls to Regular and semibold to Bold, as on Caddy's pages.
const diatype = localFont({
  src: [
    { path: "./fonts/ABCDiatype-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/ABCDiatype-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-sans",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multiplayer generated UI",
  description: "Collaborative editing of LLM-generated UIs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", diatype.variable)}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
