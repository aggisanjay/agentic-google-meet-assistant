"use client";

import { LpNav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { ProofStrip } from "@/components/landing/proof-strip";
import { Pipeline } from "@/components/landing/pipeline";
import { Demo } from "@/components/landing/demo";
import { Safety } from "@/components/landing/safety";
import { TimeGlobe } from "@/components/landing/time-globe";
import { Faq } from "@/components/landing/faq";
import { CtaFooter } from "@/components/landing/cta-footer";

export default function LandingPage() {
  return (
    <div className="lp">
      <LpNav />
      <main>
        <Hero />
        <ProofStrip />
        <Pipeline />
        <Demo />
        <Safety />
        <TimeGlobe />
        <Faq />
      </main>
      <CtaFooter />
    </div>
  );
}
