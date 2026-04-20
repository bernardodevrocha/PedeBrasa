"use client";

import { useEffect, useMemo, useState } from "react";
import {
  api,
  type ApiError,
  type ChurrasqueiroBookingResponse,
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
    if (!authToken) {
      setLoading(false);
      setBookings([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    api
      .listMyChurrasqueiroBookings(authToken)
      .then((data) => {
        if (!active) {
          return;
        }

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
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        const maybeError = err as Partial<ApiError>;
        setError(
          maybeError.message ??
            "Nao foi possivel carregar as solicitacoes do churrasqueiro.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authToken]);

  const pendingBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking.status === "EM_ANALISE_CHURRASQUEIRO" ||
          booking.status === "AJUSTADO_PELO_CHURRASQUEIRO",
      ),
    [bookings],
  );

  async function refreshBookings() {
    if (!authToken) {
      return;
    }

    const data = await api.listMyChurrasqueiroBookings(authToken);
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

  if (authRole !== "churrasqueiro") {
    return (
      <section className="card profile-error-card">
        <h1>Acesso restrito</h1>
        <p>Somente o churrasqueiro dono do perfil pode revisar estas solicitacoes.</p>
      </section>
    );
  }

  return (
    <div className="pitmaster-shell">
      <section className="card pitmaster-hero">
        <div>
          <span className="discover-hero-kicker">Area do Churrasqueiro</span>
          <h1>Solicitacoes do seu perfil</h1>
          <p>
            Apenas voce pode aprovar, ajustar ou recusar os pedidos vinculados ao
            seu cadastro.
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
        </div>
      </section>

      {loading && (
        <div className="discover-loading-panel">
          <div className="spinner" />
        </div>
      )}

      {!loading && error && <div className="discover-auth-error">{error}</div>}

      {actionError && <div className="discover-auth-error">{actionError}</div>}

      {!loading && !error && bookings.length === 0 && (
        <div className="discover-empty-state">
          Nenhuma solicitacao chegou para o seu perfil ainda.
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
                  </div>

                  <div className="pitmaster-booking-section">
                    <strong>Detalhes</strong>
                    <span>
                      Parceiro: {booking.partnerName ?? "Sem parceiro vinculado"}
                    </span>
                    <span>
                      Cortes: {cuts.length > 0 ? cuts.join(", ") : "Nao informados"}
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
