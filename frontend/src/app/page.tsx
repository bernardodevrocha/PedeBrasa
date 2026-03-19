"use client";

import { useEffect, useState } from "react";
import { api, type ApiError } from "../lib/api";
import { useRouter } from "next/navigation";

interface AuthState {
  token: string | null;
  email: string | null;
}

function useAuth(): [AuthState, (token: string, email: string) => void] {
  const [state, setState] = useState<AuthState>({ token: null, email: null });

  useEffect(() => {
    const stored = window.localStorage.getItem("pedebrasa_auth");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as AuthState;
        setState(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  const setAuth = (token: string, email: string) => {
    const next = { token, email };
    window.localStorage.setItem("pedebrasa_auth", JSON.stringify(next));
    setState(next);
  };

  return [state, setAuth];
}

export default function HomePage() {
  const router = useRouter();
  const [auth, setAuth] = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [churrasqueiros, setChurrasqueiros] = useState<any[] | null>(null);
  const [loadingChurrasqueiros, setLoadingChurrasqueiros] = useState(false);

  useEffect(() => {
    setLoadingChurrasqueiros(true);
    api
      .listChurrasqueiros()
      .then(setChurrasqueiros)
      .catch(() => {
        setChurrasqueiros([]);
      })
      .finally(() => setLoadingChurrasqueiros(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "register") {
        const res = await api.register({
          name: form.name,
          email: form.email,
          password: form.password,
        });
        setAuth(res.token, form.email);
      } else {
        const res = await api.login({
          email: form.email,
          password: form.password,
        });
        setAuth(res.token, form.email);
      }
      router.push("/menu");
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      if (typeof apiErr.status === "number" && apiErr.message) {
        setError(apiErr.message);
      } else {
        console.error(err);
        setError("Não foi possível autenticar agora.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}
      <div className="home-grid">
        <section className="card" style={{ minHeight: 280 }}>
          <h1 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
            Encontre seu churrasqueiro
          </h1>
          <p style={{ marginTop: 0, marginBottom: "1.25rem", color: "#9ca3af" }}>
            MVP rápido, seguro e responsivo. Os dados sensíveis são sempre
            validados pelo backend antes de qualquer operação no banco.
          </p>

          <div>
            <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
              Churrasqueiros em destaque
            </h2>
            {loadingChurrasqueiros && <p>Carregando churrasqueiros...</p>}
            {!loadingChurrasqueiros &&
              churrasqueiros &&
              churrasqueiros.length === 0 && (
                <p style={{ color: "#9ca3af" }}>
                  Nenhum churrasqueiro cadastrado ainda.
                </p>
              )}
            {!loadingChurrasqueiros &&
              churrasqueiros &&
              churrasqueiros.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {churrasqueiros.slice(0, 8).map((c) => (
                    <li
                      key={c.id}
                      style={{
                        padding: "0.5rem 0",
                        borderBottom: "1px solid #1f2937",
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
                        <button className="btn" type="button">
                          Agendar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </section>

        <section className="card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0 }}>
              {mode === "login" ? "Entrar" : "Criar conta"}
            </h2>
            <button
              type="button"
              className="btn"
              style={{
                background:
                  mode === "login"
                    ? "linear-gradient(135deg,#f97316,#ea580c)"
                    : "transparent",
                border:
                  mode === "login" ? "none" : "1px solid rgba(249,115,22,0.5)",
                color: mode === "login" ? "#020617" : "#f97316",
                paddingInline: "0.75rem",
                fontSize: "0.8rem",
              }}
              onClick={() =>
                setMode((prev) => (prev === "login" ? "register" : "login"))
              }
            >
              {mode === "login" ? "Quero me cadastrar" : "Já tenho conta"}
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "0.75rem" }}>
            {mode === "register" && (
              <div>
                <label
                  htmlFor="name"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Nome
                </label>
                <input
                  id="name"
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                style={{ display: "block", marginBottom: "0.25rem" }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                style={{ display: "block", marginBottom: "0.25rem" }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>

            {error && (
              <p style={{ color: "#f97316", fontSize: "0.9rem", marginTop: "0.25rem" }}>
                {error}
              </p>
            )}

            <button className="btn" type="submit" disabled={loading}>
              {mode === "login" ? "Entrar" : "Criar conta"}
            </button>

            {auth.token && (
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#9ca3af",
                  marginTop: "0.5rem",
                }}
              >
                Autenticado como <strong>{auth.email}</strong>. Em breve aqui entra
                o fluxo completo de agendamento e pagamento.
              </p>
            )}
          </form>
        </section>
      </div>
    </>
  );
}
