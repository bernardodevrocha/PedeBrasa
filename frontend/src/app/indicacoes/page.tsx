"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { readStoredAuth } from "../../lib/auth";

function buildReferralCode(email?: string | null) {
  const source = email?.trim().toUpperCase() || "PEDEBRASA";
  const cleaned = source.replace(/[^A-Z0-9]/g, "");
  return `BRASA-${(cleaned || "AMIGO").slice(0, 8)}`;
}

export default function IndicacoesPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const auth = readStoredAuth();
    setEmail(auth.email);
    setOrigin(window.location.origin);
  }, []);

  const referralCode = useMemo(() => buildReferralCode(email), [email]);
  const referralLink = `${origin || "http://localhost:3000"}/login?indicacao=${encodeURIComponent(
    referralCode,
  )}`;
  const shareText = `Use meu codigo ${referralCode} no PedeBrasa para encontrar churrasqueiros premium.`;

  async function copyReferralLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="referrals-shell">
      <section className="card referrals-hero">
        <div>
          <span className="discover-hero-kicker">Indicacoes</span>
          <h1>Convide amigos para planejar o proximo churrasco</h1>
          <p>
            Compartilhe seu codigo ou link com quem precisa encontrar um
            churrasqueiro. O convite leva a pessoa direto para a entrada da
            plataforma.
          </p>
        </div>
        <div className="referrals-code-card">
          <small>Seu codigo</small>
          <strong>{referralCode}</strong>
          <button type="button" className="btn" onClick={copyReferralLink}>
            {copied ? "Link copiado" : "Copiar link"}
          </button>
        </div>
      </section>

      <section className="card referrals-section">
        <div className="profile-section-header">
          <div>
            <h2>Compartilhar convite</h2>
            <p>Escolha um canal ou envie o link manualmente.</p>
          </div>
        </div>

        <div className="referrals-link-box">
          <span>{referralLink}</span>
        </div>

        <div className="referrals-actions">
          <a
            className="btn"
            href={`https://wa.me/?text=${encodeURIComponent(
              `${shareText} ${referralLink}`,
            )}`}
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp
          </a>
          <a
            className="btn"
            href={`mailto:?subject=${encodeURIComponent(
              "Indicacao PedeBrasa",
            )}&body=${encodeURIComponent(`${shareText}\n\n${referralLink}`)}`}
          >
            E-mail
          </a>
          <Link className="btn" href="/">
            Ver churrasqueiros
          </Link>
        </div>
      </section>

      <section className="referrals-steps">
        <article className="referrals-step-card">
          <small>1</small>
          <strong>Compartilhe</strong>
          <p>Envie o link para amigos, familia ou empresas que fazem eventos.</p>
        </article>
        <article className="referrals-step-card">
          <small>2</small>
          <strong>A pessoa entra</strong>
          <p>O convite abre a tela de login com seu codigo na URL.</p>
        </article>
        <article className="referrals-step-card">
          <small>3</small>
          <strong>Ela agenda</strong>
          <p>Depois do cadastro, ela pode escolher um churrasqueiro e solicitar data.</p>
        </article>
      </section>
    </div>
  );
}
