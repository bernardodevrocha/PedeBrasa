"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { readStoredAuth, type StoredAuthState } from "../../lib/auth";

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: "Descobrir", href: "/" },
  { label: "Parceiros", href: "/parceiros" },
  { label: "Blog", href: "/blog" },
  { label: "Chat", href: "/chat" },
  { label: "Indicar Amigos", href: "#" },
  { label: "Area do Churrasqueiro", href: "#" },
  { label: "Meu Perfil", href: "#" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuthState>({ token: null, email: null });

  useEffect(() => {
    setAuth(readStoredAuth());
  }, [pathname]);

  const navItems = useMemo(
    () =>
      NAV_ITEMS.map((item) => ({
        ...item,
        active:
          item.href === "#"
            ? false
            : item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href),
      })),
    [pathname],
  );

  return (
    <div className="app-shell">
      <aside className="discover-sidebar">
        <div className="discover-brand">
          <div className="discover-brand-icon">P</div>
          <div>
            <strong>PedeBrasa</strong>
            <p>Churrasqueiros Premium</p>
          </div>
        </div>

        <nav className="discover-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`discover-nav-item${item.active ? " active" : ""}`}
              onClick={() => {
                if (item.href !== "#") {
                  router.push(item.href);
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="discover-sidebar-footer">
          <div className="discover-auth-header">
            <h2>Navegacao</h2>
          </div>
          {auth.token ? (
            <p className="discover-auth-note" style={{ marginTop: 0 }}>
              Conectado como <strong>{auth.email}</strong>.
            </p>
          ) : (
            <p className="discover-auth-note" style={{ marginTop: 0 }}>
              Entre ou crie sua conta para contratar, publicar e gerenciar seu perfil.
            </p>
          )}
        </div>
      </aside>

      <div className="app-main">
        {children}
        <footer className="page-footer">
          <span>MVP - foco em UX, performance e seguranca</span>
        </footer>
      </div>
    </div>
  );
}
