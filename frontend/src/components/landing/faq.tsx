"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Reveal } from "./reveal";

const QA = [
  { q: "Can the agent change my calendar without asking?", a: "No. Creating, rescheduling and cancelling meetings pause on a confirmation card. Nothing is written until you press Confirm, and Cancel leaves your calendar untouched." },
  { q: "What if a calendar event contains hostile instructions?", a: "Event titles, descriptions and notes are treated as untrusted data. They are sanitised before the model sees them, and the agent is instructed never to follow them. The repository's eval suite includes injection scenarios." },
  { q: "Where do my Google tokens live?", a: "They are fetched ephemerally per action through Descope Outbound Apps. They are never exposed to the frontend or kept in client-side storage." },
  { q: "How do I know a booking really happened?", a: "After every write, the agent re-reads the event from Google Calendar to verify it, then attaches provenance showing the source and the verification." },
  { q: "Which model does it use?", a: "Google Gemini Flash models, with automatic fallback across providers. Per-request telemetry tracks time-to-first-token, latency, token usage and cost." },
  { q: "Can I verify the safety claims myself?", a: "Yes. The backend ships an eval runner (npm run eval) and a Vitest suite, and the whole project is open source." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto w-full max-w-[1000px] px-5 py-28 sm:px-8 sm:py-32" aria-label="Frequently asked questions">
      <Reveal>
        <p className="eyebrow mb-4">FAQ</p>
        <h2 className="display text-[clamp(2.1rem,4vw,3.4rem)] text-white">Questions worth asking.</h2>
      </Reveal>
      <div className="mt-10 divide-y hairline border-y hairline">
        {QA.map((it, i) => {
          const on = open === i;
          return (
            <div key={it.q}>
              <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-6 py-6 text-left">
                <span className="text-[18px] font-medium tracking-tight text-white sm:text-[20px]">{it.q}</span>
                <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border hairline transition-all duration-500 ${on ? "rotate-45 bg-[#e8efea] text-[#07090a]" : "text-[var(--lp-mute)]"}`}><Plus className="h-4 w-4" /></span>
              </button>
              <div className={`grid transition-all duration-500 ease-out ${on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <p className="overflow-hidden pr-14 text-[16px] leading-relaxed text-[var(--lp-mute)]"><span className="block pb-7">{it.a}</span></p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
