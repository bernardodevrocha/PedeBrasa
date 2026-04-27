"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookingModal } from "../../../features/profile/components/BookingModal";
import {
  DEFAULT_GUEST_COUNT,
  type ProfileTab,
} from "../../../features/profile/constants";
import {
  buildCalendarDays,
  calculateEstimatedTotalPrice,
  formatCurrency,
  formatDateLabel,
} from "../../../features/profile/utils";
import { api } from "../../../lib/api";
import { EMPTY_AUTH_STATE, type AuthState } from "../../../models/auth";
import type {
  BookingResponse,
  ChurrasqueiroProfile,
  PaymentResponse,
} from "../../../models/api";

interface BookingFormState {
  date: string;
  startTime: string;
  endTime: string;
  partnerId: string;
  partnerCouponCode: string;
  guestCount: string;
  selectedCuts: string[];
  notes: string;
  paymentToken: string;
}

const INITIAL_BOOKING_FORM: BookingFormState = {
  date: "",
  startTime: "11:00",
  endTime: "16:00",
  partnerId: "",
  partnerCouponCode: "",
  guestCount: String(DEFAULT_GUEST_COUNT),
  selectedCuts: ["Picanha", "Linguica artesanal"],
  notes: "",
  paymentToken: "",
};

export default function PerfilChurrasqueiroPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";

  const [profile, setProfile] = useState<ChurrasqueiroProfile | null>(null);
  const [auth, setAuth] = useState<AuthState>(EMPTY_AUTH_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("agenda");
  const [calendarDays, setCalendarDays] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
  const [form, setForm] = useState<BookingFormState>(INITIAL_BOOKING_FORM);

  useEffect(() => {
    const stored = window.localStorage.getItem("pedebrasa_auth");
    if (!stored) return;

    try {
      setAuth(JSON.parse(stored) as AuthState);
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    setCalendarDays(buildCalendarDays());
  }, []);

  useEffect(() => {
    if (!slug) return;

    let active = true;
    setLoading(true);
    setError(null);

    api
      .getChurrasqueiroProfile(slug)
      .then((data) => {
        if (!active) return;

        const nextCalendarDays = buildCalendarDays();
        const firstAvailableDate = nextCalendarDays.find(
          (date) => !data.unavailableDates.includes(date),
        );

        setCalendarDays(nextCalendarDays);
        setProfile(data);
        setSelectedDate(firstAvailableDate ?? "");
        setForm((prev) => ({
          ...prev,
          date: firstAvailableDate ?? "",
          partnerId: data.parceiros[0] ? String(data.parceiros[0].id) : "",
          partnerCouponCode: "",
        }));
      })
      .catch((err) => {
        if (!active) return;
        const maybeError = err as { message?: string };
        setError(
          maybeError.message ?? "Nao foi possivel carregar este perfil agora.",
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
  }, [slug]);

  const unavailableDates = useMemo(
    () => new Set(profile?.unavailableDates ?? []),
    [profile?.unavailableDates],
  );
  const availableDates = useMemo(
    () => calendarDays.filter((date) => !unavailableDates.has(date)),
    [calendarDays, unavailableDates],
  );
  const selectedPartner = useMemo(
    () =>
      profile?.parceiros.find((item) => String(item.id) === form.partnerId) ?? null,
    [form.partnerId, profile?.parceiros],
  );
  const estimatedPricing = useMemo(
    () =>
      calculateEstimatedTotalPrice(
        profile?.pricePerHour ?? 0,
        form.startTime,
        form.endTime,
        Number(form.guestCount),
        form.selectedCuts,
      ),
    [form.endTime, form.guestCount, form.selectedCuts, form.startTime, profile?.pricePerHour],
  );

  function resetBookingFlow(nextDate = selectedDate) {
    setBookingError(null);
    setPaymentError(null);
    setBookingResult(null);
    setPaymentResult(null);
    setForm((prev) => ({
      ...prev,
      date: nextDate,
      paymentToken: "",
    }));
  }

  function openBookingModal() {
    resetBookingFlow();
    setIsBookingModalOpen(true);
  }

  function closeBookingModal() {
    resetBookingFlow();
    setIsBookingModalOpen(false);
  }

  async function handleCreateBooking(event: React.FormEvent) {
    event.preventDefault();
    setBookingError(null);
    setPaymentError(null);

    if (!profile) return;

    if (!auth.token) {
      setBookingError("Entre na plataforma antes de confirmar o agendamento.");
      return;
    }

    if (!form.date || !form.startTime || !form.endTime) {
      setBookingError("Selecione data e horarios validos para seguir.");
      return;
    }

    const guestCount = Number(form.guestCount);
    if (!Number.isInteger(guestCount) || guestCount <= 0) {
      setBookingError("Informe uma quantidade valida de convidados.");
      return;
    }

    setSubmittingBooking(true);
    try {
      const booking = await api.createBooking(
        {
          churrasqueiroId: profile.id,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          partnerId: form.partnerId ? Number(form.partnerId) : null,
          partnerCouponCode: form.partnerId ? form.partnerCouponCode : undefined,
          guestCount,
          selectedCuts: form.selectedCuts,
          notes: form.notes.trim(),
        },
        auth.token,
      );

      setBookingResult(booking);
    } catch (err) {
      const maybeError = err as { message?: string };
      setBookingError(
        maybeError.message ?? "Nao foi possivel criar o agendamento agora.",
      );
    } finally {
      setSubmittingBooking(false);
    }
  }

  async function handlePayment(event: React.FormEvent) {
    event.preventDefault();
    setPaymentError(null);

    if (!auth.token || !bookingResult) {
      setPaymentError("Crie o agendamento antes de tentar pagar.");
      return;
    }

    if (!form.paymentToken.trim()) {
      setPaymentError("Informe o token/metodo de pagamento gerado pelo Stripe.");
      return;
    }

    setProcessingPayment(true);
    try {
      const payment = await api.payBooking(
        bookingResult.id,
        { token: form.paymentToken.trim() },
        auth.token,
      );

      setPaymentResult(payment);
    } catch (err) {
      const maybeError = err as { message?: string };
      setPaymentError(
        maybeError.message ?? "Nao foi possivel processar o pagamento agora.",
      );
    } finally {
      setProcessingPayment(false);
    }
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
        <h1>Perfil indisponivel</h1>
        <p>{error ?? "Nao encontramos este churrasqueiro."}</p>
        <Link href="/" className="btn">
          Voltar para descobrir
        </Link>
      </section>
    );
  }

  return (
    <>
      <div className="profile-shell">
        <section className="profile-hero">
          <div className="profile-hero-media">
            {profile.imgChurrasqueiro ? (
              <img
                src={profile.imgChurrasqueiro}
                alt={`Foto de ${profile.name}`}
                className="profile-image"
              />
            ) : (
              <div className="profile-image profile-image-placeholder">
                <span>{profile.name.slice(0, 1).toUpperCase()}</span>
              </div>
            )}
          </div>

          <div className="profile-hero-content">
            <span className="discover-hero-kicker">Perfil do churrasqueiro</span>
            <h1>{profile.name}</h1>

            <div className="profile-detail-list">
              <div className="profile-detail-card">
                <small>Como e conhecido</small>
                <strong>{profile.knownAs}</strong>
              </div>
              <div className="profile-detail-card">
                <small>Preco medio</small>
                <strong>{formatCurrency(profile.pricePerHour)}/h</strong>
              </div>
            </div>

            <div className="profile-section">
              <h2>Descricao</h2>
              <p>
                {profile.description?.trim() ||
                  "Este churrasqueiro ainda nao cadastrou uma descricao."}
              </p>
            </div>
          </div>
        </section>

        <section className="card profile-booking-highlight">
          <div>
            <span className="profile-tab-kicker">Agendamento do evento</span>
            <h2>Monte sua solicitacao e aguarde a aprovacao do churrasqueiro</h2>
            <p>
              O fluxo comeca pela estimativa automatica, passa pela validacao do
              churrasqueiro e so depois libera o pagamento do valor final.
            </p>
          </div>

          <div className="profile-booking-highlight-actions">
            <button type="button" className="btn" onClick={openBookingModal}>
              Abrir agenda
            </button>
          </div>
        </section>

        <section className="profile-tabs card">
          <div className="profile-tabs-header">
            <button
              type="button"
              className={`profile-tab-button${
                activeTab === "agenda" ? " is-active" : ""
              }`}
              onClick={() => setActiveTab("agenda")}
            >
              Agenda
            </button>
            <button
              type="button"
              className={`profile-tab-button${
                activeTab === "parceiros" ? " is-active" : ""
              }`}
              onClick={() => setActiveTab("parceiros")}
            >
              Parceiros
            </button>
          </div>

          {activeTab === "agenda" ? (
            <div className="profile-tab-panel">
              <div className="profile-section-header">
                <div>
                  <h2>Agenda</h2>
                  <p>
                    O calendario abaixo mostra o horizonte dos proximos 180 dias.
                    Clique no botao para abrir o pop-up de agendamento.
                  </p>
                </div>
                <button type="button" className="btn" onClick={openBookingModal}>
                  Agendar evento
                </button>
              </div>

              <div className="profile-calendar-grid">
                {calendarDays.map((date) => {
                  const disabled = unavailableDates.has(date);
                  const selected = selectedDate === date;

                  return (
                    <button
                      key={date}
                      type="button"
                      className={`profile-calendar-day${
                        disabled ? " is-disabled" : ""
                      }${selected ? " is-selected" : ""}`}
                      onClick={() => {
                        if (!disabled) {
                          setSelectedDate(date);
                          setForm((prev) => ({ ...prev, date }));
                        }
                      }}
                      disabled={disabled}
                    >
                      <span>{formatDateLabel(date)}</span>
                      <small>{disabled ? "Ocupado" : "Livre"}</small>
                    </button>
                  );
                })}
              </div>

              <div className="profile-calendar-summary">
                {selectedDate ? (
                  <p>
                    Data selecionada: <strong>{formatDateLabel(selectedDate)}</strong>
                  </p>
                ) : (
                  <p>Nao ha datas livres neste periodo exibido.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="profile-tab-panel">
              <div className="profile-section-header">
                <div>
                  <h2>Parceiros</h2>
                  <p>
                    Empresas recomendadas e vinculadas a este perfil para compor o
                    evento.
                  </p>
                </div>
              </div>

              {profile.parceiros.length === 0 ? (
                <div className="profile-empty-state">
                  Nenhum parceiro vinculado no momento.
                </div>
              ) : (
                <div className="profile-partners-list">
                  {profile.parceiros.map((parceiro) => (
                    <article key={parceiro.id} className="profile-partner-card">
                      <strong>{parceiro.name}</strong>
                      <span>{parceiro.category}</span>
                      <span>{parceiro.city}</span>
                      <small>Cupom: {parceiro.couponCode}</small>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {isBookingModalOpen && (
        <BookingModal
          authToken={auth.token}
          availableDates={availableDates}
          bookingError={bookingError}
          bookingResult={bookingResult}
          estimatedPlatformFee={estimatedPricing.platformFeeAmount}
          estimatedServiceAmount={estimatedPricing.serviceAmount}
          estimatedTotalPrice={estimatedPricing.totalPrice}
          form={form}
          onChange={setForm}
          onClose={closeBookingModal}
          onCreateBooking={handleCreateBooking}
          onPayBooking={handlePayment}
          paymentError={paymentError}
          paymentResult={paymentResult}
          processingPayment={processingPayment}
          profile={profile}
          selectedPartner={selectedPartner}
          submittingBooking={submittingBooking}
        />
      )}
    </>
  );
}
