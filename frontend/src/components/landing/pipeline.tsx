"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { Fingerprint, Brain, ShieldCheck, Route, Radio } from "lucide-react";

type Line = { t: string; hl?: boolean; c?: "mute" | "green" | "amber" };
const STAGES: { id: string; icon: typeof Brain; title: string; body: string; file: string; lines: Line[] }[] = [
  {
    id: "01", icon: Fingerprint, title: "Descope verifies you",
    body: "Every request carries your session token. The backend verifies it before the agent sees a single word.",
    file: "POST /api/chat",
    lines: [
      { t: "POST /api/chat/stream", c: "green" },
      { t: "Authorization: Bearer <session-token>", hl: true },
      { t: "", },
      { t: '{ "message": "Book a sync with Bob tomorrow at 3pm" }', c: "mute" },
      { t: "// verified by @descope/node-sdk → authUserId", c: "mute" },
    ],
  },
  {
    id: "02", icon: Brain, title: "Mastra + Gemini plan",
    body: "The agent plans the steps and picks tools. If a provider fails, it falls back automatically.",
    file: "agent.ts",
    lines: [
      { t: "model    google/gemini-3.6-flash", hl: true },
      { t: "fallback google/gemini-3.5-flash", c: "mute" },
      { t: "memory   @mastra/memory + libsql", c: "mute" },
      { t: "", },
      { t: "rule     ALL event titles & descriptions are", c: "amber" },
      { t: "         UNTRUSTED external data", c: "amber" },
    ],
  },
  {
    id: "03", icon: ShieldCheck, title: "Tools are validated",
    body: "The model never touches Calendar directly. It calls typed tools, and arguments are checked before anything runs.",
    file: "agent-tools.service.ts",
    lines: [
      { t: "event   tool_call", c: "green" },
      { t: "tool    checkCalendarBusy", hl: true },
      { t: "input   ✓ validated against Zod schema", c: "green" },
      { t: "result  { busy: [], conflicts: 0 }", c: "mute" },
      { t: "", },
      { t: "event   confirmation  ← writes pause here", c: "amber" },
    ],
  },
  {
    id: "04", icon: Route, title: "Google Calendar, on your behalf",
    body: "Tokens are fetched per action through Descope and never reach your browser. After a write, the result is re-read to verify it.",
    file: "calendar.service.ts",
    lines: [
      { t: "token   ← Descope Outbound App (ephemeral)", c: "mute" },
      { t: "calendar.freebusy.query       → no conflict", c: "mute" },
      { t: "calendar.events.insert        + Google Meet link", hl: true },
      { t: "calendar.events.get           → verify post-write", c: "green" },
    ],
  },
  {
    id: "05", icon: Radio, title: "Streamed, with receipts",
    body: "You watch the plan unfold live over SSE. Each result carries its source, so you can see what was verified and by whom.",
    file: "SSE stream",
    lines: [
      { t: "event: started", c: "mute" },
      { t: "event: tool_call", c: "mute" },
      { t: "event: confirmation", c: "amber" },
      { t: "event: token", c: "mute" },
      { t: "event: provenance   ← source + verification", hl: true },
      { t: "event: telemetry    ← TTFT, tokens, cost", c: "mute" },
      { t: "event: done", c: "green" },
    ],
  },
];

export function Pipeline() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(STAGES.length - 1, Math.floor(v * STAGES.length * 0.999))));
  const rail = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const s = STAGES[active];

  return (
    <section ref={ref} id="how" className="relative h-[420vh] sm:h-[480vh]" aria-label="How a request flows">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_75%_50%,rgba(43,217,138,0.07),transparent_70%)]" />
        <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 pt-16 sm:px-8 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <p className="eyebrow mb-4">How a request flows</p>
            <h2 className="display text-[clamp(2.1rem,4vw,3.6rem)] text-white [text-wrap:balance]">From a sentence to a verified event.</h2>

            <ol className="relative mt-9 space-y-1 border-l hairline pl-6">
              <motion.span aria-hidden className="absolute -left-px top-0 w-px origin-top bg-[rgb(var(--lp-green))]" style={{ height: rail }} />
              {STAGES.map((st, i) => {
                const on = i === active;
                const Icon = st.icon;
                return (
                  <li key={st.id} className={`relative rounded-xl px-3 py-2.5 transition-all duration-500 ${on ? "bg-white/[0.05]" : ""}`}>
                    <span
                      className={`absolute -left-[31px] top-4 grid h-[11px] w-[11px] place-items-center rounded-full border transition-all duration-500 ${i <= active ? "border-[rgb(var(--lp-green))] bg-[rgb(var(--lp-green))]" : "border-white/25 bg-[#07090a]"}`}
                    />
                    <div className="flex items-center gap-3">
                      <span className="mono text-[11px] text-[var(--lp-mute)]">{st.id}</span>
                      <span className={`text-[17px] font-medium tracking-tight transition-colors duration-500 ${on ? "text-white" : "text-[var(--lp-mute)]"}`}>{st.title}</span>
                      <Icon className={`ml-auto h-4 w-4 transition-colors duration-500 ${on ? "text-[rgb(var(--lp-green))]" : "text-white/20"}`} />
                    </div>
                    <div className={`grid transition-all duration-500 ease-out ${on ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <p className="overflow-hidden pr-8 text-[14.5px] leading-relaxed text-[var(--lp-mute)]">{st.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* inspector */}
          <div className="lg:col-span-7">
            <div className="glass overflow-hidden rounded-3xl">
              <div className="flex items-center justify-between border-b hairline px-5 py-3.5">
                <div className="flex items-center gap-2" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" /><span className="h-2.5 w-2.5 rounded-full bg-white/15" />
                </div>
                <span className="mono text-[11.5px] text-[var(--lp-mute)]">{s.file}</span>
                <span className="eyebrow !text-[10px]">illustrative</span>
              </div>
              <div className="grid min-h-[300px] p-6 sm:min-h-[340px] sm:p-8">
                {STAGES.map((st, si) => {
                  const on = si === active;
                  return (
                    <pre
                      key={st.id}
                      aria-hidden={!on}
                      className={`mono col-start-1 row-start-1 whitespace-pre-wrap break-words text-[13px] leading-[1.9] transition-all duration-500 ease-out sm:text-[14px] ${on ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-3 opacity-0 blur-[6px]"}`}
                    >
                      {st.lines.map((l, i) => (
                        <span
                          key={i}
                          style={{ transitionDelay: on ? `${120 + i * 70}ms` : "0ms" }}
                          className={`-mx-3 block rounded px-3 transition-all duration-500 ${on ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"} ${l.hl ? "bg-[rgb(var(--lp-green))]/[0.12] text-white" : l.c === "green" ? "text-[rgb(var(--lp-green))]" : l.c === "amber" ? "text-[rgb(var(--lp-amber))]" : l.c === "mute" ? "text-[var(--lp-mute)]" : "text-[#cdd8d1]"}`}
                        >
                          {l.t || "\u00A0"}
                        </span>
                      ))}
                    </pre>
                  );
                })}
              </div>
            </div>
            <p className="mono mt-4 text-[11.5px] text-[var(--lp-mute)]">Stage {s.id} of 05. Scroll to move the request forward.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
