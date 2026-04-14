import "../styles/globals.css";
import type { ReactNode } from "react";
import AppShell from "./components/AppShell";

export const metadata = {
  title: "Pe de Brasa",
  description: "MVP de agendamento de churrasqueiros",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
