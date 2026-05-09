"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  clearStoredAuth,
  EMPTY_STORED_AUTH,
  onStoredAuthChange,
  readStoredAuth,
  type StoredAuthState,
} from "../../lib/auth";
import { api } from "../../lib/api";

interface AppShellProps {
  children: ReactNode;
}

const NAV_ITEMS = [
  { label: "Descobrir", href: "/" },
  { label: "Parceiros", href: "/parceiros" },
  { label: "Blog", href: "/blog" },
  { label: "Chat", href: "/chat" },
  { label: "Indicacoes", href: "/indicacoes" },
  { label: "Area do Churrasqueiro", href: "/churrasqueiro/agendamentos" },
  { label: "Meu Perfil", href: "/meu-perfil" },
];

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuthState>(EMPTY_STORED_AUTH);
  const [authReady, setAuthReady] = useState(false);
  const [validatedToken, setValidatedToken] = useState<string | null>(null);
  const isLoginPage = pathname.startsWith("/login");

  useEffect(() => {
    const syncAuth = () => {
      const nextAuth = readStoredAuth();
      setAuth(nextAuth);
      setValidatedToken((current) =>
        current && current === nextAuth.token ? current : null,
      );
      setAuthReady(true);
    };
    syncAuth();
    return onStoredAuthChange(syncAuth);
  }, []);

  useEffect(() => {
    if (!authReady || isLoginPage) {
      return;
    }

    if (!auth.token) {
      setValidatedToken(null);
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.token, authReady, isLoginPage, pathname, router]);

  useEffect(() => {
    if (!authReady || isLoginPage || !auth.token) {
      return;
    }

    let active = true;
    api
      .getCurrentUser(auth.token)
      .then(() => {
        if (active) {
          setValidatedToken(auth.token);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setValidatedToken(null);
        clearStoredAuth();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      });

    return () => {
      active = false;
    };
  }, [auth.token, authReady, isLoginPage, pathname, router]);

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

  if (!authReady) {
    return (
      <div className="discover-loading-panel">
        <div className="spinner" />
      </div>
    );
  }

  if (isLoginPage) {
    return <main className="login-main">{children}</main>;
  }

  if (!auth.token || validatedToken !== auth.token) {
    return (
      <div className="discover-loading-panel">
        <div className="spinner" />
      </div>
    );
  }

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
            <>
              <p className="discover-auth-note" style={{ marginTop: 0 }}>
                Conectado como <strong>{auth.email}</strong>.
              </p>
              <button
                type="button"
                className="discover-sidebar-action"
                onClick={() => {
                  clearStoredAuth();
                  router.push("/login");
                  router.refresh();
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <p className="discover-auth-note" style={{ marginTop: 0 }}>
                Entre para contratar, conversar e gerenciar seu perfil.
              </p>
              <button
                type="button"
                className="discover-sidebar-action"
                onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
              >
                Entrar
              </button>
            </>
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
