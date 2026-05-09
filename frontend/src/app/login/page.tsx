"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ApiError } from "../../lib/api";
import { readStoredAuth, storeAuth } from "../../lib/auth";

function sanitizeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export default function LoginPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(sanitizeNextPath(params.get("next")));
  }, []);

  useEffect(() => {
    const auth = readStoredAuth();
    if (auth.token) {
      router.replace(nextPath);
    }
  }, [nextPath, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (mode === "register" && !form.name.trim()) {
      setError("Informe seu nome para criar a conta.");
      return;
    }

    if (!form.email || !form.password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const response =
        mode === "login"
          ? await api.login({
              email: form.email,
              password: form.password,
            })
          : await api.register({
              name: form.name.trim(),
              email: form.email,
              password: form.password,
            });
      storeAuth({
        token: response.token,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role,
      });
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      setError(apiErr.message ?? "Nao foi possivel entrar agora.");
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

      <section className="login-shell">
        <div className="login-hero">
          <span className="discover-hero-kicker">Acesso</span>
          <h1>Entre ou crie sua conta PedeBrasa</h1>
          <p>
            A plataforma fica disponivel somente para usuarios autenticados.
            Faca login ou cadastre-se para continuar.
          </p>
        </div>

        <div className="card login-card">
          <div className="discover-auth-header">
            <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
          </div>

          <div className="login-mode-switch">
            <button
              type="button"
              className={`profile-tab-button${mode === "login" ? " is-active" : ""}`}
              onClick={() => {
                setMode("login");
                setError(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`profile-tab-button${mode === "register" ? " is-active" : ""}`}
              onClick={() => {
                setMode("register");
                setError(null);
              }}
            >
              Cadastro
            </button>
          </div>

          <form onSubmit={handleSubmit} className="discover-auth-form">
            {mode === "register" ? (
              <label className="profile-field">
                <span>Nome</span>
                <input
                  className="input"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </label>
            ) : null}

            <label className="profile-field">
              <span>E-mail</span>
              <input
                type="email"
                className="input"
                placeholder="voce@pedebrasa.com"
                value={form.email}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, email: event.target.value }))
                }
                required
              />
            </label>

            <label className="profile-field">
              <span>Senha</span>
              <input
                type="password"
                className="input"
                placeholder="Sua senha"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                required
              />
            </label>

            {error && <p className="discover-auth-error">{error}</p>}

            <button className="btn discover-auth-submit" type="submit" disabled={loading}>
              {loading
                ? mode === "login"
                  ? "Entrando..."
                  : "Criando conta..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>

          <p className="discover-auth-note">
            Depois de autenticar, voce volta automaticamente para a pagina que
            tentou acessar.
          </p>
        </div>
      </section>
    </>
  );
}
