"use client";

import { RedirectIfAuthenticated } from "@/components/auth/RedirectIfAuthenticated";
import SignInComponent from "@/components/auth/sign-in";
import { CheckCircle2, ShieldCheck, Sparkles, Video } from "lucide-react";
import Link from "next/link";

function SignInPage() {
  return (
        <main className="lp relative min-h-svh w-full flex flex-col items-center justify-center overflow-hidden px-4 py-12 app-shell-bg font-sans">
          {/* Ambient background glows */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[550px] overflow-hidden -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[380px] bg-[radial-gradient(ellipse_at_center,rgba(43,217,138,0.18),transparent_70%)] blur-[90px] rounded-full" />
          </div>

            <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
              {/* Brand header above card */}
              <div className="mb-7 flex flex-col items-center text-center">
                    <Link href="/" className="group mb-5 flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-[rgb(var(--lp-green))] text-[#04130b] shadow-sm">
                        <Video className="h-4 w-4" />
                      </span>
                      <span className="text-[18px] font-semibold tracking-tight text-white">
                        agentic <span className="font-normal text-[var(--lp-mute)]">meet</span>
                      </span>
                    </Link>

                      <div className="mb-4 inline-flex items-center gap-2 rounded-full border hairline bg-white/[0.04] px-3.5 py-1 text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--lp-mute)]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--lp-green))]" />
                        <span>Autonomous Calendar Agent</span>
                      </div>

                        <h1 className="display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                          Welcome back
                        </h1>
                          <p className="mt-2.5 max-w-sm text-sm text-[var(--lp-mute)] leading-relaxed">
                            Sign in to connect your Google Calendar, detect scheduling conflicts, and generate Meet links.
                          </p>
                        </div>

                        {/* Main Card */}
                          <div className="glass w-full rounded-3xl border hairline p-6 sm:p-8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] transition-all">
                            <RedirectIfAuthenticated>
                              <SignInComponent />
                            </RedirectIfAuthenticated>
                          </div>

                          {/* Feature Badges Below Card */}
                            <div className="mono mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12px] text-[var(--lp-mute)]">
                              <div className="flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[rgb(var(--lp-green))]" />
                                <span>Calendar API Sync</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Video className="h-3.5 w-3.5 text-[rgb(var(--lp-green))]" />
                                <span>Google Meet Auto-Attach</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-[rgb(var(--lp-green))]" />
                                <span>Deterministic Audits</span>
                              </div>
                            </div>
                          </div>
                        </main>
                        );
}

                        export default SignInPage;
