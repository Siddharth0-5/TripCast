"use client";
/**
 * Questionnaire: six-step trip form (where/when, who, trip type, interests,
 * concerns, review). The draft is persisted to localStorage; on submit it is
 * handed to <Generating/>.
 */
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Plus, Trash2, User, Heart, Users, Baby, Briefcase, Armchair } from "lucide-react";
import { PlaceSearch, type PickedPlace } from "./PlaceSearch";
import { Generating } from "./Generating";
import { loadDraft, saveDraft } from "@/lib/storage";
import { CONCERNS, INTERESTS, type TripInput } from "@/lib/types";
import { dateRange, label, nights } from "@/lib/format";

type DraftStop = { place: PickedPlace | null; startDate: string; endDate: string };
type Draft = {
  stops: DraftStop[];
  homeCity: string;
  group: TripInput["group"] | null;
  withKids: boolean;
  withSeniors: boolean;
  purpose: TripInput["purpose"] | null;
  pace: TripInput["pace"];
  budget: TripInput["budget"];
  interests: TripInput["interests"];
  concerns: TripInput["concerns"];
  notes: string;
};

const EMPTY: Draft = {
  stops: [{ place: null, startDate: "", endDate: "" }],
  homeCity: "",
  group: null,
  withKids: false,
  withSeniors: false,
  purpose: null,
  pace: "balanced",
  budget: "comfortable",
  interests: [],
  concerns: [],
  notes: "",
};

const GROUP_OPTIONS = [
  { id: "solo", title: "Just me", icon: User },
  { id: "couple", title: "Two of us", icon: Heart },
  { id: "family", title: "Family", icon: Baby },
  { id: "friends", title: "Friends", icon: Users },
  { id: "business", title: "Work trip", icon: Briefcase },
] as const;

const PURPOSE_OPTIONS: Record<TripInput["purpose"], string> = {
  leisure: "Holiday",
  culture: "Culture & sights",
  adventure: "Adventure",
  relaxation: "Rest & recharge",
  romance: "Romantic",
  work: "Work",
  "family-visit": "Visiting family",
};

const STEP_TITLES = ["Where & when", "Who's going", "The kind of trip", "What you love", "Anything to watch for", "Review"];

const today = () => new Date().toISOString().slice(0, 10);

export function Questionnaire() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [submitted, setSubmitted] = useState<TripInput | null>(null);

  // Restore any saved draft after mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading browser storage must happen after mount
    setDraft(loadDraft(EMPTY));
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) saveDraft(draft);
  }, [draft, loaded]);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setStop = (i: number, patch: Partial<DraftStop>) =>
    update({ stops: draft.stops.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  // Validation messages for the current step.
  const problems = (() => {
    if (step === 0) {
      return draft.stops.flatMap((s, i) => {
        const n = draft.stops.length > 1 ? `Stop ${i + 1}: ` : "";
        if (!s.place) return [`${n}choose a place`];
        if (!s.startDate || !s.endDate) return [`${n}pick both dates`];
        if (s.endDate < s.startDate) return [`${n}the end date is before the start`];
        if (s.endDate < today()) return [`${n}dates are in the past`];
        if (nights(s.startDate, s.endDate) > 60) return [`${n}maximum 60 nights per stop`];
        return [];
      });
    }
    if (step === 1 && !draft.group) return ["Choose who's going"];
    if (step === 2 && !draft.purpose) return ["Choose the kind of trip"];
    return [];
  })();

  const canContinue = problems.length === 0;
  const next = () => canContinue && setStep((s) => Math.min(s + 1, 5));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  function toTripInput(): TripInput {
    return {
      stops: draft.stops.map((s) => ({ ...s.place!, startDate: s.startDate, endDate: s.endDate })),
      homeCity: draft.homeCity.trim(),
      group: draft.group!,
      withKids: draft.withKids,
      withSeniors: draft.withSeniors,
      purpose: draft.purpose!,
      pace: draft.pace,
      budget: draft.budget,
      interests: draft.interests,
      concerns: draft.concerns,
      notes: draft.notes.trim(),
    };
  }

  if (submitted) return <Generating trip={submitted} onEdit={() => setSubmitted(null)} />;

  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

  return (
    <div
      className="mx-auto w-full max-w-2xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16"
      onKeyDown={(e) => {
        // Enter advances, except inside the notes textarea.
        if (e.key === "Enter" && step < 5 && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault();
          next();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow">Step {step + 1} of 6 · {STEP_TITLES[step]}</span>
        {step > 0 && (
          <button onClick={() => { setDraft(EMPTY); setStep(0); }} className="text-[13px] text-muted hover:text-ink">
            Start over
          </button>
        )}
      </div>
      <div className="mt-3 h-[3px] overflow-hidden rounded-full bg-paper-2">
        <div className="h-full rounded-full bg-forest transition-[width] duration-500" style={{ width: `${((step + 1) / 6) * 100}%` }} />
      </div>

      <div key={step} className="animate-rise pt-10">
        {step === 0 && (
          <>
            <Question title="Where are you going, and when?" hint="Add each stop in order. Up to five." />
            <div className="space-y-4">
              {draft.stops.map((s, i) => (
                <div key={i} className="card p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="eyebrow">Stop {i + 1}</span>
                    {draft.stops.length > 1 && (
                      <button onClick={() => update({ stops: draft.stops.filter((_, j) => j !== i) })} className="rounded-full p-1.5 text-muted hover:bg-paper-2 hover:text-warn" aria-label={`Remove stop ${i + 1}`}>
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                  <PlaceSearch value={s.place} autoFocus={i === draft.stops.length - 1 && !s.place} onPick={(p) => setStop(i, { place: p })} onClear={() => setStop(i, { place: null })} />
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <DateField label="Arrive" value={s.startDate} min={i > 0 ? draft.stops[i - 1].endDate || today() : today()} onChange={(v) => setStop(i, { startDate: v, endDate: s.endDate && s.endDate >= v ? s.endDate : "" })} />
                    <DateField label="Leave" value={s.endDate} min={s.startDate || today()} onChange={(v) => setStop(i, { endDate: v })} />
                  </div>
                  {s.startDate && s.endDate && s.endDate >= s.startDate && (
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                      {dateRange(s.startDate, s.endDate)} · {nights(s.startDate, s.endDate)} nights
                    </p>
                  )}
                </div>
              ))}
            </div>
            {draft.stops.length < 5 && (
              <button
                onClick={() => update({ stops: [...draft.stops, { place: null, startDate: draft.stops.at(-1)?.endDate ?? "", endDate: "" }] })}
                className="mt-4 inline-flex items-center gap-2 rounded-full px-1 text-[15px] font-medium text-forest hover:text-ink"
              >
                <Plus className="h-4 w-4" /> Add another stop
              </button>
            )}
            <div className="mt-10">
              <label className="eyebrow mb-2 block" htmlFor="home">Travelling from (optional)</label>
              <input id="home" className="field" placeholder="e.g. Mumbai" value={draft.homeCity} maxLength={120} onChange={(e) => update({ homeCity: e.target.value })} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <Question title="Who's going?" hint="A family needs different advice than someone travelling solo." />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GROUP_OPTIONS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => update({ group: g.id })}
                  aria-pressed={draft.group === g.id}
                  className={`flex h-28 flex-col justify-between rounded-[18px] border p-4 text-left transition-all ${draft.group === g.id ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-ink-2"}`}
                >
                  <g.icon className="h-5 w-5" strokeWidth={1.5} />
                  <span className="text-[16px] font-medium">{g.title}</span>
                </button>
              ))}
            </div>
            <div className="mt-8 space-y-3">
              <Toggle checked={draft.withKids} onChange={(v) => update({ withKids: v })} icon={Baby} text="Children are coming" />
              <Toggle checked={draft.withSeniors} onChange={(v) => update({ withSeniors: v })} icon={Armchair} text="Older adults are coming" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Question title="What kind of trip is it?" />
            <div className="flex flex-wrap gap-2.5">
              {Object.entries(PURPOSE_OPTIONS).map(([id, title]) => (
                <button key={id} className="chip" aria-pressed={draft.purpose === id} onClick={() => update({ purpose: id as TripInput["purpose"] })}>
                  {title}
                </button>
              ))}
            </div>
            <Segmented title="Pace" value={draft.pace} options={[["relaxed", "Slow & easy"], ["balanced", "Balanced"], ["packed", "See it all"]]} onChange={(v) => update({ pace: v })} />
            <Segmented title="Budget" value={draft.budget} options={[["shoestring", "Shoestring"], ["comfortable", "Comfortable"], ["luxury", "Treat ourselves"]]} onChange={(v) => update({ budget: v })} />
          </>
        )}

        {step === 3 && (
          <>
            <Question title="What do you love doing?" hint="Pick as many as you like, or none." />
            <div className="flex flex-wrap gap-2.5">
              {INTERESTS.map((x) => (
                <button key={x} className="chip" aria-pressed={draft.interests.includes(x)} onClick={() => update({ interests: toggle(draft.interests, x) })}>
                  {label(x)}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <Question title="Anything we should watch out for?" hint="We'll pay extra attention to these in your briefing." />
            <div className="flex flex-wrap gap-2.5">
              {CONCERNS.map((x) => (
                <button key={x} className="chip" aria-pressed={draft.concerns.includes(x)} onClick={() => update({ concerns: toggle(draft.concerns, x) })}>
                  {CONCERN_LABELS[x]}
                </button>
              ))}
            </div>
            <div className="mt-8">
              <label className="eyebrow mb-2 block" htmlFor="notes">Anything else? (optional)</label>
              <textarea
                id="notes"
                className="field h-32 resize-none py-3 leading-relaxed"
                placeholder="e.g. It's our anniversary. My mother uses a walking stick. We're vegetarian."
                maxLength={500}
                value={draft.notes}
                onChange={(e) => update({ notes: e.target.value })}
              />
              <p className="mt-2 text-[13px] text-muted">Please don&apos;t include private details like passport numbers. On the free tier, Google may use what you enter to improve its models.</p>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <Question title="Ready for your briefing?" hint="Check the details. Creating it takes under a minute and uses one free AI request." />
            <dl className="divide-y divide-line border-y border-line">
              <Row k="Itinerary" onEdit={() => setStep(0)}>
                {draft.stops.map((s, i) => (
                  <div key={i}>
                    <span className="font-medium">{s.place?.name}</span>
                    <span className="text-muted">, {s.place?.country} · {dateRange(s.startDate, s.endDate)}</span>
                  </div>
                ))}
                {draft.homeCity && <div className="text-muted">From {draft.homeCity}</div>}
              </Row>
              <Row k="Travellers" onEdit={() => setStep(1)}>
                {GROUP_OPTIONS.find((g) => g.id === draft.group)?.title}
                {draft.withKids && " · with children"}
                {draft.withSeniors && " · with older adults"}
              </Row>
              <Row k="Trip" onEdit={() => setStep(2)}>
                {draft.purpose && PURPOSE_OPTIONS[draft.purpose]} · {label(draft.pace)} pace · {label(draft.budget)} budget
              </Row>
              <Row k="Loves" onEdit={() => setStep(3)}>{draft.interests.map(label).join(", ") || "None"}</Row>
              <Row k="Watch for" onEdit={() => setStep(4)}>
                {draft.concerns.map((c) => CONCERN_LABELS[c]).join(", ") || "None"}
                {draft.notes && <div className="mt-1 text-muted">“{draft.notes}”</div>}
              </Row>
            </dl>
          </>
        )}
      </div>

      <div className="mt-12 flex items-center justify-between gap-4">
        <button onClick={back} className={`btn btn-ghost ${step === 0 ? "invisible" : ""}`}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-4">
          {!canContinue && <span className="hidden text-[13px] text-muted sm:inline">{problems[0]}</span>}
          {step < 5 ? (
            <button onClick={next} disabled={!canContinue} className="btn btn-ink px-6">
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => setSubmitted(toTripInput())} className="btn btn-ink h-12 px-7">
              Create my briefing <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const CONCERN_LABELS: Record<(typeof CONCERNS)[number], string> = {
  heat: "Heat",
  cold: "Cold",
  rain: "Rain",
  crowds: "Crowds",
  safety: "Personal safety",
  health: "Health",
  mobility: "Limited mobility",
  dietary: "Dietary needs",
  budget: "Costs",
};

function Question({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[40px] leading-[1.02] sm:text-[52px]">{title}</h1>
      {hint && <p className="mt-3 text-[16px] text-ink-2">{hint}</p>}
    </div>
  );
}

function DateField({ label, value, min, onChange }: { label: string; value: string; min: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block">{label}</span>
      <input type="date" className="field font-mono text-[15px]" value={value} min={min} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function Toggle({ checked, onChange, text, icon: Icon }: { checked: boolean; onChange: (v: boolean) => void; text: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }) {
  return (
    <button onClick={() => onChange(!checked)} role="switch" aria-checked={checked} className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-card px-4 py-3.5 text-left hover:border-ink-2">
      <Icon className="h-4 w-4 text-ink-2" strokeWidth={1.75} />
      <span className="text-[15px]">{text}</span>
      <span className={`ml-auto flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${checked ? "bg-forest" : "bg-line"}`}>
        <span className={`h-5 w-5 rounded-full bg-card shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function Segmented<T extends string>({ title, value, options, onChange }: { title: string; value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="mt-9">
      <span className="eyebrow mb-2.5 block">{title}</span>
      <div className="grid grid-cols-3 rounded-full border border-line bg-card p-1">
        {options.map(([id, text]) => (
          <button key={id} onClick={() => onChange(id)} aria-pressed={value === id} className={`h-10 rounded-full text-[14px] transition-colors ${value === id ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"}`}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function Row({ k, onEdit, children }: { k: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr_auto] items-baseline gap-4 py-4 text-[15px]">
      <dt className="eyebrow">{k}</dt>
      <dd>{children}</dd>
      <button onClick={onEdit} className="text-[13px] text-forest hover:text-ink">Edit</button>
    </div>
  );
}
