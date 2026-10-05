"use client";
// Provider demo: memuat save dari localStorage, menyediakan view + act yang
// bentuknya sama dengan versi server. Jika API server tersedia, tetap bisa dipakai.
import { createContext, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { loadDemo, saveDemo, demoAct, demoView, demoTick, freshDemo, type DemoState } from "@/lib/demo";

type Ctx = {
  view: ReturnType<typeof demoView> | null;
  act: (action: string, payload?: Record<string, unknown>) => Promise<{ ok: boolean; message?: string; error?: string }>;
  refresh: () => void;
  pending: boolean;
};

const DemoCtx = createContext<Ctx>({ view: null, act: async () => ({ ok: false, error: "belum siap" }), refresh: () => {}, pending: false });

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [save, setSave] = useState<DemoState | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => { setSave(loadDemo()); }, []);
  useEffect(() => {
    if (!save) return;
    const t = setInterval(() => setSave((s) => (s ? demoTick({ ...s, state: { ...s.state, resources: { ...s.state.resources } } }) : s)), 30_000);
    return () => clearInterval(t);
  }, [save === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<Ctx>(() => ({
    view: save ? demoView(save) : null,
    async act(action, payload = {}) {
      if (!save) return { ok: false, error: "memuat…" };
      const { state, result } = demoAct(save, action, payload);
      saveDemo(state);
      start(() => setSave(state));
      return result;
    },
    refresh() {
      setSave((s) => (s ? demoTick({ ...s, state: { ...s.state, resources: { ...s.state.resources } } }) : s));
    },
    pending,
  }), [save, pending]);

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function useDemo() {
  return useContext(DemoCtx);
}
