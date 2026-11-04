"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";
import { Fingerprint, ShieldAlert, ShieldCheck } from "lucide-react";
import { Reveal } from "./reveal";

function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) { ref.current.textContent = to.toFixed(decimals) + suffix; return; }
    const c = animate(0, to, {
      duration: 1.6, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = v.toFixed(decimals) + suffix; },
    });
    return () => c.stop();
  }, [inView, to, decimals, suffix, reduce]);
  return <span ref={ref} className="tabular-nums">{(0).toFixed(decimals)}{suffix}</span>;
}

const GUARDS = [
  { icon: ShieldCheck, title: "Two-phase writes", body: "Creating, rescheduling or cancelling pauses on a confirmation card. Nothing is written until you press Confirm." },
  { icon: ShieldAlert, title: "Untrusted by default", body: "Event titles, descriptions and notes are sanitised and treated as data. The agent is instructed never to follow them." },
  { icon: Fingerprint, title: "Ephemeral tokens", body: "Google tokens are fetched per action through Descope. They never reach the browser or client storage." },
];

const METRICS: { to: number; suffix: string; decimals?: number; label: string; good?: boolean }[] = [
  { to: 15, suffix: "/15", label: "Eval scenarios passed" },
  { to: 0, suffix: "%", label: "Prompt-injection bypass" },
  { to: 0, suffix: "%", label: "Unauthorized writes" },
  { to: 100, suffix: "%", label: "Conflict detection" },
  { to: 87.5, suffix: "%", decimals: 1, label: "Tool-selection accuracy" },
];

export function Safety() {
  return (
    <section id="safety" className="relative mx-auto w-full max-w-[1280px] px-5 py-28 sm:px-8 sm:py-36" aria-label="Safety and evaluation">
      <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-[520px] -translate-y-1/2 bg-[radial-gradient(50%_60%_at_20%_50%,rgba(255,107,107,0.05),transparent_70%)]" />
      <div className="grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow mb-4">Safety, measured</p>
            <h2 className="display text-[clamp(2.1rem,4vw,3.6rem)] text-white [text-wrap:balance]">Autonomy with a hard stop.</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-[var(--lp-mute)]">
              An agent that can write to your calendar needs more than good intentions. These guarantees are enforced in code, and tested.
            </p>
          </Reveal>
          <ul className="mt-10 space-y-3">
            {GUARDS.map((g, i) => (
              <Reveal key={g.title} delay={i * 0.08}>
                <li className="glass flex gap-4 rounded-2xl p-5">
                  <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl border border-[rgb(var(--lp-green))]/25 bg-[rgb(var(--lp-green))]/[0.08] text-[rgb(var(--lp-green))]"><g.icon className="h-[18px] w-[18px]" /></span>
                  <div>
                    <h3 className="text-[16px] font-medium tracking-tight text-white">{g.title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-[var(--lp-mute)]">{g.body}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7">
          <Reveal>
            <div className="glass rounded-3xl p-6 sm:p-9">
              <div className="mb-7 flex items-center justify-between">
                <span className="eyebrow">Eval suite results</span>
                <span className="mono rounded-full border hairline px-3 py-1 text-[11px] text-[var(--lp-mute)]">npm run eval</span>
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-9">
                {METRICS.map((m, i) => (
                  <div key={m.label} className={i === 0 ? "col-span-2" : ""}>
                    <dd className={`display ${i === 0 ? "text-[clamp(4rem,9vw,7.5rem)]" : "text-[clamp(2.4rem,4.4vw,3.6rem)]"} ${m.to === 0 ? "text-[rgb(var(--lp-green))]" : "text-white"}`}>
                      <CountUp to={m.to} suffix={m.suffix} decimals={m.decimals} />
                    </dd>
                    <dt className="mono mt-2 text-[11px] uppercase tracking-[0.14em] text-[var(--lp-mute)]">{m.label}</dt>
                  </div>
                ))}
              </dl>
              <p className="mt-9 border-t hairline pt-5 text-[13px] leading-relaxed text-[var(--lp-mute)]">
                Results from the repository&apos;s built-in evaluation suite (<span className="mono">backend/evals</span>). Run it yourself, and read the scenarios. We show the 87.5% tool-selection score too, because honest numbers are the point.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
