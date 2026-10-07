/**
 * SiteHeader: sticky top bar with navigation, AI status and the main CTA.
 */
import Link from "next/link";
import { QuotaPill } from "./QuotaPill";

export function SiteHeader() {
  return (
    <header className="no-print sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-baseline gap-1.5" aria-label="Tripcast home">
          <span className="font-display text-[28px] leading-none tracking-tight">Tripcast</span>
          <span className="h-1.5 w-1.5 translate-y-[-2px] rounded-full bg-forest" aria-hidden />
        </Link>
        <nav className="hidden items-center gap-6 text-[14px] text-ink-2 md:flex">
          <Link href="/#how" className="link-underline">How it works</Link>
          <Link href="/briefing?id=sample" className="link-underline">Sample briefing</Link>
          <Link href="/#sources" className="link-underline">Sources</Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <QuotaPill />
          <Link href="/plan" className="btn btn-ink h-10 px-4 text-[14px]">
            Plan a trip
          </Link>
        </div>
      </div>
    </header>
  );
}
