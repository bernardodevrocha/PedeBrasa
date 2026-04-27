"use client";

export interface StoredAuthState {
  token: string | null;
  email: string | null;
  name?: string | null;
  role: "user" | "admin" | "churrasqueiro" | null;
}

export const EMPTY_STORED_AUTH: StoredAuthState = {
  token: null,
  email: null,
  name: null,
  role: null,
};

const AUTH_STORAGE_KEY = "pedebrasa_auth";
const AUTH_EVENT_NAME = "pedebrasa-auth-changed";

export function readStoredAuth(): StoredAuthState {
  if (typeof window === "undefined") {
    return EMPTY_STORED_AUTH;
  }

  const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) {
    return EMPTY_STORED_AUTH;
  }

  try {
    return JSON.parse(stored) as StoredAuthState;
  } catch {
    return EMPTY_STORED_AUTH;
  }
}

function emitAuthChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT_NAME));
}

export function storeAuth(auth: StoredAuthState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  emitAuthChanged();
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  emitAuthChanged();
}

export function onStoredAuthChange(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_EVENT_NAME, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(AUTH_EVENT_NAME, listener);
    window.removeEventListener("storage", listener);
  };
}
