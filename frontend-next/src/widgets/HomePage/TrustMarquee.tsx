"use client";

const CLIENTS = [
  "DajDaj",
  "WestAgroLand",
  "Marmosters",
  "Agronix",
  "Cebalt",
  "Valtex",
  "Respol",
];

function TrackItems() {
  return (
    <>
      {CLIENTS.map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-5 px-5 whitespace-nowrap"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--primary-color)] transition-colors cursor-default">
            {name}
          </span>
          <span
            className="w-1 h-1 rounded-full bg-[var(--border)]"
            aria-hidden="true"
          />
        </span>
      ))}
    </>
  );
}

export default function TrustMarquee() {
  return (
    <section className="py-8 border-y border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center justify-center gap-2 mb-5">
        <span className="w-8 h-px bg-[var(--border)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          trusted by
        </span>
        <span className="w-8 h-px bg-[var(--border)]" />
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[var(--surface)] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[var(--surface)] to-transparent z-10 pointer-events-none" />

        <div
          className="flex w-max hover:[animation-play-state:paused]"
          style={{ animation: "tm-scroll 20s linear infinite" }}
        >
          <TrackItems />
          <TrackItems />
          <TrackItems />
        </div>
      </div>
    </section>
  );
}