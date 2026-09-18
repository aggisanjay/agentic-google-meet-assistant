"use client";

import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";
import SignInComponent from "@/components/auth/sign-in";
import { CheckCircle2, Sparkles, Video } from "lucide-react";
import Link from "next/link";

function SignInPage() {
  return (
    <main className="relative min-h-svh w-full flex flex-col items-center justify-center overflow-hidden px-4 py-12 bg-white app-shell-bg font-sans">
      {/* Decorative ambient background glows (Launchify lime-emerald glow) */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] overflow-hidden -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#86efac]/40 via-[#bbf7d0]/25 to-transparent blur-[80px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-[450px] flex flex-col items-center">
        {/* Brand header above card (Launchify style logo) */}
        <div className="mb-7 flex flex-col items-center text-center">
          <Link href="/" className="mb-5 flex items-center gap-1.5 group">
            <span className="w-2.5 h-6 bg-[#00c26d] rounded-sm inline-block group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-2xl tracking-tight text-slate-950">
              agentic
            </span>
            <span className="text-slate-400 font-semibold text-2xl">meet</span>
          </Link>

          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#00c26d]" />
            <span>Autonomous Meeting Assistant</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Welcome back
          </h1>
          <p className="mt-2 max-w-sm text-sm text-slate-600 leading-relaxed">
            Sign in to connect your Google Calendar and let Gemini manage scheduling, check conflicts, and generate Meet links.
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl shadow-slate-900/5 transition-all">
          <RedirectIfAuthenticated>
            <SignInComponent />
          </RedirectIfAuthenticated>
        </div>

        {/* Feature Badges Below Card */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#00c26d]" />
            <span>Google Calendar Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-[#00c26d]" />
            <span>Instant Google Meet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#00c26d]" />
            <span>Gemini 3.6 Flash</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SignInPage;
