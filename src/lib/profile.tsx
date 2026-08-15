"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { Profile, Role } from "@/lib/types";

const KEY = "neura:profile";
const listeners = new Set<() => void>();

let cached: Profile | null = null;
let cachedRaw: string | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function readSnapshot(): Profile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    cached = raw ? (JSON.parse(raw) as Profile) : null;
    return cached;
  } catch {
    cachedRaw = null;
    cached = null;
    return null;
  }
}

function write(value: Profile | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  cached = value;
  cachedRaw = value ? JSON.stringify(value) : null;
  listeners.forEach((l) => l());
}

const DEFAULT_PROFILE: Profile = {
  role: "parent",
  parent: { name: "", relation: "" },
  child: { name: "", age: 9, interest: "", learningStyle: "visual", frustration: "" },
  onboarded: false,
};

type ProfileCtx = {
  profile: Profile | null;
  saveProfile: (p: Profile) => void;
  setRole: (role: Role) => void;
  reset: () => void;
};

const Ctx = createContext<ProfileCtx>({
  profile: null,
  saveProfile: () => {},
  setRole: () => {},
  reset: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const profile = useSyncExternalStore(subscribe, readSnapshot, readSnapshot);

  const saveProfile = useCallback((p: Profile) => write(p), []);

  const setRole = useCallback((role: Role) => {
    const current = readSnapshot();
    write(current ? { ...current, role } : { ...DEFAULT_PROFILE, role });
  }, []);

  const reset = useCallback(() => write(null), []);

  return <Ctx.Provider value={{ profile, saveProfile, setRole, reset }}>{children}</Ctx.Provider>;
}

export function useProfile() {
  return useContext(Ctx);
}
