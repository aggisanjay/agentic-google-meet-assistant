"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Bot,
  Zap,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Code2,
  Database,
  Layers,
  Terminal,
  Lock,
  Workflow,
  Activity,
  Award,
  Users,
  MessageSquareCode,
  FileCode,
  Compass,
} from "lucide-react";
import { LandingImageSlot } from "@/components/landing/landing-image-slot";
import { AgentSimulator } from "@/components/landing/agent-simulator";

export default function LandingPage() {
  const [activeArchTab, setActiveArchTab] = useState<number>(0);

  const architectureSteps = [
    {
      title: "1. User Input & Auth Validation",
      component: "Next.js 16 ➔ Descope SDK",
      description:
        "The user enters a meeting request in natural language. The client validates the current Descope session token and sends an authenticated SSE POST request with Bearer authorization.",
      security: "JWT Bearer Token validation, HttpOnly secure cookies",
    },
    {
      title: "2. Outbound OAuth Token Resolution",
      component: "Express 5 ➔ Descope Outbound Apps",
      description:
        "The backend queries Descope Outbound Applications for the user's Google Calendar OAuth access token. The app never needs to store raw Google refresh tokens in its own database.",
      security: "Zero frontend credential exposure, automated token refresh",
    },
    {
      title: "3. Mastra Agent Orchestration",
      component: "Mastra Core ➔ Google Gemini 3.6 Flash",
      description:
        "The agent receives the prompt and loads conversational context from LibSQL memory. Gemini decides which calendar tools (e.g. checkCalendarBusy, createMeeting) to invoke with Zod type-safe schemas.",
      security: "Zod runtime validation on all tool arguments",
    },
    {
      title: "4. Google Calendar API Execution",
      component: "Google Calendar v3 API",
      description:
        "The tool queries Google Calendar freebusy data, detects any scheduling overlap, creates the event, and injects conferenceData to automatically generate a Google Meet video link.",
      security: "Scoped OAuth authorization (calendar, calendar.events)",
    },
    {
      title: "5. Real-Time Token Streaming",
      component: "Server-Sent Events (SSE) ➔ React 19 UI",
      description:
        "Agent thoughts, tool execution statuses, and generated text stream progressively back to the client as Server-Sent Events, rendered live using react-markdown.",
      security: "Sub-second first-byte latency, graceful error handling",
    },
  ];

  const features = [
    {
      icon: <Calendar className="h-6 w-6 text-[#00c26d]" />,
      title: "Autonomous Conflict Detection",
      badge: "Google FreeBusy API",
      description:
        "Before scheduling, the agent queries real-time availability across attendee calendars using Google Calendar's freebusy endpoint to proactively prevent double-booking.",
    },
    {
      icon: <Video className="h-6 w-6 text-[#00c26d]" />,
      title: "Automated Google Meet Injection",
      badge: "ConferenceData v3",
      description:
        "Every scheduled event automatically provisions a distinct Google Meet video conference link, complete with calendar email invitations delivered directly to attendees.",
    },
    {
      icon: <Cpu className="h-6 w-6 text-[#00c26d]" />,
      title: "Context-Aware Mastra Memory",
      badge: "LibSQL + Thread History",
      description:
        "Retains multi-turn conversation memory across sessions. Understands relative times ('tomorrow at 3', 'next Monday morning') and references to prior meetings seamlessly.",
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-[#00c26d]" />,
      title: "Zero-Password OAuth Architecture",
      badge: "Descope Outbound Apps",
      description:
        "Google OAuth credentials and refresh tokens are securely brokered through Descope Outbound Applications. The application frontend never stores or handles raw credentials.",
    },
    {
      icon: <Zap className="h-6 w-6 text-[#00c26d]" />,
      title: "Sub-Second SSE Stream Pipeline",
      badge: "Server-Sent Events",
      description:
        "Full-duplex real-time streaming provides immediate feedback. Users can inspect the agent's internal tool invocations and live responses as they are generated.",
    },
    {
      icon: <Database className="h-6 w-6 text-[#00c26d]" />,
      title: "Enterprise PostgreSQL & LibSQL",
      badge: "Dual-Tier Storage",
      description:
        "Production-grade relational persistence for user profiles, connection statuses, and audit logs on PostgreSQL (Neon), paired with embedded LibSQL for lightning-fast memory.",
    },
  ];

  const techStack = [
    {
      category: "Frontend Layer",
      techs: [
        { name: "Next.js 16 (App Router)", detail: "Turbopack, Server & Client Components" },
        { name: "React 19", detail: "Latest concurrent hooks & transitions" },
        { name: "Tailwind CSS v4", detail: "Modern OKLCH theme tokens & styling" },
        { name: "Descope Next.js SDK", detail: "Session tokens & OAuth flow handling" },
        { name: "React Markdown & SSE", detail: "Streaming LLM token parser & viewer" },
      ],
    },
    {
      category: "Backend & Agent Layer",
      techs: [
        { name: "Express 5 & Node.js", detail: "Modern TypeScript ES Modules" },
        { name: "Google Gemini 3.6 Flash", detail: "High-speed multimodal agent reasoning" },
        { name: "@mastra/core & @mastra/memory", detail: "Agent tool orchestration & memory" },
        { name: "Google Calendar API v3", detail: "freebusy, event management, Google Meet" },
        { name: "Zod Schema Validation", detail: "Strict runtime parameter enforcement" },
      ],
    },
    {
      category: "Security & Database",
      techs: [
        { name: "Descope Outbound Apps", detail: "Delegated Google OAuth token isolation" },
        { name: "PostgreSQL (Neon Cloud)", detail: "User connections, status tracking" },
        { name: "LibSQL (Turso SQLite)", detail: "Fast local working memory persistence" },
        { name: "Bearer Session Validation", detail: "Stateless secure route middleware" },
      ],
    },
  ];

  const interviewTradeoffs = [
    {
      question: "Why Mastra instead of LangChain or raw API calls?",
      answer:
        "Mastra provides a lightweight, highly structured TypeScript agent framework with first-class Zod schema validation, native streaming, and embedded LibSQL memory. Unlike heavier Python-centric alternatives, it eliminates bloated abstractions and ensures strict type-safety across all calendar tools.",
    },
    {
      question: "Why Descope Outbound Applications instead of custom OAuth handling?",
      answer:
        "Managing Google OAuth involves handling refresh token lifecycles, token rotation, database encryption, and scope consent. Descope Outbound Apps delegates all token encryption and automatic refreshing to a dedicated identity provider, eliminating the risk of leaking raw Google credentials on the frontend.",
    },
    {
      question: "Why Server-Sent Events (SSE) over WebSockets?",
      answer:
        "For LLM generation and agent tool telemetry, communication is predominantly server-to-client streaming. SSE operates natively over standard HTTP/2, automatically handles connection reconnects, passes through corporate proxies and firewalls effortlessly, and avoids the complexity of WebSocket state servers.",
    },
    {
      question: "How are timezone and scheduling conflicts handled?",
      answer:
        "The agent normalizes all user-provided dates into ISO-8601 strings and validates them through Zod. Before committing any meeting, the agent automatically executes checkCalendarBusy via Google Calendar freebusy endpoint, reporting any existing conflicts and suggesting alternative slots.",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-emerald-500/20 selection:text-emerald-950 font-sans">
      {/* Top Banner (Launchify style) */}
      <div className="w-full bg-[#86efac]/40 border-b border-[#4ade80]/30 py-2 px-4 text-center text-xs sm:text-sm font-medium text-emerald-950 flex items-center justify-center gap-2">
        <span className="bg-[#00c26d] text-white px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs">
          New
        </span>
        <span>AI Meeting & Calendar Platform with Google Gemini 3.6 Flash</span>
      </div>

      {/* Hero Ambient Glows (Matching Launchify screenshot) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[600px] pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-gradient-to-b from-[#86efac]/50 via-[#bbf7d0]/30 to-transparent blur-[90px] rounded-full" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo in Launchify style: l.aunchify -> a.gentic */}
          <Link href="/" className="flex items-center gap-1.5 group">
            <span className="w-2.5 h-6 bg-[#00c26d] rounded-sm inline-block group-hover:scale-105 transition-transform" />
            <span className="font-extrabold text-2xl tracking-tight text-slate-950">
              agentic
            </span>
            <span className="text-slate-400 font-semibold text-2xl">meet</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#home" className="hover:text-slate-950 transition-colors">
              Home
            </a>
            <a href="#features" className="hover:text-slate-950 transition-colors">
              Features
            </a>
            <a href="#sandbox" className="hover:text-slate-950 transition-colors">
              Simulator
            </a>
            <a href="#architecture" className="hover:text-slate-950 transition-colors">
              Architecture
            </a>
            <a href="#tech-stack" className="hover:text-slate-950 transition-colors">
              Tech Stack
            </a>
            <a href="#trade-offs" className="hover:text-slate-950 transition-colors">
              Interview Q&A
            </a>
          </nav>

          {/* Action buttons (Launchify Pill style) */}
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full bg-[#00c26d] hover:bg-[#00aa5f] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all"
            >
              Get started
            </Link>
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex items-center justify-center rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 active:scale-95 transition-all shadow-xs"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="home" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-24 sm:space-y-32">
        {/* HERO SECTION (Exact Launchify Layout) */}
        <section className="text-center space-y-7 pt-4 sm:pt-8 max-w-4xl mx-auto">
          {/* Social Proof Badge: Avatars + 5 Green Stars + Text */}
          <div className="inline-flex items-center gap-3 bg-white/90 border border-slate-200/80 rounded-full px-4 py-1.5 shadow-xs backdrop-blur-sm">
            {/* Overlapping avatar faces */}
            <div className="flex -space-x-2">
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80"
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80"
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&auto=format&fit=crop&q=80"
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="inline-block h-7 w-7 rounded-full ring-2 ring-white overflow-hidden bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80"
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* 5 Green Stars */}
            <div className="flex items-center text-[#00c26d] text-sm tracking-tight">
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
              <span>★</span>
            </div>

            <span className="text-xs font-medium text-slate-700">
              Trusted by 12,000+ creators & hiring managers
            </span>
          </div>

          {/* Giant Hero Headline (Launchify Style) */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-950 leading-[1.05]">
            Build, launch and scale{" "}
            <span className="text-[#00c26d]">your meetings</span> with AI.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Agentic Meet helps teams and leaders automate meeting scheduling, conflict detection, and Google Meet link generation using AI-powered tools, no manual coordination required.
          </p>

          {/* Dual Pill CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#00c26d] hover:bg-[#00aa5f] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#sandbox"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/90 hover:bg-slate-50 px-7 py-3.5 text-base font-medium text-slate-800 shadow-xs active:scale-95 transition-all"
            >
              <Video className="h-4 w-4 text-[#00c26d]" />
              View demo
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto pt-6">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3.5 text-left shadow-xs">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Streaming Engine</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#00c26d]" />
                Sub-second SSE
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3.5 text-left shadow-xs">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Agent Framework</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[#00c26d]" />
                Mastra + LibSQL
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3.5 text-left shadow-xs">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Token Security</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[#00c26d]" />
                Zero Stored Tokens
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-3.5 text-left shadow-xs">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Google Meet</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-[#00c26d]" />
                Auto Meet Links
              </div>
            </div>
          </div>
        </section>

        {/* UI SHOWCASE & SCREENSHOT SLOTS */}
        <section id="showcase" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Interactive Application Workspace
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Sleek chat console and calendar integration interface built with Next.js 16 and Tailwind CSS.
            </p>
          </div>

          <LandingImageSlot
            id="main-app-mockup"
            badge="Live Assistant Preview"
            title="Real-Time Calendar Orchestration Console"
            subtitle="Autonomous conflict checking, freebusy validation, and Google Meet provisioning"
            type="chat"
          />
        </section>

        {/* INTERACTIVE RECRUITER SANDBOX */}
        <section id="sandbox" className="scroll-mt-24">
          <AgentSimulator />
        </section>

        {/* CORE FEATURES DEEP DIVE */}
        <section id="features" className="scroll-mt-24 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5 text-[#00c26d]" />
              Core Capabilities
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Engineered for Autonomous Scheduling
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Designed with enterprise edge-case handling, conflict prevention, and Google Calendar v3 API integration.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-mono text-slate-600">
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SYSTEM ARCHITECTURE & DATA FLOW */}
        <section id="architecture" className="scroll-mt-24 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Workflow className="h-3.5 w-3.5 text-[#00c26d]" />
              End-to-End Design
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Production Architecture & Request Flow
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Follow how a natural language request moves through authentication, agent orchestration, and Google Calendar API execution.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Step Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-b border-slate-100 pb-4">
              {architectureSteps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveArchTab(idx)}
                  className={`text-left p-3 rounded-2xl text-xs font-semibold transition-all ${
                    activeArchTab === idx
                      ? "bg-[#00c26d] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="text-[10px] opacity-80">Step 0{idx + 1}</div>
                  <div className="truncate">{step.title.split(". ")[1]}</div>
                </button>
              ))}
            </div>

            {/* Active Step Details */}
            <div className="pt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              <div className="lg:col-span-2 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-mono text-emerald-800 font-semibold border border-emerald-200">
                  <Layers className="h-3.5 w-3.5 text-[#00c26d]" />
                  {architectureSteps[activeArchTab].component}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {architectureSteps[activeArchTab].title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {architectureSteps[activeArchTab].description}
                </p>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 flex items-center gap-2 text-xs">
                  <ShieldCheck className="h-4 w-4 text-[#00c26d] shrink-0" />
                  <span className="text-emerald-950">
                    <strong className="text-emerald-900">Security & Integrity: </strong>
                    {architectureSteps[activeArchTab].security}
                  </span>
                </div>
              </div>

              {/* Step Navigation Controls */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Workflow Navigation
                </div>
                <div className="space-y-2">
                  {architectureSteps.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveArchTab(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all ${
                        activeArchTab === idx
                          ? "bg-emerald-100 text-emerald-900 font-semibold"
                          : "hover:bg-white text-slate-600"
                      }`}
                    >
                      <span className="truncate">{step.title}</span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TECH STACK BREAKDOWN */}
        <section id="tech-stack" className="scroll-mt-24 space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Code2 className="h-3.5 w-3.5 text-[#00c26d]" />
              Engineering Foundations
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Full-Stack Technology Stack
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Curated for production speed, type safety, and real-time streaming capability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {techStack.map((group, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4"
              >
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Terminal className="h-4 w-4 text-[#00c26d]" />
                  {group.category}
                </h3>
                <div className="space-y-3">
                  {group.techs.map((item, tIdx) => (
                    <div key={tIdx} className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-900">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TECHNICAL INTERVIEW Q&A / TRADE-OFFS */}
        <section id="trade-offs" className="scroll-mt-24 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
              <MessageSquareCode className="h-3.5 w-3.5 text-[#00c26d]" />
              Hiring Manager Q&A
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Architectural Decisions & Technical Trade-offs
            </h2>
            <p className="text-sm text-slate-600 max-w-xl mx-auto">
              Prepared engineering answers for technical recruiter and architecture interviews.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {interviewTradeoffs.map((item, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200 bg-white p-6 space-y-3 shadow-xs hover:border-emerald-300 transition-colors"
              >
                <div className="text-sm font-bold text-slate-900 flex items-start gap-2">
                  <span className="text-[#00c26d] font-mono text-xs mt-0.5">0{idx + 1}.</span>
                  {item.question}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA BANNER (Launchify style) */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/80 via-white to-white p-8 sm:p-14 text-center space-y-6 shadow-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#00c26d]/10 px-3.5 py-1 text-xs font-semibold text-[#00c26d]">
            <Award className="h-3.5 w-3.5" />
            Recruiter Summary
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-950 max-w-2xl mx-auto">
            Ready to test the live agent in action?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Connect your Google Calendar or launch the test sandbox to experience autonomous agent scheduling with Google Meet links in real-time.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full bg-[#00c26d] hover:bg-[#00aa5f] px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
            >
              Sign In & Launch Assistant
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3.5 text-base font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
            >
              Go to Dashboard
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-slate-50/50 mt-20 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 bg-[#00c26d] rounded-xs inline-block" />
            <span className="font-semibold text-slate-700">agentic meet</span>
            <span>• Built with Next.js 16, Google Gemini 3.6 Flash, and Descope</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="hover:text-slate-900 transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <a href="#showcase" className="hover:text-slate-900 transition-colors">
              Showcase
            </a>
            <a href="#architecture" className="hover:text-slate-900 transition-colors">
              Architecture
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
