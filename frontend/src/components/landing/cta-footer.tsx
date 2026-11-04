"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "./reveal";

export function CtaFooter() {
  return (
    <>
      <section className="mx-auto w-full max-w-[1280px] px-5 pb-28 sm:px-8" aria-label="Get started">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.25rem] border hairline px-6 py-20 text-center sm:py-28">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_120%,rgba(43,217,138,0.16),transparent_70%)]" />
            <p className="eyebrow mb-6">Get started</p>
            <h2 className="display mx-auto max-w-3xl text-[clamp(2.4rem,6vw,5.2rem)] text-white [text-wrap:balance]">
              Give your calendar an agent <span className="text-[var(--lp-mute)]">you can audit.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-md text-[17px] text-[var(--lp-mute)]">Sign in with Descope, connect Google Calendar, and ask for your first meeting.</p>
            <div className="mt-10 flex justify-center">
              <Link href="/sign-in" className="group inline-flex h-14 items-center gap-3 rounded-full bg-[#e8efea] pl-8 pr-2 text-[15px] font-medium text-[#07090a] transition-all hover:bg-white active:scale-[0.98]">
                Open the assistant
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#07090a] text-white transition-transform duration-300 group-hover:translate-x-0.5"><ArrowRight className="h-4 w-4" /></span>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-4 px-5 py-8 text-[13px] text-[var(--lp-mute)] sm:flex-row sm:items-center sm:px-8">
          <p>© {new Date().getFullYear()} Agentic Meet. Autonomous scheduling with a hard stop.</p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Footer">
            <a className="transition-colors hover:text-white" href="https://github.com/aggisanjay/agentic-google-meet-assistant" target="_blank" rel="noreferrer">Source on GitHub</a>
            <Link className="transition-colors hover:text-white" href="/sign-in">Sign in</Link>
            <span>Map data: Natural Earth (public domain)</span>
          </nav>
        </div>
        <div aria-hidden className="pointer-events-none select-none overflow-hidden whitespace-nowrap text-center font-semibold leading-[0.74] tracking-[-0.06em]" style={{ fontSize: "14.2vw", color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.08)", marginBottom: "-0.05em" }}>
          Agentic Meet
        </div>
      </footer>
    </>
  );
}
