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
  pricePerHour: string | number;
  rating?: string | number;
  photoUrl?: string | null;
}

const FALLBACK_PHOTOS = [
  "https://images.unsplash.com/photo-1553163147-622ab57be1c7?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1555992336-03a23c9d5f2b?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=600&q=80",
];

function getPhotoUrl(churrasqueiro: Churrasqueiro, index: number): string {
  if (churrasqueiro.photoUrl) {
    return churrasqueiro.photoUrl;
  }
  return FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length];
}

export default function MenuPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [items, setItems] = useState<Churrasqueiro[]>([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    city: "",
    description: "",
    pricePerHour: "",
  });

  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedChurrasqueiro, setSelectedChurrasqueiro] =
    useState<Churrasqueiro | null>(null);
  const [bookingForm, setBookingForm] = useState({
    date: "",
    startTime: "",
    endTime: "",
    notes: "",
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!auth?.token) return;

    setCreateError(null);

    if (!createForm.name || !createForm.city || !createForm.pricePerHour) {
      setCreateError("Preencha nome, cidade e preço por hora.");
      return;
    }

    const parsedPrice = Number(
      createForm.pricePerHour.replace(",", "."),
    );
    if (Number.isNaN(parsedPrice)) {
      setCreateError("Preço por hora inválido.");
      return;
    }

    setCreateLoading(true);
    try {
      const created = await api.createChurrasqueiro(
        {
          name: createForm.name,
          city: createForm.city,
          description: createForm.description || undefined,
          pricePerHour: parsedPrice,
        },
        auth.token!,
      );

      setItems((prev) => [...prev, created as Churrasqueiro]);
      setCreateForm({
        name: "",
        city: "",
        description: "",
        pricePerHour: "",
      });
      setCreating(false);
    } catch (err) {
      const maybeError = err as { message?: string };
      setCreateError(
        maybeError?.message ?? "Não foi possível cadastrar agora.",
      );
    } finally {
      setCreateLoading(false);
    }
  }

  function openBookingModal(churrasqueiro: Churrasqueiro) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    setSelectedChurrasqueiro(churrasqueiro);
    setBookingForm({
      date: dateStr,
      startTime: "19:00",
      endTime: "22:00",
      notes: "",
    });
    setBookingError(null);
    setBookingSuccess(null);
    setBookingOpen(true);
  }

  function closeBookingModal() {
    setBookingOpen(false);
    setSelectedChurrasqueiro(null);
    setBookingError(null);
    setBookingSuccess(null);
  }

  async function handleBookingSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!auth?.token || !selectedChurrasqueiro) return;

    setBookingError(null);
    setBookingSuccess(null);

    if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) {
      setBookingError("Preencha data, horário de início e término.");
      return;
    }

    setBookingLoading(true);
    try {
      await api.createBooking(
        {
          churrasqueiroId: selectedChurrasqueiro.id,
          date: bookingForm.date,
          startTime: bookingForm.startTime,
          endTime: bookingForm.endTime,
          notes: bookingForm.notes || undefined,
        },
        auth.token,
      );
      setBookingSuccess(
        "Agendamento criado com sucesso! Em breve você receberá a confirmação.",
      );
    } catch (err) {
      const maybeError = err as { message?: string };
      setBookingError(
        maybeError?.message ??
          "Não foi possível criar o agendamento agora.",
      );
    } finally {
      setBookingLoading(false);
    }
  }

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

      {bookingOpen && selectedChurrasqueiro && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>
                  Agendar com {selectedChurrasqueiro.name}
                </h2>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.9rem",
                    color: "#9ca3af",
                  }}
                >
                  {selectedChurrasqueiro.city} • R${" "}
                  {selectedChurrasqueiro.pricePerHour}/h
                </p>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={closeBookingModal}
                aria-label="Fechar agendamento"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleBookingSubmit}
              style={{ display: "grid", gap: "0.75rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <label
                    htmlFor="booking-date"
                    style={{
                      display: "block",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Data
                  </label>
                  <input
                    id="booking-date"
                    type="date"
                    className="input"
                    value={bookingForm.date}
                    onChange={(e) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        date: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  <div>
                    <label
                      htmlFor="booking-start"
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Início
                    </label>
                    <input
                      id="booking-start"
                      type="time"
                      className="input"
                      value={bookingForm.startTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="booking-end"
                      style={{
                        display: "block",
                        marginBottom: "0.25rem",
                      }}
                    >
                      Fim
                    </label>
                    <input
                      id="booking-end"
                      type="time"
                      className="input"
                      value={bookingForm.endTime}
                      onChange={(e) =>
                        setBookingForm((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="booking-notes"
                  style={{
                    display: "block",
                    marginBottom: "0.25rem",
                  }}
                >
                  Observações (opcional)
                </label>
                <textarea
                  id="booking-notes"
                  className="input"
                  style={{ minHeight: "72px", resize: "vertical" }}
                  placeholder="Ex.: tipo de carne, número de convidados, restrições..."
                  value={bookingForm.notes}
                  onChange={(e) =>
                    setBookingForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>

              {bookingError && (
                <p
                  style={{
                    color: "#f97316",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  {bookingError}
                </p>
              )}

              {bookingSuccess && (
                <p
                  style={{
                    color: "#22c55e",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  {bookingSuccess}
                </p>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                <button
                  type="button"
                  className="btn"
                  style={{
                    background: "transparent",
                    border: "1px solid #4b5563",
                    color: "#e5e7eb",
                  }}
                  onClick={closeBookingModal}
                  disabled={bookingLoading}
                >
                  Cancelar
                </button>
                <button
                  className="btn"
                  type="submit"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? "Agendando..." : "Confirmar agendamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: "0.75rem" }}>
          Olá, {auth.email}
        </h1>
        <p style={{ marginTop: 0, marginBottom: "1rem", color: "#9ca3af" }}>
          Aqui estão os churrasqueiros disponíveis com suas cidades,
          descrições, preços e avaliações.
        </p>

        <section
          style={{
            marginBottom: "1.5rem",
            padding: "0.75rem 0",
            borderTop: "1px solid #1f2937",
            borderBottom: "1px solid #1f2937",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginBottom: creating ? "0.75rem" : 0,
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1rem" }}>
              Quer se cadastrar como churrasqueiro?
            </h2>
            <button
              type="button"
              className="btn"
              onClick={() => setCreating((prev) => !prev)}
            >
              {creating
                ? "Fechar formulário"
                : "Cadastrar como churrasqueiro"}
            </button>
          </div>

          {creating && (
            <form
              onSubmit={handleCreate}
              style={{
                display: "grid",
                gap: "0.75rem",
                marginTop: "0.75rem",
              }}
            >
              <div>
                <label
                  htmlFor="nome-churrasqueiro"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Nome
                </label>
                <input
                  id="nome-churrasqueiro"
                  className="input"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="cidade-churrasqueiro"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Cidade
                </label>
                <input
                  id="cidade-churrasqueiro"
                  className="input"
                  value={createForm.city}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="preco-churrasqueiro"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Preço por hora (R$)
                </label>
                <input
                  id="preco-churrasqueiro"
                  className="input"
                  value={createForm.pricePerHour}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      pricePerHour: e.target.value,
                    }))
                  }
                  placeholder="Ex: 150,00"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="descricao-churrasqueiro"
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  Descrição (opcional)
                </label>
                <textarea
                  id="descricao-churrasqueiro"
                  className="input"
                  style={{ minHeight: "72px", resize: "vertical" }}
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              {createError && (
                <p
                  style={{
                    color: "#f97316",
                    fontSize: "0.9rem",
                    margin: 0,
                  }}
                >
                  {createError}
                </p>
              )}

              <button className="btn" type="submit" disabled={createLoading}>
                {createLoading ? "Cadastrando..." : "Salvar cadastro"}
              </button>
            </form>
          )}
        </section>

        {items.length === 0 && !loading && (
          <p style={{ color: "#9ca3af" }}>
            Nenhum churrasqueiro cadastrado ainda.
          </p>
        )}

        {items.length > 0 && (
          <div className="churrasqueiros-grid">
            {items.map((c, index) => {
              const photoUrl = getPhotoUrl(c, index);
              return (
                <article key={c.id} className="churrasqueiro-card">
                  <img
                    src={photoUrl}
                    alt={`Foto de ${c.name}`}
                    className="churrasqueiro-card-image"
                  />
                  <div className="churrasqueiro-card-body">
                    <div>
                      <strong>{c.name}</strong>
                      <div
                        style={{ fontSize: "0.875rem", color: "#9ca3af" }}
                      >
                        {c.city} • R$ {c.pricePerHour}/h
                      </div>
                      {c.description && (
                        <p
                          style={{
                            fontSize: "0.9rem",
                            color: "#9ca3af",
                            margin: "0.35rem 0 0",
                          }}
                        >
                          {c.description}
                        </p>
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "0.4rem",
                        gap: "0.5rem",
                      }}
                    >
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
                      <button
                        className="btn"
                        type="button"
                        onClick={() => openBookingModal(c)}
                      >
                        Agendar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
