import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PassPreview } from "@/components/home/PassPreview";
import { RotatingWord } from "@/components/home/RotatingWord";

const PLACES = ["Kyoto", "Lisbon", "Hanoi", "Oaxaca", "Marrakech", "Istanbul", "Cape Town"];

const INSIDE = ["Go-score", "16-day forecast", "Packing list", "Safety advice", "Local news", "Things to do", "Better dates", "Places like it"];

const STEPS = [
  ["01", "Add your stops and dates"],
  ["02", "We pull the weather, news and safety advice"],
  ["03", "Read one page before you pack"],
];

const SOURCES = [
  ["Open-Meteo", "https://open-meteo.com"],
  ["Google News", "https://news.google.com"],
  ["Wikivoyage", "https://www.wikivoyage.org"],
  ["GOV.UK", "https://www.gov.uk/foreign-travel-advice"],
  ["Google Gemini", "https://ai.google.dev"],
];

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-20 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <Link
            href="/briefing?id=sample"
            className="group inline-flex animate-rise items-center gap-2 rounded-full border border-line bg-card/70 py-1.5 pl-3 pr-2 text-[13px] text-ink-2 transition-colors hover:border-ink-2"
          >
            See a real briefing
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-7 animate-rise font-display text-[46px] leading-[1] [animation-delay:80ms] sm:text-[64px] lg:text-[76px]">
            <span className="sr-only">Know your destination before you land.</span>
            <span aria-hidden>
              Know
              <br />
              <RotatingWord words={PLACES} />
              <br />
              before you land.
            </span>
          </h1>

          <p className="mt-6 max-w-[38ch] animate-rise text-[18px] leading-relaxed text-ink-2 [animation-delay:160ms]">
            Weather, news, safety advice and a packing list for your trip, on one page.
          </p>

          <div className="mt-10 flex animate-rise flex-wrap items-center gap-x-6 gap-y-4 [animation-delay:240ms]">
            <Link href="/plan" className="btn btn-cta">
              Plan my trip
              <span className="cta-arrow">
                <ArrowRight className="h-5 w-5" />
              </span>
            </Link>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Free · No sign-up</span>
          </div>
        </div>
        <PassPreview />
      </section>

      {/* WHAT'S INSIDE (marquee, pauses on hover) */}
      <section className="overflow-hidden border-y border-line py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]" aria-label="What's in a briefing">
        <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
              {INSIDE.map((item) => (
                <li key={item} className="flex items-center gap-10 pr-10 font-display text-[26px] text-ink-2">
                  {item}
                  <span className="h-1.5 w-1.5 rounded-full bg-forest" aria-hidden />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <ol className="grid gap-8 md:grid-cols-3 md:gap-0">
          {STEPS.map(([n, text], i) => (
            <li key={n} className={`flex items-baseline gap-4 md:px-8 ${i > 0 ? "md:border-l md:border-line" : "md:pl-0"}`}>
              <span className="font-mono text-[12px] text-muted">{n}</span>
              <span className="text-[17px] leading-snug">{text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* SOURCES */}
      <section id="sources" className="bg-forest text-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-[40ch] text-[16px] leading-relaxed text-paper/80">
            Every number and headline comes from a real source. The AI only writes it up.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {SOURCES.map(([name, url]) => (
              <li key={name}>
                <a href={url} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-1 text-[15px] font-medium">
                  {name}
                  <ArrowUpRight className="h-4 w-4 text-paper/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-paper" strokeWidth={1.5} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-[13px] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="font-display text-[22px] text-ink">Tripcast</span>
          <span>Always check official travel advice before you go.</span>
        </div>
      </footer>
    </main>
  );
}
