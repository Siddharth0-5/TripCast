/**
 * Section: shared card frame for dashboard blocks (label, title, optional aside).
 */
export function Section({
  eyebrow,
  title,
  aside,
  children,
}: {
  eyebrow: string;
  title?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 sm:p-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          {title && <h2 className="mt-2 font-display text-[30px] leading-[1.05]">{title}</h2>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Dot colours for severity and impact values. */
export const TONE = {
  info: "bg-sky",
  caution: "bg-caution",
  warning: "bg-warn",
  positive: "bg-go",
  neutral: "bg-muted",
  negative: "bg-warn",
} as const;
