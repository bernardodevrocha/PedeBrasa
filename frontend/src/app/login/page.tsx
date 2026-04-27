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
  const [form, setForm] = useState({
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

    if (!form.email || !form.password) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.login(form);
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
          <h1>Entre na sua conta PedeBrasa</h1>
          <p>
            Acesse suas conversas, pedidos e o painel do churrasqueiro em um
            unico lugar.
          </p>
        </div>

        <div className="card login-card">
          <div className="discover-auth-header">
            <h2>Entrar</h2>
          </div>

          <form onSubmit={handleSubmit} className="discover-auth-form">
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
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="discover-auth-note">
            Se sua conta ainda nao existe, o cadastro pode continuar sendo feito
            pela API enquanto preparamos o fluxo completo no produto.
          </p>
        </div>
      </section>
    </>
  );
}
