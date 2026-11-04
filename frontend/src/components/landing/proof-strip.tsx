const STACK = ["Next.js 16", "React 19", "Express 5", "Mastra", "Google Gemini", "Descope", "Google Calendar API", "PostgreSQL", "Zod", "Vitest"];

export function ProofStrip() {
  return (
    <section aria-label="Built with" className="border-y hairline py-7">
      <div className="flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <div className="flex min-w-max shrink-0 items-center [animation:lp-marquee_46s_linear_infinite] hover:[animation-play-state:paused]">
          {[0, 1].map((k) => (
            <div key={k} className="flex shrink-0 items-center" aria-hidden={k === 1}>
              {STACK.map((s) => (
                <span key={`${k}-${s}`} className="flex items-center">
                  <span className="px-9 text-[26px] font-medium tracking-tight text-[var(--lp-mute)]/70 transition-colors hover:text-white sm:px-12 sm:text-[32px]">{s}</span>
                  <span className="h-1 w-1 rounded-full bg-[rgb(var(--lp-green))]/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
