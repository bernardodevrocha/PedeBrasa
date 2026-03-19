"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

interface AuthState {
  token: string | null;
  email: string | null;
}

interface Churrasqueiro {
  id: number;
  name: string;
  city: string;
  description: string | null;
  pricePerHour: string;
  rating?: string | number;
}

export default function MenuPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [items, setItems] = useState<Churrasqueiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem("pedebrasa_auth");
    if (!stored) {
      router.replace("/");
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AuthState;
      if (!parsed.token) {
        router.replace("/");
        return;
      }
      setAuth(parsed);
    } catch {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    setLoading(true);
    api
      .listChurrasqueiros()
      .then((data) => setItems(data as Churrasqueiro[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!auth) {
    return null;
  }

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
          Olá, {auth.email}
        </h1>
        <p style={{ marginTop: 0, marginBottom: "1rem", color: "#9ca3af" }}>
          Aqui estão os churrasqueiros disponíveis com suas cidades, descrições,
          preços e avaliações.
        </p>

        {items.length === 0 && !loading && (
          <p style={{ color: "#9ca3af" }}>
            Nenhum churrasqueiro cadastrado ainda.
          </p>
        )}

        {items.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((c) => (
              <li
                key={c.id}
                style={{
                  padding: "0.75rem 0",
                  borderBottom: "1px solid #1f2937",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <strong>{c.name}</strong>
                      <div
                        style={{ fontSize: "0.875rem", color: "#9ca3af" }}
                      >
                        {c.city} • R$ {c.pricePerHour}/h
                      </div>
                    </div>
                    {typeof c.rating !== "undefined" && (
                      <span
                        style={{
                          fontSize: "0.85rem",
                          backgroundColor: "#0f172a",
                          borderRadius: "999px",
                          padding: "0.2rem 0.6rem",
                          border: "1px solid #f97316",
                          color: "#f97316",
                        }}
                      >
                        Nota: {Number(c.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <p
                      style={{
                        fontSize: "0.9rem",
                        color: "#9ca3af",
                        margin: 0,
                      }}
                    >
                      {c.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

