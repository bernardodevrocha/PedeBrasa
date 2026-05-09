"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, type ApiError } from "../../lib/api";
import { readStoredAuth } from "../../lib/auth";
import type {
  CurrentUserProfile,
  MyBookingResponse,
} from "../../models/api";
import { formatCurrency, formatDateLabel } from "../../features/profile/utils";

function formatDateTime(value?: string) {
  if (!value) {
    return "--";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: MyBookingResponse["status"]) {
  switch (status) {
    case "EM_ANALISE_CHURRASQUEIRO":
      return "Em analise pelo churrasqueiro";
    case "AJUSTADO_PELO_CHURRASQUEIRO":
      return "Valor ajustado pelo churrasqueiro";
    case "APROVADO_PARA_PAGAMENTO":
      return "Aprovado para pagamento";
    case "RECUSADO":
      return "Recusado";
    case "PAGO":
      return "Pago";
    case "CANCELADO":
      return "Cancelado";
    case "PENDENTE_ORCAMENTO":
      return "Pendente de orcamento";
    default:
      return status;
  }
}

export default function MeuPerfilPage() {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<CurrentUserProfile | null>(null);
  const [bookings, setBookings] = useState<MyBookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = readStoredAuth();
    setToken(auth.token);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([api.getCurrentUser(token), api.listMyBookings(token)])
      .then(([user, bookingItems]) => {
        if (!active) {
          return;
        }

        setProfile(user);
        setBookings(bookingItems);
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        const apiErr = err as Partial<ApiError>;
        setError(apiErr.message ?? "Nao foi possivel carregar seu perfil.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

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

  if (!token) {
    return (
      <section className="card profile-error-card">
        <h1>Meu Perfil</h1>
        <p>Entre na plataforma para ver seus dados e agendamentos.</p>
        <Link href="/login?next=%2Fmeu-perfil" className="btn">
          Entrar
        </Link>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="discover-loading-panel">
        <div className="spinner" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <section className="card profile-error-card">
        <h1>Meu Perfil</h1>
        <p>{error ?? "Nao foi possivel carregar seus dados."}</p>
      </section>
    );
  }

  return (
    <div className="account-shell">
      <section className="card account-hero">
        <div>
          <span className="discover-hero-kicker">Conta</span>
          <h1>{profile.name}</h1>
          <p>
            Aqui voce acompanha seus dados de acesso, os eventos solicitados e
            os valores avaliados pelos churrasqueiros.
          </p>
        </div>
        <div className="account-stats">
          <div className="account-stat-card">
            <small>E-mail</small>
            <strong>{profile.email}</strong>
          </div>
          <div className="account-stat-card">
            <small>Perfil</small>
            <strong>{profile.role}</strong>
          </div>
          <div className="account-stat-card">
            <small>Com valor final</small>
            <strong>{approvedBookings.length}</strong>
          </div>
          <div className="account-stat-card">
            <small>Pagos</small>
            <strong>{paidBookings.length}</strong>
          </div>
        </div>
      </section>

      <section className="card account-section">
        <div className="profile-section-header">
          <div>
            <h2>Dados da conta</h2>
            <p>Resumo do usuario autenticado nesta sessao.</p>
          </div>
        </div>

        <div className="account-profile-grid">
          <div className="account-profile-card">
            <small>Nome</small>
            <strong>{profile.name}</strong>
          </div>
          <div className="account-profile-card">
            <small>E-mail</small>
            <strong>{profile.email}</strong>
          </div>
          <div className="account-profile-card">
            <small>Tipo de acesso</small>
            <strong>{profile.role}</strong>
          </div>
          <div className="account-profile-card">
            <small>Atualizado em</small>
            <strong>{formatDateTime(profile.updatedAt)}</strong>
          </div>
        </div>
      </section>

      <section className="card account-section">
        <div className="profile-section-header">
          <div>
            <h2>Meus agendamentos</h2>
            <p>
              Acompanhe suas solicitacoes, valores estimados e validacoes feitas
              pelos churrasqueiros.
            </p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="profile-empty-state">
            Voce ainda nao possui agendamentos. Explore os perfis e monte seu
            primeiro evento.
          </div>
        ) : (
          <div className="account-bookings-grid">
            {bookings.map((booking) => {
              const hasFinalPrice =
                booking.status === "APROVADO_PARA_PAGAMENTO" ||
                booking.status === "AJUSTADO_PELO_CHURRASQUEIRO";

              return (
                <article key={booking.id} className="card account-booking-card">
                  <div className="pitmaster-booking-header">
                    <div>
                      <small>Solicitacao #{booking.id}</small>
                      <h2>
                        {formatDateLabel(booking.date)} - {booking.startTime} ate{" "}
                        {booking.endTime}
                      </h2>
                    </div>
                    <span className="pitmaster-status-pill">
                      {statusLabel(booking.status)}
                    </span>
                  </div>

                  <div className="account-booking-grid">
                    <div className="pitmaster-booking-section">
                      <strong>Churrasqueiro</strong>
                      <span>{booking.churrasqueiro?.name ?? "Nao encontrado"}</span>
                      <small>{booking.churrasqueiro?.city ?? "Cidade indisponivel"}</small>
                    </div>

                    <div className="pitmaster-booking-section">
                      <strong>Valores</strong>
                      <span>Estimativa: {formatCurrency(booking.estimatedPrice)}</span>
                      <span>
                        Valor final:{" "}
                        {booking.approvedPrice != null
                          ? formatCurrency(booking.approvedPrice)
                          : "Aguardando aprovacao"}
                      </span>
                      <span>Taxa plataforma: {formatCurrency(booking.platformFeeAmount)}</span>
                    </div>

                    <div className="pitmaster-booking-section">
                      <strong>Status financeiro</strong>
                      <span>
                        Status atual: {booking.status === "PAGO" ? "Pago" : "sem cobranca online"}
                      </span>
                      <small>
                        O pagamento online foi removido desta versao.
                      </small>
                    </div>
                  </div>

                  <div className="account-booking-notes">
                    <strong>Detalhes do evento</strong>
                    <p>{booking.notes?.trim() || "Sem observacoes adicionais."}</p>
                    {booking.partnerName ? (
                      <p>
                        Parceiro vinculado: <strong>{booking.partnerName}</strong>
                      </p>
                    ) : null}
                  </div>

                  {hasFinalPrice ? (
                    <div className="profile-empty-state">
                      Valor final definido. Combine a conclusao do atendimento
                      diretamente com o churrasqueiro.
                    </div>
                  ) : (
                    <div className="profile-empty-state">
                      {booking.status === "PAGO"
                        ? "Evento marcado como concluido."
                        : "Aguardando o churrasqueiro aprovar ou ajustar o pedido."}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
