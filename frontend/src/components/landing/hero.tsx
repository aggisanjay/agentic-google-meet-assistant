"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import type { HeroPhase } from "./three/week-scene";
import { useInView, useWebGLCapability } from "./hooks";

const WeekScene = dynamic(() => import("./three/week-scene"), { ssr: false });

const TRACE: { phase: HeroPhase; tool: string; text: string }[] = [
  { phase: 0, tool: "started", text: "Parse: “1:1 with Bob, Wednesday 3pm”" },
  { phase: 1, tool: "checkCalendarBusy", text: "freebusy.query · Wed 09:00–18:00" },
  { phase: 2, tool: "conflict", text: "1 overlap with Sprint planning → proposing 16:00" },
  { phase: 3, tool: "confirmation", text: "Waiting for your approval…" },
  { phase: 4, tool: "createMeeting", text: "Event created · Meet link attached · verified via Calendar API" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const scrollRef = useRef(0);
  const reduce = useReducedMotion();
  const { live } = useWebGLCapability();
  const [inViewRef, inView] = useInView<HTMLDivElement>({ margin: "100px" });
  const [phase, setPhase] = useState<HeroPhase>(0);
  const [ready, setReady] = useState(false);
  const [freezeAt, setFreezeAt] = useState<number | null>(null);
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("ht");
    if (v && !Number.isNaN(Number(v))) setFreezeAt(Number(v));
  }, []);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  useMotionValueEvent(scrollYProgress, "change", (v) => { scrollRef.current = v; });
  const onPhase = useCallback((p: HeroPhase) => setPhase(p), []);
  const onReady = useCallback(() => setReady(true), []);

  const fade = (i: number) => (reduce ? { initial: false as const } : {
    initial: { opacity: 0, y: 22, filter: "blur(10px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section ref={ref} id="top" className="relative isolate overflow-hidden lg:min-h-[100svh]" aria-label="Introduction">
      <div className="mx-auto grid min-h-[100svh] w-full max-w-[1280px] items-center px-5 pb-24 pt-28 sm:px-8 max-lg:min-h-0 max-lg:pb-6 lg:grid-cols-12">
        <div className="relative z-10 lg:col-span-6 xl:col-span-5">
          <motion.p {...fade(0)} className="eyebrow mb-7 flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-[rgb(var(--lp-green))] [animation:lp-ping_1.8s_ease-out_infinite]" />
              <span className="relative h-2 w-2 rounded-full bg-[rgb(var(--lp-green))]" />
            </span>
            Autonomous · Auditable · Google Calendar
          </motion.p>

          <motion.h1 {...fade(1)} className="display text-[clamp(2.6rem,4.9vw,4.7rem)] text-white [text-wrap:balance]">
            An agent that books meetings,{" "}
            <span className="text-[var(--lp-mute)]">and shows its work.</span>
          </motion.h1>

          <motion.p {...fade(2)} className="mt-7 max-w-[34rem] text-[17px] leading-relaxed text-[var(--lp-mute)]">
            Gemini plans. Google Calendar confirms. Every action is checked for conflicts, approved by you, and traced back to its source.
          </motion.p>

          <motion.div {...fade(3)} className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/sign-in"
              className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#e8efea] pl-7 pr-2 text-[15px] font-medium text-[#07090a] transition-all hover:bg-white active:scale-[0.98]"
            >
              Open the assistant
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[#07090a] text-white transition-transform duration-300 group-hover:translate-x-0.5">
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
            <a href="#demo" className="glass inline-flex h-14 items-center rounded-full px-7 text-[15px] text-[#e8efea] transition-colors hover:bg-white/10">
              Watch it work
            </a>
          </motion.div>

          <motion.p {...fade(4)} className="mono mt-12 hidden text-[12px] lg:block tracking-wide text-[var(--lp-mute)]">
            Next.js 16 · Mastra · Gemini · Descope · Google Calendar API
          </motion.p>
        </div>
      </div>

      {/* 3D stage (poster first, WebGL on top) */}
      <div ref={inViewRef} className="absolute inset-0 -z-10 max-lg:relative max-lg:inset-auto max-lg:z-0 max-lg:-mt-6 max-lg:h-[62svh] max-lg:min-h-[380px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-poster.webp" alt="" width={1600} height={1000} fetchPriority="high" decoding="async"
          className={`absolute inset-0 h-full w-full object-cover object-[70%_50%] transition-opacity duration-1000 ${ready && live ? "opacity-0" : "opacity-100"}`}
        />
        {live && (
          <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} data-stage data-ready={ready} data-phase={phase}>
            <WeekScene scrollRef={scrollRef} visible={inView} onPhase={onPhase} onReady={onReady} reduced={!!reduce} freezeAt={freezeAt} />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_75%_40%,transparent_30%,rgba(7,9,10,0.75)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#07090a] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[#07090a] via-[#07090a]/60 to-transparent max-lg:hidden" />
      </div>

      {/* live agent trace: compact status bar, synced to the 3D phases */}
      <motion.aside
        {...fade(5)}
        aria-label="Live agent trace"
        className="glass absolute inset-x-4 bottom-4 z-10 rounded-2xl px-4 py-3 sm:inset-x-8 lg:inset-x-auto lg:bottom-8 lg:right-10 lg:w-[480px]"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {TRACE.map((r) => (
              <span
                key={r.tool}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  phase === r.phase ? (r.tool === "conflict" ? "w-6 bg-[rgb(var(--lp-amber))]" : "w-6 bg-[rgb(var(--lp-green))]") : phase > r.phase ? "w-1.5 bg-[rgb(var(--lp-green))]/70" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
          <span className="eyebrow ml-auto !text-[10px]">sample session</span>
        </div>
        <div className="relative mt-2.5 h-[42px] overflow-hidden" aria-live="polite">
          {TRACE.map((r) => {
            const on = (phase >= 4 ? 4 : phase) === r.phase;
            return (
              <div
                key={r.tool}
                className={`absolute inset-0 transition-all duration-500 ${on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              >
                <span className={`mono block text-[11px] ${r.tool === "conflict" ? "text-[rgb(var(--lp-amber))]" : "text-[rgb(var(--lp-green))]"}`}>{r.tool}</span>
                <span className="block truncate text-[13px] leading-snug text-[#cdd8d1]">{r.text}</span>
              </div>
            );
          })}
        </div>
      </motion.aside>
    </section>
  );
}
