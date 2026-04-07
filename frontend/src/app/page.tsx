"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type ApiError } from "../lib/api";

interface AuthState {
  token: string | null;
  email: string | null;
}

interface Churrasqueiro {
  id: number;
  name: string;
  city: string;
  description?: string | null;
  pricePerHour: string | number;
  rating?: string | number;
  imgChurrasqueiro?: string | null;
}

function useAuth(): [AuthState, (token: string, email: string) => void] {
  const [state, setState] = useState<AuthState>({ token: null, email: null });

  useEffect(() => {
    const stored = window.localStorage.getItem("pedebrasa_auth");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as AuthState;
      setState(parsed);
    } catch {
      // ignore malformed auth cache
    }
  }, []);

  const setAuth = (token: string, email: string) => {
    const next = { token, email };
    window.localStorage.setItem("pedebrasa_auth", JSON.stringify(next));
    setState(next);
  };

  return [state, setAuth];
}

function ChurrasqueiroAvatar({
  churrasqueiro,
}: {
  churrasqueiro: Churrasqueiro;
}) {
  if (churrasqueiro.imgChurrasqueiro) {
    return (
      <img
        src={churrasqueiro.imgChurrasqueiro}
        alt={`Foto de ${churrasqueiro.name}`}
        className="discover-card-image"
      />
    );
  }

  return (
    <div className="discover-card-image discover-card-image-placeholder">
      <span>{churrasqueiro.name.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [auth, setAuth] = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [churrasqueiros, setChurrasqueiros] = useState<Churrasqueiro[]>([]);
  const [loadingChurrasqueiros, setLoadingChurrasqueiros] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    let active = true;
    setLoadingChurrasqueiros(true);

    api
      .listChurrasqueiros(search)
      .then((data) => {
        if (active) {
          setChurrasqueiros(data as Churrasqueiro[]);
        }
      })
      .catch(() => {
        if (active) {
          setChurrasqueiros([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingChurrasqueiros(false);
        }
      });

    return () => {
      active = false;
    };
  }, [search]);

  const heroSubtitle = useMemo(() => {
    if (loadingChurrasqueiros) {
      return "Carregando os melhores profissionais da sua regiao.";
    }

    if (churrasqueiros.length === 0) {
      return "Nenhum churrasqueiro encontrado para os filtros atuais.";
    }

    return `${churrasqueiros.length} profissionais disponiveis para seu proximo evento.`;
  }, [churrasqueiros.length, loadingChurrasqueiros]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password || (mode === "register" && !form.name)) {
      setError("Preencha todos os campos obrigatorios.");
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
        setError("Nao foi possivel autenticar agora.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handlePrimaryAction() {
    if (auth.token) {
      router.push("/menu");
      return;
    }

    const authCard = document.getElementById("home-auth-card");
    authCard?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="spinner" />
        </div>
      )}

      <div className="discover-shell">
        <aside className="discover-sidebar">
          <div className="discover-brand">
            <div className="discover-brand-icon">P</div>
            <div>
              <strong>PedeBrasa</strong>
              <p>Churrasqueiros Premium</p>
            </div>
          </div>

          <nav className="discover-nav">
            <button type="button" className="discover-nav-item active">
              Descobrir
            </button>
            <button
              type="button"
              className="discover-nav-item"
              onClick={() => router.push("/parceiros")}
            >
              Parceiros
            </button>
            <button type="button" className="discover-nav-item">
              Blog
            </button>
            <button type="button" className="discover-nav-item">
              Chat
            </button>
            <button type="button" className="discover-nav-item">
              Indicar Amigos
            </button>
            <button type="button" className="discover-nav-item">
              Area do Churrasqueiro
            </button>
            <button type="button" className="discover-nav-item">
              Meu Perfil
            </button>
          </nav>

          <div className="discover-sidebar-footer" id="home-auth-card">
            <div className="discover-auth-header">
              <h2>{mode === "login" ? "Entrar" : "Criar conta"}</h2>
              <button
                type="button"
                className="discover-auth-toggle"
                onClick={() =>
                  setMode((prev) => (prev === "login" ? "register" : "login"))
                }
              >
                {mode === "login" ? "Cadastrar" : "Ja tenho conta"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="discover-auth-form">
              {mode === "register" && (
                <input
                  className="input"
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              )}

              <input
                type="email"
                className="input"
                placeholder="Seu e-mail"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
              <input
                type="password"
                className="input"
                placeholder="Sua senha"
                value={form.password}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />

              {error && <p className="discover-auth-error">{error}</p>}

              <button className="btn discover-auth-submit" type="submit">
                {mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            {auth.token && (
              <p className="discover-auth-note">
                Conectado como <strong>{auth.email}</strong>.
              </p>
            )}
          </div>
        </aside>

        <section className="discover-content">
          <div className="discover-hero">
            <div className="discover-hero-copy">
              <span className="discover-hero-kicker">Descobrir</span>
              <h1>Encontre o churrasqueiro ideal para o seu evento</h1>
              <p>{heroSubtitle}</p>
            </div>

            <div className="discover-filter-card">
              <label htmlFor="discover-search" className="discover-filter-label">
                Filtrar por nome ou cidade
              </label>
              <div className="discover-filter-row">
                <input
                  id="discover-search"
                  className="input discover-filter-input"
                  placeholder="Ex.: Cuiaba, Ju do Churrasco..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="btn discover-filter-button"
                  onClick={handlePrimaryAction}
                >
                  {auth.token ? "Abrir menu" : "Comecar agora"}
                </button>
              </div>
            </div>
          </div>

          <div className="discover-toolbar">
            <div>
              <h2>
                {loadingChurrasqueiros
                  ? "Carregando profissionais..."
                  : `${churrasqueiros.length} profissionais disponiveis`}
              </h2>
              <p>Profissionais reais cadastrados no banco de dados.</p>
            </div>
            <div className="discover-toolbar-actions">
              <button type="button" className="discover-toolbar-pill active">
                Grade
              </button>
              <button type="button" className="discover-toolbar-pill">
                Mapa
              </button>
              <button type="button" className="discover-toolbar-pill">
                Solicitar Orcamento
              </button>
            </div>
          </div>

          {loadingChurrasqueiros && (
            <div className="discover-loading-panel">
              <div className="spinner" />
            </div>
          )}

          {!loadingChurrasqueiros && churrasqueiros.length === 0 && (
            <div className="discover-empty-state">
              Nenhum churrasqueiro encontrado para essa busca.
            </div>
          )}

          {!loadingChurrasqueiros && churrasqueiros.length > 0 && (
            <div className="discover-grid">
              {churrasqueiros.map((item) => (
                <article key={item.id} className="discover-card">
                  <div className="discover-card-media">
                    <ChurrasqueiroAvatar churrasqueiro={item} />
                    <span className="discover-badge premium">Premium</span>
                    <span className="discover-badge level">Senior</span>
                  </div>

                  <div className="discover-card-body">
                    <div className="discover-card-heading">
                      <h3>{item.name}</h3>
                      <p>{item.city}</p>
                    </div>

                    <div className="discover-card-stats">
                      <span>
                        Nota {Number(item.rating ?? 4.9).toFixed(1)}
                      </span>
                      <span>R$ {item.pricePerHour}/h</span>
                    </div>

                    {item.description && (
                      <p className="discover-card-description">
                        {item.description}
                      </p>
                    )}

                    <div className="discover-tag-row">
                      <span className="discover-tag">Churrasco Premium</span>
                      <span className="discover-tag">Eventos</span>
                      <span className="discover-tag">{item.city}</span>
                    </div>

                    <div className="discover-card-footer">
                      <div>
                        <small>A partir de</small>
                        <strong>R$ {item.pricePerHour}</strong>
                      </div>
                      <button
                        type="button"
                        className="btn"
                        onClick={handlePrimaryAction}
                      >
                        Ver Perfil
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
