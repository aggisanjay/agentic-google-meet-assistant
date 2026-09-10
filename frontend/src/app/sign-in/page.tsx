"use client";

import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";
import SignInComponent from "@/components/auth/sign-in";
import { Calendar, CheckCircle2, Sparkles, Video } from "lucide-react";

function SignInPage() {
  return (
    <main className="relative min-h-svh w-full flex flex-col items-center justify-center overflow-hidden px-4 py-12 bg-background app-shell-bg">
      {/* Decorative ambient background glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 size-[520px] rounded-full bg-emerald-500/15 blur-[130px]" />

      <div className="relative z-10 w-full max-w-[450px] flex flex-col items-center">
        {/* Brand header above card */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1 text-xs font-medium text-primary shadow-xs backdrop-blur-md">
            <Sparkles className="size-3.5 text-primary animate-pulse" />
            <span>AI-Powered Meeting Assistant</span>
          </div>

          <div className="relative mb-3 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary to-teal-400 text-primary-foreground shadow-xl shadow-primary/25 ring-4 ring-primary/10">
            <Calendar className="size-7 text-white" />
          </div>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Sign in to connect your calendar and let your agent manage scheduling, check conflicts, and generate Google Meet links.
          </p>
        </div>

        {/* Main Card */}
        <div className="w-full rounded-3xl border border-border/80 bg-card/85 p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] backdrop-blur-2xl dark:border-white/10 dark:bg-card/75 dark:shadow-[0_25px_80px_-20px_rgba(0,0,0,0.6)] transition-all">
          <RedirectIfAuthenticated>
            <SignInComponent />
          </RedirectIfAuthenticated>
        </div>

        {/* Feature Badges Below Card */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground/80">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="size-3.5 text-primary" />
            <span>Google Calendar Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Video className="size-3.5 text-primary" />
            <span>Instant Google Meet</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span>Gemini AI Agent</span>
          </div>
        </div>
      </div>
    </main>
  );
}

export default SignInPage;
