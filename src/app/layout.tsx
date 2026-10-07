/** Root layout. Fonts come from the geist package so builds work offline. */
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tripcast · Know the place before you land",
  description: "Weather, news, safety advice and a packing list for your trip, on one page. Free, no sign-up.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
