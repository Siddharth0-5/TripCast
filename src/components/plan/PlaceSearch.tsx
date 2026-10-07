"use client";
/**
 * PlaceSearch: debounced place autocomplete backed by /api/places (Open-Meteo
 * geocoding). Stores exact coordinates of the picked result so ambiguous
 * names resolve correctly. Supports arrow keys, Enter and Escape.
 */
import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import type { Place } from "@/lib/sources/places";

export type PickedPlace = Omit<Place, "population">;

export function PlaceSearch({
  value,
  onPick,
  onClear,
  autoFocus,
}: {
  value: PickedPlace | null;
  onPick: (p: PickedPlace) => void;
  onClear: () => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/places?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await r.json();
        setResults(data.places ?? []);
        setActive(0);
        setOpen(true);
      } catch {
        /* aborted by a newer query */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close on outside click.
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  function pick(p: Place) {
    const { population: _unused, ...place } = p;
    void _unused;
    onPick(place);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  if (value) {
    return (
      <div className="flex h-[52px] items-center gap-3 rounded-[14px] border border-ink bg-card px-4">
        <MapPin className="h-4 w-4 shrink-0 text-forest" strokeWidth={1.75} />
        <span className="truncate text-[16px] font-medium">{value.name}</span>
        <span className="truncate text-[14px] text-muted">{[value.admin, value.country].filter(Boolean).join(", ")}</span>
        <button type="button" onClick={onClear} className="ml-auto rounded-full p-1 text-muted hover:bg-paper-2 hover:text-ink" aria-label="Change place">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
      <input
        className="field pl-11"
        placeholder="City or town, e.g. Kyoto"
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.trim().length < 2) {
            setResults([]);
            setOpen(false);
          }
        }}
        onFocus={() => results.length && setOpen(true)}
        onKeyDown={(e) => {
          if (!open || !results.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); pick(results[active]); }
          if (e.key === "Escape") setOpen(false);
        }}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
      />
      {loading && <span className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-line border-t-ink" />}

      {open && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-2xl border border-line bg-card py-1.5 shadow-[0_24px_60px_-28px_rgba(22,20,17,0.45)]">
          {results.length === 0 && <li className="px-4 py-3 text-[14px] text-muted">No places found. Try another spelling.</li>}
          {results.map((p, i) => (
            <li
              key={`${p.lat},${p.lon}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(p); }}
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 ${i === active ? "bg-paper-2" : ""}`}
            >
              <span className="w-8 shrink-0 font-mono text-[11px] text-muted">{p.countryCode}</span>
              <span className="text-[15px] font-medium">{p.name}</span>
              <span className="truncate text-[14px] text-muted">{[p.admin, p.country].filter(Boolean).join(", ")}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
