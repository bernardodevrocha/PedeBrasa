"use client";

export interface StoredAuthState {
  token: string | null;
  email: string | null;
  role: "user" | "admin" | "churrasqueiro" | null;
}

export function readStoredAuth(): StoredAuthState {
  if (typeof window === "undefined") {
    return { token: null, email: null, role: null };
  }

  const stored = window.localStorage.getItem("pedebrasa_auth");
  if (!stored) {
    return { token: null, email: null, role: null };
  }

  try {
    return JSON.parse(stored) as StoredAuthState;
  } catch {
    return { token: null, email: null, role: null };
  }
}
