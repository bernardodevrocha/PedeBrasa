"use client";

import { useEffect, useMemo, useState } from "react";
import {
  api,
  type ApiError,
  type ChurrasqueiroBookingResponse,
  type ChurrasqueiroProfile,
  type ChurrasqueiroSummary,
} from "../../../lib/api";
import { readStoredAuth } from "../../../lib/auth";
import { formatCurrency, formatDateLabel } from "../../../features/profile/utils";

function parseSelectedCuts(selectedCuts: string | null) {
  if (!selectedCuts) {
    return [];
  }

  try {
    const parsed = JSON.parse(selectedCuts) as string[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ChurrasqueiroAgendamentosPage() {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authRole, setAuthRole] = useState<string | null>(null);
  const [pitmasters, setPitmasters] = useState<ChurrasqueiroSummary[]>([]);
  const [selectedPitmasterId, setSelectedPitmasterId] = useState<string>("");
  const [selectedPitmasterProfile, setSelectedPitmasterProfile] =
    useState<ChurrasqueiroProfile | null>(null);
  const [bookings, setBookings] = useState<ChurrasqueiroBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [adjustments, setAdjustments] = useState<Record<number, string>>({});

  useEffect(() => {
    const auth = readStoredAuth();
    setAuthToken(auth.token);
    setAuthRole(auth.role);
  }, []);

  useEffect(() => {
    if (!authToken || !authRole) {
      setLoading(false);
      setBookings([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        if (authRole === "admin") {
          const allPitmasters = await api.listChurrasqueiros();
          if (!active) {
            return;
          }

          setPitmasters(allPitmasters);
          const fallbackId = allPitmasters[0] ? String(allPitmasters[0].id) : "";
          const nextSelectedId = selectedPitmasterId || fallbackId;
          setSelectedPitmasterId(nextSelectedId);

          if (!nextSelectedId) {
            setBookings([]);
            setSelectedPitmasterProfile(null);
            return;
          }

          const selected = allPitmasters.find(
            (item) => String(item.id) === nextSelectedId,
          );

          if (!selected?.slug) {
            throw new Error("Nao foi possivel localizar o perfil desse churrasqueiro.");
          }

          const [profile, data] = await Promise.all([
            api.getChurrasqueiroProfile(selected.slug),
            api.listChurrasqueiroBookingsById(Number(nextSelectedId), authToken),
          ]);

          if (!active) {
            return;
          }

          setSelectedPitmasterProfile(profile);
          setBookings(data);
          setAdjustments(
            Object.fromEntries(
              data.map((booking) => [
                booking.id,
                booking.approvedPrice != null
                  ? String(booking.approvedPrice)
                  : String(booking.estimatedPrice),
              ]),
            ),
          );
          return;
        }

        const me = await api.getMyChurrasqueiro(authToken);
        if (!active) {
          return;
        }

        if (!me.slug) {
          throw new Error("Perfil do churrasqueiro sem slug para carregar painel.");
        }

        const [profile, data] = await Promise.all([
          api.getChurrasqueiroProfile(me.slug),
          api.listMyChurrasqueiroBookings(authToken),
        ]);

        if (!active) {
          return;
        }

        setSelectedPitmasterId(String(me.id));
        setSelectedPitmasterProfile(profile);
        setBookings(data);
        setAdjustments(
          Object.fromEntries(
            data.map((booking) => [
              booking.id,
              booking.approvedPrice != null
                ? String(booking.approvedPrice)
                : String(booking.estimatedPrice),
            ]),
          ),
        );
      } catch (err) {
        if (!active) {
          return;
        }

        const maybeError = err as Partial<ApiError>;
        setError(
          maybeError.message ??
            "Nao foi possivel carregar as solicitacoes do churrasqueiro.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [authRole, authToken, selectedPitmasterId]);

  const pendingBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "EM_ANALISE_CHURRASQUEIRO" ||
          booking.status === "AJUSTADO_PELO_CHURRASQUEIRO",
      ),
    [bookings],
  );
  const approvedBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "APROVADO_PARA_PAGAMENTO" ||
          booking.status === "AJUSTADO_PELO_CHURRASQUEIRO",
      ),
    [bookings],
  );
  const paidBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "PAGO"),
    [bookings],
  );

  async function refreshBookings() {
    if (!authToken) {
      return;
    }

    const data =
      authRole === "admin" && selectedPitmasterId
        ? await api.listChurrasqueiroBookingsById(
            Number(selectedPitmasterId),
            authToken,
          )
        : await api.listMyChurrasqueiroBookings(authToken);
    setBookings(data);
  }

  async function handleAction(
    booking: ChurrasqueiroBookingResponse,
    action: "approve" | "adjust" | "reject",
  ) {
    if (!authToken) {
      setActionError("Voce precisa estar autenticado.");
      return;
    }

    setActionLoadingId(booking.id);
    setActionError(null);

    try {
      const rawAdjustedPrice = adjustments[booking.id];
      const approvedPrice =
        action === "reject" ? undefined : Number(rawAdjustedPrice.replace(",", "."));

      if (action === "adjust" && (!rawAdjustedPrice || Number.isNaN(approvedPrice))) {
        throw new Error("Informe um valor valido para ajustar a solicitacao.");
      }

      if (action !== "reject" && approvedPrice != null && approvedPrice <= 0) {
        throw new Error("O valor aprovado precisa ser maior que zero.");
      }

      await api.reviewBooking(
        booking.id,
        {
          action,
          approvedPrice:
            action === "approve"
              ? Number(booking.estimatedPrice)
              : action === "adjust"
                ? approvedPrice
                : undefined,
        },
        authToken,
      );

      await refreshBookings();
    } catch (err) {
      const maybeError = err as Partial<ApiError> & { message?: string };
      setActionError(
        maybeError.message ?? "Nao foi possivel atualizar a solicitacao.",
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  if (!authToken) {
    return (
      <section className="card profile-error-card">
        <h1>Area do churrasqueiro</h1>
        <p>Entre na plataforma para revisar as solicitacoes recebidas.</p>
      </section>
    );
  }

  if (authRole !== "churrasqueiro" && authRole !== "admin") {
    return (
      <section className="card profile-error-card">
        <h1>Acesso restrito</h1>
        <p>Somente admins e churrasqueiros podem acessar este painel.</p>
      </section>
    );
  }

  return (
    <div className="pitmaster-shell">
      <section className="card pitmaster-hero">
        <div>
          <span className="discover-hero-kicker">Area do Churrasqueiro</span>
          <h1>
            {authRole === "admin"
              ? "Painel individual do churrasqueiro"
              : "Solicitacoes do seu perfil"}
          </h1>
          <p>
            {authRole === "admin"
              ? "Acompanhe cada perfil de forma individual, com status do evento, pagamento e detalhes do cliente."
              : "Revise as solicitacoes do seu perfil, acompanhe pagamentos e gerencie o estado de cada evento."}
          </p>
        </div>
        <div className="pitmaster-stats">
          <div className="pitmaster-stat-card">
            <small>Total</small>
            <strong>{bookings.length}</strong>
          </div>
          <div className="pitmaster-stat-card">
            <small>Pendentes</small>
            <strong>{pendingBookings.length}</strong>
          </div>
          <div className="pitmaster-stat-card">
            <small>Aguardando pagamento</small>
            <strong>{approvedBookings.length}</strong>
          </div>
          <div className="pitmaster-stat-card">
            <small>Pagos</small>
            <strong>{paidBookings.length}</strong>
          </div>
        </div>
      </section>

      {authRole === "admin" && (
        <section className="card">
          <label className="profile-field">
            <span>Churrasqueiro monitorado</span>
            <select
              className="input"
              value={selectedPitmasterId}
              onChange={(event) => setSelectedPitmasterId(event.target.value)}
            >
              <option value="">Selecione um churrasqueiro</option>
              {pitmasters.map((pitmaster) => (
                <option key={pitmaster.id} value={pitmaster.id}>
                  {pitmaster.name} - {pitmaster.city}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {selectedPitmasterProfile && (
        <section className="card pitmaster-hero">
          <div>
            <span className="discover-hero-kicker">Perfil carregado</span>
            <h2>{selectedPitmasterProfile.name}</h2>
            <p>
              {selectedPitmasterProfile.description?.trim() ||
                "Este churrasqueiro ainda nao cadastrou descricao."}
            </p>
          </div>
          <div className="pitmaster-stats">
            <div className="pitmaster-stat-card">
              <small>Cidade</small>
              <strong>{selectedPitmasterProfile.city}</strong>
            </div>
            <div className="pitmaster-stat-card">
              <small>Preco por hora</small>
              <strong>{formatCurrency(selectedPitmasterProfile.pricePerHour)}/h</strong>
            </div>
            <div className="pitmaster-stat-card">
              <small>Parceiros</small>
              <strong>{selectedPitmasterProfile.parceiros.length}</strong>
            </div>
          </div>
        </section>
      )}

      {loading && (
        <div className="discover-loading-panel">
          <div className="spinner" />
        </div>
      )}

      {!loading && error && <div className="discover-auth-error">{error}</div>}

      {actionError && <div className="discover-auth-error">{actionError}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="discover-empty-state">
          Nenhuma solicitacao encontrada para este churrasqueiro ainda.
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="pitmaster-bookings-grid">
          {bookings.map((booking) => {
            const cuts = parseSelectedCuts(booking.selectedCuts);
            const canReview =
              booking.status === "EM_ANALISE_CHURRASQUEIRO" ||
              booking.status === "AJUSTADO_PELO_CHURRASQUEIRO";

            return (
              <article key={booking.id} className="card pitmaster-booking-card">
                <div className="pitmaster-booking-header">
                  <div>
                    <small>Solicitacao #{booking.id}</small>
                    <h2>
                      {formatDateLabel(booking.date)} - {booking.startTime} ate{" "}
                      {booking.endTime}
                    </h2>
                  </div>
                  <span className="pitmaster-status-pill">{booking.status}</span>
                </div>

                <div className="pitmaster-booking-grid">
                  <div className="pitmaster-booking-section">
                    <strong>Cliente</strong>
                    <span>{booking.customer?.name ?? "Cliente nao encontrado"}</span>
                    <small>{booking.customer?.email ?? "Sem e-mail"}</small>
                  </div>

                  <div className="pitmaster-booking-section">
                    <strong>Valores</strong>
                    <span>Servico: {formatCurrency(booking.serviceAmount)}</span>
                    <span>Taxa plataforma: {formatCurrency(booking.platformFeeAmount)}</span>
                    <span>Estimativa: {formatCurrency(booking.estimatedPrice)}</span>
                    <span>
                      Valor final:{" "}
                      {booking.approvedPrice != null
                        ? formatCurrency(booking.approvedPrice)
                        : "Aguardando definicao"}
                    </span>
                    <span>
                      Pagamento:{" "}
                      {booking.payment
                        ? booking.payment.status
                        : booking.status === "PAGO"
                          ? "paid"
                          : "nao iniciado"}
                    </span>
                  </div>

                  <div className="pitmaster-booking-section">
                    <strong>Detalhes</strong>
                    <span>
                      Parceiro: {booking.partnerName ?? "Sem parceiro vinculado"}
                    </span>
                    <span>
                      Cortes: {cuts.length > 0 ? cuts.join(", ") : "Nao informados"}
                    </span>
                    <span>
                      Estado do evento: {booking.status}
                    </span>
                    <small>{booking.notes?.trim() || "Sem observacoes do cliente"}</small>
                  </div>
                </div>

                {canReview ? (
                  <div className="pitmaster-booking-actions">
                    <label className="profile-field">
                      <span>Valor final aprovado</span>
                      <input
                        className="input"
                        inputMode="decimal"
                        value={adjustments[booking.id] ?? ""}
                        onChange={(event) =>
                          setAdjustments((prev) => ({
                            ...prev,
                            [booking.id]: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <div className="pitmaster-action-row">
                      <button
                        type="button"
                        className="btn"
                        disabled={actionLoadingId === booking.id}
                        onClick={() => handleAction(booking, "approve")}
                      >
                        {actionLoadingId === booking.id
                          ? "Salvando..."
                          : "Aprovar estimativa"}
                      </button>
                      <button
                        type="button"
                        className="discover-toolbar-pill"
                        disabled={actionLoadingId === booking.id}
                        onClick={() => handleAction(booking, "adjust")}
                      >
                        Ajustar valor
                      </button>
                      <button
                        type="button"
                        className="pitmaster-reject-button"
                        disabled={actionLoadingId === booking.id}
                        onClick={() => handleAction(booking, "reject")}
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-empty-state">
                    Esta solicitacao nao aceita mais revisao neste momento.
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
