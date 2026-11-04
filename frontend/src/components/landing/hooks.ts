"use client";

import { useEffect, useRef, useState } from "react";

/** True once the element has been on screen (or while it is, when `once` is false). */
export function useInView<T extends HTMLElement>(opts: { once?: boolean; margin?: string; threshold?: number } = {}) {
  const { once = false, margin = "0px", threshold = 0.01 } = opts;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setInView(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { setInView(e.isIntersecting); if (e.isIntersecting && once) io.disconnect(); },
      { rootMargin: margin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, margin, threshold]);
  return [ref, inView] as const;
}

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    setR(q.matches);
    const f = () => setR(q.matches);
    q.addEventListener("change", f);
    return () => q.removeEventListener("change", f);
  }, []);
  return r;
}

/** Decide once if this device should run live WebGL or show the poster. */
export function useWebGLCapability() {
  const reduced = useReducedMotion();
  const [live, setLive] = useState(false);
  useEffect(() => {
    let gl = false;
    try {
      const c = document.createElement("canvas");
      gl = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch { gl = false; }
    const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
    const saveData = !!nav.connection?.saveData;
    const lowMem = (nav.deviceMemory ?? 4) <= 1;
    setLive(gl && !reduced && !saveData && !lowMem);
  }, [reduced]);
  return { live, reduced };
}

export function useFontsReady() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        await Promise.all([
          document.fonts.load('600 32px "Geist Variable"'),
          document.fonts.load('500 24px "Geist Mono Variable"'),
        ]);
      } catch { /* fall back to system fonts */ }
      if (alive) setOk(true);
    };
    load();
    return () => { alive = false; };
  }, []);
  return ok;
}
