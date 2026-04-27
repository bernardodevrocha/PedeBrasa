"use client";

import { useEffect, useMemo, useState } from "react";
import {
  api,
  type ChurrasqueiroSummary,
  type Parceiro,
} from "../../lib/api";

interface AuthState {
  token: string | null;
  email: string | null;
  role: "user" | "admin" | "churrasqueiro" | null;
}

interface ChurrasqueiroOption extends ChurrasqueiroSummary {
  pricePerHour?: string | number;
}

export default function ParceirosPage() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [items, setItems] = useState<Parceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayString, setTodayString] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    city: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const [creating, setCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [availableChurrasqueiros, setAvailableChurrasqueiros] = useState<
    ChurrasqueiroOption[]
  >([]);
  const [createForm, setCreateForm] = useState({
    name: "",
    category: "",
    description: "",
    featuredProducts: "",
    location: "",
    city: "",
    phone: "",
    openingHours: "",
    couponCode: "",
    validUntil: "",
    recommendedChurrasqueiroIds: [] as number[],
  });

  useEffect(() => {
    setTodayString(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("pedebrasa_auth");
    if (!stored) {
      setAuth({ token: null, email: null, role: null });
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AuthState;
      setAuth(parsed);
    } catch {
      setAuth({ token: null, email: null, role: null });
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedFilters(filters);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .listParceiros(debouncedFilters)
      .then((data) => {
        if (active) {
          setItems(data);
        }
      })
      .catch(() => {
        if (active) {
          setItems([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [debouncedFilters]);

  useEffect(() => {
    let active = true;

    api
      .listChurrasqueiros()
      .then((data) => {
        if (active) {
          setAvailableChurrasqueiros(data as ChurrasqueiroOption[]);
        }
      })
      .catch(() => {
        if (active) {
          setAvailableChurrasqueiros([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const categoryMap = new Map<string, true>();
    items.forEach((item) => {
      if (item.category.trim()) {
        categoryMap.set(item.category, true);
      }
    });
    return Array.from(categoryMap.keys());
  }, [items]);

  function toggleChurrasqueiro(id: number) {
    setCreateForm((prev) => ({
      ...prev,
      recommendedChurrasqueiroIds: prev.recommendedChurrasqueiroIds.includes(id)
        ? prev.recommendedChurrasqueiroIds.filter((item) => item !== id)
        : [...prev.recommendedChurrasqueiroIds, id],
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!auth?.token) {
      setCreateError("Voce precisa estar autenticado para cadastrar parceiros.");
      return;
    }

    setCreateError(null);

    if (
      !createForm.name ||
      !createForm.category ||
      !createForm.location ||
      !createForm.city ||
      !createForm.phone ||
      !createForm.openingHours ||
      !createForm.couponCode ||
      !createForm.validUntil
    ) {
      setCreateError("Preencha todos os campos obrigatorios do parceiro.");
      return;
    }

    setCreateLoading(true);
    try {
      await api.createParceiro(
        {
          name: createForm.name,
          category: createForm.category,
          description: createForm.description || undefined,
          featuredProducts: createForm.featuredProducts || undefined,
          location: createForm.location,
          city: createForm.city,
          phone: createForm.phone,
          openingHours: createForm.openingHours,
          couponCode: createForm.couponCode,
          validUntil: createForm.validUntil,
          recommendedChurrasqueiroIds:
            createForm.recommendedChurrasqueiroIds,
        },
        auth.token,
      );

      const updated = await api.listParceiros(debouncedFilters);
      setItems(updated);
      setCreateForm({
        name: "",
        category: "",
        description: "",
        featuredProducts: "",
        location: "",
        city: "",
        phone: "",
        openingHours: "",
        couponCode: "",
        validUntil: "",
        recommendedChurrasqueiroIds: [],
      });
      setCreating(false);
    } catch (err) {
      const maybeError = err as { message?: string };
      setCreateError(
        maybeError?.message ?? "Nao foi possivel cadastrar o parceiro agora.",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "1rem",
          flexWrap: "wrap",
          marginBottom: "1rem",
        }}
      >
        <div>
          <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
            Parceiros ChurrasChef
          </h1>
          <p style={{ margin: 0, color: "#9ca3af" }}>
            Veja parceiros com cupons, filtre por nome, categoria e cidade, e
            conecte recomendacoes com churrasqueiros.
          </p>
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => setCreating((prev) => !prev)}
        >
          {creating ? "Fechar cadastro" : "Cadastrar parceiro"}
        </button>
      </div>

      <section className="filters-grid" style={{ marginBottom: "1.5rem" }}>
        <div>
          <label
            htmlFor="parceiro-search"
            style={{ display: "block", marginBottom: "0.25rem" }}
          >
            Buscar por nome
          </label>
          <input
            id="parceiro-search"
            className="input"
            placeholder="Ex.: Friboi, Casa da Carne..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </div>
        <div>
          <label
            htmlFor="parceiro-category"
            style={{ display: "block", marginBottom: "0.25rem" }}
          >
            Categoria
          </label>
          <input
            id="parceiro-category"
            list="partner-categories"
            className="input"
            placeholder="Ex.: mercado, acougue..."
            value={filters.category}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, category: e.target.value }))
            }
          />
          <datalist id="partner-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        <div>
          <label
            htmlFor="parceiro-city"
            style={{ display: "block", marginBottom: "0.25rem" }}
          >
            Cidade
          </label>
          <input
            id="parceiro-city"
            className="input"
            placeholder="Ex.: Cuiaba"
            value={filters.city}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, city: e.target.value }))
            }
          />
        </div>
      </section>

      {creating && (
        <section
          style={{
            marginBottom: "1.5rem",
            padding: "1rem",
            borderRadius: "0.75rem",
            border: "1px solid #1f2937",
            backgroundColor: "#0b1220",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Novo parceiro</h2>
          <form onSubmit={handleCreate} style={{ display: "grid", gap: "0.75rem" }}>
            <div className="filters-grid">
              <div>
                <label
                  htmlFor="partner-name"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Nome
                </label>
                <input
                  id="partner-name"
                  className="input"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="partner-category"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Categoria
                </label>
                <input
                  id="partner-category"
                  className="input"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="partner-city-form"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Cidade
                </label>
                <input
                  id="partner-city-form"
                  className="input"
                  value={createForm.city}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, city: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="partner-location"
                style={{ display: "block", marginBottom: "0.25rem" }}
              >
                Localizacao
              </label>
              <input
                id="partner-location"
                className="input"
                placeholder="Rua, numero, bairro..."
                value={createForm.location}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="filters-grid">
              <div>
                <label
                  htmlFor="partner-phone"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Telefone
                </label>
                <input
                  id="partner-phone"
                  className="input"
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="partner-hours"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Horario de funcionamento
                </label>
                <input
                  id="partner-hours"
                  className="input"
                  placeholder="Seg a Sab, 08:00 as 18:00"
                  value={createForm.openingHours}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      openingHours: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="partner-valid-until"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Valido ate
                </label>
                <input
                  id="partner-valid-until"
                  type="date"
                  className="input"
                  value={createForm.validUntil}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      validUntil: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="filters-grid">
              <div>
                <label
                  htmlFor="partner-coupon"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Codigo do cupom
                </label>
                <input
                  id="partner-coupon"
                  className="input"
                  value={createForm.couponCode}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      couponCode: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="partner-products"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Produtos em destaque
                </label>
                <input
                  id="partner-products"
                  className="input"
                  placeholder="Carnes nobres, espetos, bebidas..."
                  value={createForm.featuredProducts}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      featuredProducts: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="partner-description"
                style={{ display: "block", marginBottom: "0.25rem" }}
              >
                Descricao
              </label>
              <textarea
                id="partner-description"
                className="input"
                style={{ minHeight: "90px", resize: "vertical" }}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <span style={{ display: "block", marginBottom: "0.5rem" }}>
                Churrasqueiros recomendados
              </span>
              <div className="recommendations-grid">
                {availableChurrasqueiros.map((item) => {
                  const checked =
                    createForm.recommendedChurrasqueiroIds.includes(item.id);
                  return (
                    <label key={item.id} className="recommendation-chip">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleChurrasqueiro(item.id)}
                      />
                      <span>
                        {item.name} - {item.city}
                      </span>
                    </label>
                  );
                })}
                {availableChurrasqueiros.length === 0 && (
                  <p style={{ color: "#9ca3af", margin: 0 }}>
                    Cadastre churrasqueiros antes de vincula-los a parceiros.
                  </p>
                )}
              </div>
            </div>

            {createError && (
              <p style={{ color: "#f97316", margin: 0 }}>{createError}</p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn" type="submit" disabled={createLoading}>
                {createLoading ? "Salvando..." : "Salvar parceiro"}
              </button>
            </div>
          </form>
        </section>
      )}

      {loading && <p>Carregando parceiros...</p>}

      {!loading && items.length === 0 && (
        <p style={{ color: "#9ca3af" }}>
          Nenhum parceiro encontrado com os filtros atuais.
        </p>
      )}

      {items.length > 0 && (
        <div className="partners-grid">
          {items.map((item) => {
            const expired = todayString ? item.validUntil < todayString : false;
            return (
              <article key={item.id} className="partner-card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.1rem" }}>{item.name}</h2>
                    <p style={{ margin: "0.35rem 0 0", color: "#9ca3af" }}>
                      {item.city} - {item.location}
                    </p>
                  </div>
                  <span className="category-badge">{item.category}</span>
                </div>

                {item.description && (
                  <p style={{ marginTop: 0, color: "#d1d5db" }}>
                    {item.description}
                  </p>
                )}

                <div className="partner-meta">
                  <div>
                    <strong>Cupom:</strong> {item.couponCode}
                  </div>
                  <div>
                    <strong>Validade:</strong> {item.validUntil}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span style={{ color: expired ? "#f97316" : "#22c55e" }}>
                      {expired ? "Expirado" : "Ativo"}
                    </span>
                  </div>
                  <div>
                    <strong>Telefone:</strong> {item.phone}
                  </div>
                  <div>
                    <strong>Horario:</strong> {item.openingHours}
                  </div>
                </div>

                {item.featuredProducts && (
                  <p style={{ marginBottom: "0.75rem", color: "#d1d5db" }}>
                    <strong>Produtos em destaque:</strong> {item.featuredProducts}
                  </p>
                )}

                <div>
                  <strong style={{ display: "block", marginBottom: "0.5rem" }}>
                    Recomendado por churrasqueiros
                  </strong>
                  <div className="recommendations-grid">
                    {item.recommendedChurrasqueiros.length > 0 ? (
                      item.recommendedChurrasqueiros.map((churrasqueiro) => (
                        <span
                          key={churrasqueiro.id}
                          className="recommendation-chip static"
                        >
                          {churrasqueiro.name} - {churrasqueiro.city}
                        </span>
                      ))
                    ) : (
                      <span style={{ color: "#9ca3af" }}>
                        Ainda sem recomendacoes vinculadas.
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
