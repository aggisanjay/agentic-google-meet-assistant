"use client";

import React, { useState } from "react";
import {
  Bot,
  User,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  ChevronRight,
  Shield,
  Zap,
} from "lucide-react";

interface Scenario {
  id: string;
  title: string;
  prompt: string;
  toolName: string;
  toolArgs: Record<string, any>;
  toolResult: Record<string, any>;
  agentReply: string;
  meetingDetails?: {
    title: string;
    time: string;
    attendees: string[];
    meetLink: string;
  };
}

const SCENARIOS: Scenario[] = [
  {
    id: "schedule-interview",
    title: "Autonomous Meeting Scheduling",
    prompt:
      "Schedule a 45-minute technical interview with Jordan (jordan.tech@startup.io) tomorrow at 2:00 PM. Include a Google Meet link.",
    toolName: "createMeeting",
    toolArgs: {
      title: "Technical Interview: Jordan",
      startIso: "2026-09-19T14:00:00.000Z",
      endIso: "2026-09-19T14:45:00.000Z",
      attendeeEmails: ["jordan.tech@startup.io"],
      addGoogleMeet: true,
    },
    toolResult: {
      success: true,
      status: "confirmed",
      hangoutLink: "https://meet.google.com/hbm-tqvz-npo",
      eventId: "meet_evt_9941a8",
      conflictCheck: "0 conflicts detected (Google freebusy)",
    },
    agentReply:
      "I evaluated your schedule for tomorrow at 2:00 PM, verified that your calendar is completely open, and scheduled the technical interview with Jordan. Both of you will receive Google Calendar notifications with the Meet link.",
    meetingDetails: {
      title: "Technical Interview: Jordan",
      time: "Tomorrow • 2:00 PM – 2:45 PM (45 min)",
      attendees: ["jordan.tech@startup.io"],
      meetLink: "https://meet.google.com/hbm-tqvz-npo",
    },
  },
  {
    id: "check-conflict",
    title: "Conflict Detection & FreeBusy Query",
    prompt:
      "Am I free this Friday between 11:00 AM and 2:00 PM for an executive team sync?",
    toolName: "checkCalendarBusy",
    toolArgs: {
      startIso: "2026-09-21T11:00:00.000Z",
      endIso: "2026-09-21T14:00:00.000Z",
    },
    toolResult: {
      busyWindows: [
        {
          start: "11:30 AM",
          end: "12:15 PM",
          summary: "Q3 Roadmap Check-in (Busy)",
        },
      ],
      availableSlots: ["11:00 AM – 11:30 AM", "12:15 PM – 2:00 PM"],
    },
    agentReply:
      "You have a partial conflict this Friday: **'Q3 Roadmap Check-in'** runs from 11:30 AM to 12:15 PM. However, you are completely free from **12:15 PM to 2:00 PM** (1 hour 45 min window). Would you like me to book the sync starting at 12:30 PM?",
  },
  {
    id: "reschedule-event",
    title: "Intelligent Rescheduling",
    prompt:
      "Move my Standup meeting from 9:30 AM to 11:00 AM today and notify all attendees.",
    toolName: "rescheduleMeeting",
    toolArgs: {
      eventId: "evt_daily_standup_01",
      startIso: "2026-09-18T11:00:00.000Z",
      endIso: "2026-09-18T11:30:00.000Z",
    },
    toolResult: {
      success: true,
      updatedStart: "11:00 AM",
      updatedEnd: "11:30 AM",
      emailsDispatched: 5,
    },
    agentReply:
      "I shifted your **Daily Standup** to 11:00 AM – 11:30 AM today. The Google Calendar event has been updated and revision notifications have been sent to all 5 attendees.",
    meetingDetails: {
      title: "Engineering Daily Standup (Rescheduled)",
      time: "Today • 11:00 AM – 11:30 AM",
      attendees: ["5 team members notified"],
      meetLink: "https://meet.google.com/zop-kwnd-rvs",
    },
  },
];

export function AgentSimulator() {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [step, setStep] = useState<"idle" | "thinking" | "tool" | "completed">(
    "completed"
  );

  const scenario = SCENARIOS[selectedScenarioIndex];

  const runSimulation = (index: number) => {
    setSelectedScenarioIndex(index);
    setIsSimulating(true);
    setStep("thinking");

    setTimeout(() => {
      setStep("tool");
      setTimeout(() => {
        setStep("completed");
        setIsSimulating(false);
      }, 700);
    }, 600);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 mb-2">
            <Zap className="h-3.5 w-3.5 text-[#00c26d]" />
            Interactive AI Playground
          </div>
          <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
            Test the Gemini & Mastra Agent in Real Time
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Click any scenario below to observe autonomous reasoning, schema validation, and tool execution.
          </p>
        </div>

        {/* Action button in Launchify pill style */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => runSimulation(selectedScenarioIndex)}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 rounded-full bg-[#00c26d] hover:bg-[#00aa5f] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all"
          >
            {isSimulating ? (
              <>
                <Cpu className="h-4 w-4 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Re-Run Scenario
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scenario Selection Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
        {SCENARIOS.map((item, idx) => {
          const isSelected = selectedScenarioIndex === idx;
          return (
            <button
              key={item.id}
              onClick={() => runSimulation(idx)}
              className={`text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? "border-[#00c26d] bg-emerald-50/60 shadow-xs ring-1 ring-[#00c26d]/30"
                  : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isSelected ? "bg-[#00c26d] animate-ping" : "bg-slate-300"
                    }`}
                  />
                  {item.title}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                &ldquo;{item.prompt}&rdquo;
              </p>
            </button>
          );
        })}
      </div>

      {/* Simulation Screen */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden shadow-inner">
        {/* Terminal / Status Bar */}
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-white px-4 py-2.5 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-600">
            <Terminal className="h-3.5 w-3.5 text-[#00c26d]" />
            <span>gemini-3.6-flash @ mastra-agent</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-[#00c26d] font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#00c26d]" />
              SSE Active
            </span>
            <span className="text-slate-400 hidden sm:inline-block">
              Latency: ~410ms
            </span>
          </div>
        </div>

        {/* Interactive Chat Stream Output */}
        <div className="p-4 sm:p-6 space-y-5 bg-white">
          {/* User message */}
          <div className="flex items-start gap-3 justify-end">
            <div className="max-w-xl rounded-2xl rounded-tr-none bg-[#00c26d] px-4 py-3 text-sm text-white shadow-sm">
              <p className="text-xs text-white/80 font-mono mb-1">
                User Request
              </p>
              <p className="font-medium text-sm leading-relaxed">{scenario.prompt}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#00c26d] shrink-0">
              <User className="h-4 w-4" />
            </div>
          </div>

          {/* Thinking Step */}
          {step === "thinking" && (
            <div className="flex items-center gap-3 text-xs text-slate-500 animate-pulse pl-2">
              <Cpu className="h-4 w-4 text-[#00c26d] animate-spin" />
              <span>Analyzing intent & preparing tool parameters via Mastra...</span>
            </div>
          )}

          {/* Tool Execution Step */}
          {(step === "tool" || step === "completed") && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00c26d] shrink-0">
                <Cpu className="h-4 w-4" />
              </div>
              <div className="w-full max-w-2xl space-y-2">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs space-y-2">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[#00c26d]" />
                      Mastra Tool Call: {scenario.toolName}()
                    </span>
                    <span className="text-[#00c26d] flex items-center gap-1 font-semibold text-[11px]">
                      <CheckCircle2 className="h-3 w-3" /> Zod Validated
                    </span>
                  </div>

                  {/* Schema input & output preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="rounded-xl bg-white p-2.5 border border-emerald-100">
                      <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-wider">
                        Arguments
                      </div>
                      <pre className="overflow-x-auto text-slate-800 whitespace-pre-wrap">
                        {JSON.stringify(scenario.toolArgs, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-xl bg-white p-2.5 border border-emerald-100">
                      <div className="text-slate-400 text-[10px] mb-1 uppercase tracking-wider">
                        Google API Response
                      </div>
                      <pre className="overflow-x-auto text-[#00c26d] font-semibold whitespace-pre-wrap">
                        {JSON.stringify(scenario.toolResult, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Agent Final Output */}
          {step === "completed" && (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#00c26d] shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="max-w-2xl space-y-3">
                <div className="rounded-2xl rounded-tl-none border border-slate-200 bg-white p-4 text-sm shadow-sm space-y-3">
                  <p className="text-slate-800 leading-relaxed">
                    {scenario.agentReply}
                  </p>

                  {/* Render meeting card if applicable */}
                  {scenario.meetingDetails && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-[#00c26d]" />
                            {scenario.meetingDetails.title}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {scenario.meetingDetails.time}
                          </div>
                        </div>
                        <span className="rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 border border-emerald-200">
                          Scheduled
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00c26d] text-white font-semibold text-xs px-3 py-1 shadow-xs">
                          <Video className="h-3.5 w-3.5" />
                          {scenario.meetingDetails.meetLink}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Attendees: {scenario.meetingDetails.attendees.join(", ")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
