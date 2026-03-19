import "../styles/globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Pé de Brasa",
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
            <div className="container" style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Pé de Brasa
                </span>
              </div>
            </div>
          </header>
          <main className="page-main">
            <div className="container">{children}</div>
          </main>
          <footer className="page-footer">
            <span>MVP • foco em UX, performance e segurança</span>
          </footer>
        </div>
      </body>
    </html>
  );
}

