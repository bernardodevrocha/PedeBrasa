import "../styles/globals.css";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata = {
  title: "Pe de Brasa",
  description: "MVP de agendamento de churrasqueiros",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="page-shell">
          <header
            style={{
              borderBottom: "1px solid #1f2937",
              padding: "0.75rem 1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "sticky",
              top: 0,
              zIndex: 10,
              background:
                "linear-gradient(to right, rgba(15,23,42,0.98), rgba(15,23,42,0.98))",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="container"
              style={{
                display: "flex",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <Link
                  href="/"
                  style={{
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Pe de Brasa
                </Link>
              </div>
              <nav
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <Link href="/menu" className="header-link">
                  Menu
                </Link>
                <Link href="/parceiros" className="header-link">
                  Parceiros
                </Link>
              </nav>
            </div>
          </header>
          <main className="page-main">
            <div className="container">{children}</div>
          </main>
          <footer className="page-footer">
            <span>MVP - foco em UX, performance e seguranca</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
