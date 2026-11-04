"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#demo", label: "Live demo" },
  { href: "#safety", label: "Safety" },
  { href: "#time", label: "Timezones" },
  { href: "#faq", label: "FAQ" },
];

export function LpNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="fixed inset-x-0 top-3 z-50 flex justify-center px-3 sm:top-4">
      <nav
        aria-label="Primary"
        className={`flex h-14 w-full max-w-[1100px] items-center justify-between rounded-full pl-5 pr-2 transition-all duration-500 ${
          scrolled ? "bg-[rgba(7,9,10,0.78)] shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl" : "glass"
        } border hairline`}
      >
        <Link href="/" className="flex items-center gap-2.5" aria-label="Agentic Meet home">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[rgb(var(--lp-green))] text-[#04130b]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M8 3v4M16 3v4M3.5 10h17" /><path d="m9 15 2 2 4-4" />
            </svg>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Agentic Meet</span>
        </Link>
        <ul className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3.5 py-2 text-[13.5px] text-[var(--lp-mute)] transition-colors hover:bg-white/[0.06] hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link href="/sign-in" className="hidden rounded-full px-4 py-2 text-[13.5px] text-[var(--lp-mute)] transition-colors hover:text-white sm:block">
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#e8efea] px-4 text-[13.5px] font-medium text-[#07090a] transition-all hover:bg-white active:scale-[0.97]"
          >
            Open assistant <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
