"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Sparkles,
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  Cpu,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface LandingImageSlotProps {
  id?: string;
  imageSrc?: string;
  imageAlt?: string;
  badge?: string;
  title?: string;
  subtitle?: string;
  aspectRatio?: string;
  type?: "chat" | "calendar" | "architecture";
}

export function LandingImageSlot({
  id = "mockup-preview",
  imageSrc,
  imageAlt = "Agentic Calendar Assistant UI Showcase",
  badge = "Interactive UI Preview",
  title = "Intelligent Meeting Orchestrator",
  subtitle = "Real-time SSE agent reasoning with Google Calendar & Google Meet automation",
  type = "chat",
}: LandingImageSlotProps) {
  const [hasImageError, setHasImageError] = useState(false);

  return (
    <div
      id={id}
      className="relative rounded-3xl border border-slate-200/90 bg-white shadow-xl overflow-hidden transition-all duration-300 hover:border-[#00c26d]/50 hover:shadow-2xl hover:shadow-emerald-500/10"
    >
      {/* Mockup Browser/App Chrome Header */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <span className="ml-3 text-xs font-mono text-slate-500 hidden sm:inline-block">
            agentic-calendar-assistant.app
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3 w-3 text-[#00c26d]" />
            {badge}
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative min-h-[420px] w-full p-4 sm:p-6 lg:p-8 bg-white">
        {imageSrc && !hasImageError ? (
          <div className="relative h-[480px] w-full overflow-hidden rounded-2xl border border-slate-100">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover object-top"
              onError={() => setHasImageError(true)}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#00c26d]" />
                  {title}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-600 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00c26d] animate-pulse" />
                  Gemini 3.6 Flash Active
                </span>
              </div>
            </div>

            {/* Render simulated UI */}
            {type === "chat" && (
              <div className="space-y-4">
                {/* User Message */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="max-w-lg rounded-2xl rounded-tr-none bg-[#00c26d] px-4 py-3 text-sm text-white shadow-sm">
                    <p className="font-medium">
                      Schedule a 45-minute architectural review with Sarah and Alex for tomorrow at 3:00 PM. Add Google Meet link.
                    </p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#00c26d] shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                </div>

                {/* Agent Reasoning Stream */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#00c26d] shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="max-w-2xl flex-1 space-y-3">
                    {/* Tool Execution Box */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs space-y-2">
                      <div className="flex items-center justify-between font-mono font-medium text-emerald-900">
                        <span className="flex items-center gap-1.5">
                          <Cpu className="h-3.5 w-3.5 text-[#00c26d]" />
                          Executing Tool: checkCalendarBusy
                        </span>
                        <span className="text-[#00c26d] flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3 w-3" /> Conflict Check Passed
                        </span>
                      </div>
                      <div className="text-slate-600 font-mono text-[11px] bg-white p-2.5 rounded-xl border border-emerald-100">
                        {`{ "startIso": "2026-09-19T15:00:00Z", "freebusy": "clear", "attendees": 2 }`}
                      </div>
                    </div>

                    {/* Agent Response & Calendar Card */}
                    <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 text-sm shadow-sm space-y-3">
                      <p className="text-slate-800 leading-relaxed">
                        I verified your calendar and confirmed that Sarah and Alex have open availability at 3:00 PM tomorrow. I have reserved the slot and generated your Google Meet session:
                      </p>

                      {/* Event confirmation card */}
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-[#00c26d]" />
                              Architectural Review: Agentic Pipeline
                            </span>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="h-3 w-3" /> Tomorrow • 3:00 PM – 3:45 PM
                            </div>
                          </div>
                          <span className="rounded-full bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 text-[11px] border border-emerald-200">
                            Confirmed
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00c26d] text-white font-semibold text-xs px-3 py-1 shadow-xs">
                            <Video className="h-3.5 w-3.5" />
                            meet.google.com/xyz-qwer-abc
                            <ExternalLink className="h-3 w-3" />
                          </span>
                          <span className="text-xs text-slate-500">
                            Invitees: sarah@company.com, alex@company.com
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Helper callout for recruiter / user images */}
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00c26d]" />
                Live Assistant Connected • Real-time SSE streaming enabled • Zero stored Google credentials
              </span>
              <span className="text-[11px] font-mono text-slate-400 hidden md:inline-block">
                Ready for image slot replacement
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
