"use client";

import type { FormEvent } from "react";
import type {
  BookingResponse,
  ChurrasqueiroProfile,
  ChurrasqueiroProfileParceiro,
  PaymentResponse,
} from "../../../models/api";
import { CUT_OPTIONS } from "../constants";
import { PLATFORM_FEE_RATE, formatCurrency, formatDateLabel } from "../utils";

interface BookingFormState {
  date: string;
  startTime: string;
  endTime: string;
  partnerId: string;
  partnerCouponCode: string;
  selectedCuts: string[];
  notes: string;
  paymentToken: string;
}

interface BookingModalProps {
  authToken: string | null;
  availableDates: string[];
  bookingError: string | null;
  bookingResult: BookingResponse | null;
  estimatedPlatformFee: number;
  estimatedServiceAmount: number;
  estimatedTotalPrice: number;
  form: BookingFormState;
  onChange: (next: BookingFormState) => void;
  onClose: () => void;
  onCreateBooking: (event: FormEvent) => void;
  onPayBooking: (event: FormEvent) => void;
  paymentError: string | null;
  paymentResult: PaymentResponse | null;
  processingPayment: boolean;
  profile: ChurrasqueiroProfile;
  selectedPartner: ChurrasqueiroProfileParceiro | null;
  submittingBooking: boolean;
}

export function BookingModal({
  authToken,
  availableDates,
  bookingError,
  bookingResult,
  estimatedPlatformFee,
  estimatedServiceAmount,
  estimatedTotalPrice,
  form,
  onChange,
  onClose,
  onCreateBooking,
  onPayBooking,
  paymentError,
  paymentResult,
  processingPayment,
  profile,
  selectedPartner,
  submittingBooking,
}: BookingModalProps) {
  function updateField<K extends keyof BookingFormState>(
    field: K,
    value: BookingFormState[K],
  ) {
    onChange({
      ...form,
      [field]: value,
    });
  }

  function toggleCut(cut: string) {
    const selectedCuts = form.selectedCuts.includes(cut)
      ? form.selectedCuts.filter((item) => item !== cut)
      : [...form.selectedCuts, cut];

    onChange({
      ...form,
      selectedCuts,
    });
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className="modal profile-booking-modal">
        <div className="modal-header">
          <div>
            <span className="profile-tab-kicker">Agenda</span>
            <h2>Agendar com {profile.name}</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="profile-booking-modal-body">
          <form className="profile-booking-form" onSubmit={onCreateBooking}>
            <div className="profile-booking-block">
              <h3>1. Escolha a data</h3>
              <div className="profile-booking-days">
                {availableDates.slice(0, 12).map((date) => (
                  <button
                    key={date}
                    type="button"
                    className={`profile-booking-day${
                      form.date === date ? " is-selected" : ""
                    }`}
                    onClick={() => updateField("date", date)}
                  >
                    {formatDateLabel(date)}
                  </button>
                ))}
              </div>
            </div>

            <div className="profile-booking-block">
              <h3>2. Horario do evento</h3>
              <div className="profile-booking-inline-grid">
                <label className="profile-field">
                  <span>Inicio</span>
                  <input
                    type="time"
                    className="input"
                    value={form.startTime}
                    onChange={(event) => updateField("startTime", event.target.value)}
                  />
                </label>
                <label className="profile-field">
                  <span>Fim</span>
                  <input
                    type="time"
                    className="input"
                    value={form.endTime}
                    onChange={(event) => updateField("endTime", event.target.value)}
                  />
                </label>
              </div>
            </div>

            <div className="profile-booking-block">
              <h3>3. Parceiro e codigo</h3>
              <label className="profile-field">
                <span>Parceiro</span>
                <select
                  className="input"
                  value={form.partnerId}
                  onChange={(event) => updateField("partnerId", event.target.value)}
                >
                  <option value="">Sem parceiro</option>
                  {profile.parceiros.map((parceiro) => (
                    <option key={parceiro.id} value={parceiro.id}>
                      {parceiro.name} - {parceiro.category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="profile-field">
                <span>Codigo do parceiro</span>
                <input
                  className="input"
                  placeholder={
                    selectedPartner
                      ? `Ex.: ${selectedPartner.couponCode}`
                      : "Preencha somente se escolher parceiro"
                  }
                  value={form.partnerCouponCode}
                  onChange={(event) =>
                    updateField("partnerCouponCode", event.target.value.toUpperCase())
                  }
                />
              </label>
            </div>

            <div className="profile-booking-block">
              <h3>4. Cortes e detalhes</h3>
              <div className="profile-cut-grid">
                {CUT_OPTIONS.map((cut) => {
                  const selected = form.selectedCuts.includes(cut);
                  return (
                    <button
                      key={cut}
                      type="button"
                      className={`profile-cut-chip${selected ? " is-selected" : ""}`}
                      onClick={() => toggleCut(cut)}
                    >
                      {cut}
                    </button>
                  );
                })}
              </div>

              <label className="profile-field">
                <span>Observacoes do evento</span>
                <textarea
                  className="input profile-textarea"
                  placeholder="Endereco, quantidade estimada de convidados, estrutura do local e observacoes extras."
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </label>
            </div>

                <div className="profile-booking-summary">
                  <div>
                    <small>Servico estimado</small>
                    <strong>{formatCurrency(estimatedServiceAmount)}</strong>
                  </div>
                  <p>
                    Taxa da plataforma ({PLATFORM_FEE_RATE * 100}%):{" "}
                    <strong>{formatCurrency(estimatedPlatformFee)}</strong>
                  </p>
                  <p>
                    Total estimado para checkout:{" "}
                    <strong>{formatCurrency(estimatedTotalPrice)}</strong>
                  </p>
                </div>

            {bookingError && <p className="discover-auth-error">{bookingError}</p>}

            <button className="btn" type="submit" disabled={submittingBooking}>
              {submittingBooking ? "Criando agendamento..." : "Criar agendamento"}
            </button>
          </form>

          <div className="profile-booking-payment">
            <div className="profile-booking-block">
              <h3>5. Pagamento</h3>
              <p className="profile-payment-copy">
                Depois de criar a solicitacao, o churrasqueiro precisa aprovar ou
                ajustar o valor final. O pagamento so fica liberado depois dessa
                analise.
              </p>
            </div>

            {bookingResult ? (
              <>
                <div className="profile-payment-card">
                  <small>Solicitacao criada</small>
                  <strong>#{bookingResult.id}</strong>
                  <span>
                    {formatDateLabel(bookingResult.date)} · {bookingResult.startTime} ate{" "}
                    {bookingResult.endTime}
                  </span>
                  <span>Servico: {formatCurrency(bookingResult.serviceAmount)}</span>
                  <span>
                    Taxa da plataforma: {formatCurrency(bookingResult.platformFeeAmount)}
                  </span>
                  <span>Estimativa: {formatCurrency(bookingResult.estimatedPrice)}</span>
                  <span>Status: {bookingResult.status}</span>
                  {bookingResult.approvedPrice != null ? (
                    <span>
                      Valor final: {formatCurrency(bookingResult.approvedPrice)}
                    </span>
                  ) : null}
                </div>

                {bookingResult.status === "APROVADO_PARA_PAGAMENTO" ||
                bookingResult.status === "AJUSTADO_PELO_CHURRASQUEIRO" ? (
                  <form className="profile-payment-form" onSubmit={onPayBooking}>
                    <label className="profile-field">
                      <span>Token / PaymentMethod do Stripe</span>
                      <input
                        className="input"
                        placeholder="Ex.: pm_123456789"
                        value={form.paymentToken}
                        onChange={(event) =>
                          updateField("paymentToken", event.target.value)
                        }
                      />
                    </label>

                    {paymentError && (
                      <p className="discover-auth-error">{paymentError}</p>
                    )}

                    <button
                      className="btn"
                      type="submit"
                      disabled={processingPayment}
                    >
                      {processingPayment ? "Processando..." : "Confirmar pagamento"}
                    </button>
                  </form>
                ) : (
                  <div className="profile-empty-state">
                    Aguardando o churrasqueiro validar a estimativa antes de
                    liberar o pagamento.
                  </div>
                )}
              </>
            ) : (
              <div className="profile-empty-state">
                Crie a solicitacao primeiro para enviar a estimativa ao
                churrasqueiro.
              </div>
            )}

            {paymentResult && (
              <div className="profile-payment-success">
                <small>Status do gateway</small>
                <strong>{paymentResult.status ?? paymentResult.payment.status}</strong>
                <p>
                  Pagamento registrado com valor de{" "}
                  <strong>{formatCurrency(paymentResult.payment.amount)}</strong>.
                </p>
              </div>
            )}

            {!authToken && (
              <div className="profile-payment-warning">
                Entre na plataforma na pagina inicial para concluir agendamento e
                pagamento.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
