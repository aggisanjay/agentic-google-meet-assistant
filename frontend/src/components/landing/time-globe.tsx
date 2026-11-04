"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";
import { useInView, useWebGLCapability } from "./hooks";
import { CITIES } from "./three/globe-scene";

const GlobeScene = dynamic(() => import("./three/globe-scene"), { ssr: false });

/* ---- real timezone maths (Intl handles DST; no hard-coded offsets) ---- */
function tzOffsetMs(ts: number, tz: string) {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
    .formatToParts(new Date(ts)).reduce<Record<string, number>>((a, x) => { if (x.type !== "literal") a[x.type] = Number(x.value); return a; }, {});
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ts / 1000) * 1000;
}
function zonedToUtc(y: number, m: number, d: number, h: number, min: number, tz: string) {
  const guess = Date.UTC(y, m, d, h, min);
  let utc = guess - tzOffsetMs(guess, tz);
  utc = guess - tzOffsetMs(utc, tz);
  return utc;
}
const fmtTime = (ts: number, tz: string) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(ts);
const fmtDay = (ts: number, tz: string) => new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short" }).format(ts);

export function TimeGlobe() {
  const [selected, setSelected] = useState("tyo");
  const [now, setNow] = useState<number | null>(null);
  const [myTz, setMyTz] = useState("UTC");
  const [ready, setReady] = useState(false);
  const { live, reduced } = useWebGLCapability();
  const [ref, inView] = useInView<HTMLDivElement>({ margin: "150px" });

  useEffect(() => {
    setNow(Date.now());
    setMyTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const city = CITIES.find((c) => c.id === selected)!;
  const conv = useMemo(() => {
    if (now == null) return null;
    // "tomorrow 10:00" in the selected city, shown in the visitor's own timezone
    const n = new Date(now + 86400000);
    const parts = new Intl.DateTimeFormat("en-CA", { timeZone: city.tz, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(n);
    const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
    const utc = zonedToUtc(g("year"), g("month") - 1, g("day"), 10, 0, city.tz);
    return { theirs: fmtTime(utc, city.tz), mine: fmtTime(utc, myTz), dayMine: fmtDay(utc, myTz), dayTheirs: fmtDay(utc, city.tz) };
  }, [now, city, myTz]);

  return (
    <section id="time" className="relative mx-auto w-full max-w-[1280px] px-5 py-28 sm:px-8 sm:py-36" aria-label="Timezone engine">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow mb-4">Timezone engine</p>
            <h2 className="display text-[clamp(2.1rem,4vw,3.6rem)] text-white [text-wrap:balance]">Every city on its own clock.</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-[var(--lp-mute)]">
              Attendees are resolved to IANA timezones, and DST is handled by the platform, not by hand-written offsets. The globe below is live: the shaded side is where it is night right now.
            </p>
          </Reveal>

          <ul className="mt-9 divide-y hairline rounded-2xl border hairline" role="listbox" aria-label="Cities">
            {CITIES.map((c) => {
              const on = c.id === selected;
              return (
                <li key={c.id}>
                  <button
                    role="option" aria-selected={on} onClick={() => setSelected(c.id)}
                    className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors ${on ? "bg-[rgb(var(--lp-green))]/[0.07]" : "hover:bg-white/[0.04]"}`}
                  >
                    <span className={`h-2 w-2 rounded-full transition-colors ${on ? "bg-white" : "bg-[rgb(var(--lp-green))]/70"}`} />
                    <span className="text-[15.5px] font-medium tracking-tight text-white">{c.name}</span>
                    <span className="mono ml-auto text-[13px] tabular-nums text-[#cdd8d1]">{now == null ? "--:--" : fmtTime(now, c.tz)}</span>
                    <span className="mono w-8 text-right text-[11px] text-[var(--lp-mute)]">{now == null ? "" : fmtDay(now, c.tz)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="glass mt-4 rounded-2xl p-5" aria-live="polite">
            <p className="eyebrow mb-3">Tomorrow, in your timezone</p>
            <div className="flex items-center gap-4">
              <div>
                <div className="display text-[2.4rem] text-white tabular-nums">{conv?.theirs ?? "--:--"}</div>
                <div className="mono text-[11px] text-[var(--lp-mute)]">{city.name} · {conv?.dayTheirs}</div>
              </div>
              <ArrowRight className="h-5 w-5 text-[rgb(var(--lp-green))]" />
              <div>
                <div className="display text-[2.4rem] text-[rgb(var(--lp-green))] tabular-nums">{conv?.mine ?? "--:--"}</div>
                <div className="mono text-[11px] text-[var(--lp-mute)]">{myTz.replace("_", " ")} · {conv?.dayMine}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[620px] lg:col-span-7">
        <div ref={ref} className="relative aspect-square w-full">
          <div className="pointer-events-none absolute inset-[8%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(43,217,138,0.10),transparent)]" />
          {!live && (
            <div className="absolute inset-[6%] grid place-items-center rounded-full border hairline" role="img" aria-label="Globe preview unavailable. Use the city list.">
              <span className="eyebrow">3D globe disabled</span>
            </div>
          )}
          {live && (
            <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? "opacity-100" : "opacity-0"}`} data-globe data-ready={ready}>
              <GlobeScene selected={selected} visible={inView} reduced={reduced} onReady={() => setReady(true)} />
            </div>
          )}
        </div>
        <p className="mono mt-3 text-center text-[10.5px] uppercase tracking-[0.2em] text-[var(--lp-mute)]">Drag to rotate · Map data: Natural Earth</p>
        </div>
      </div>
    </section>
  );
}
