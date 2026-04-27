"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

interface Churrasqueiro {
  id: number;
  name: string;
  city: string;
  description?: string | null;
  pricePerHour: string | number;
  rating?: string | number;
  imgChurrasqueiro?: string | null;
  slug: string;
}

function ChurrasqueiroAvatar({
  churrasqueiro,
}: {
  churrasqueiro: Churrasqueiro;
}) {
  if (churrasqueiro.imgChurrasqueiro) {
    return (
      <img
        src={churrasqueiro.imgChurrasqueiro}
        alt={`Foto de ${churrasqueiro.name}`}
        className="discover-card-image"
      />
    );
  }

  return (
    <div className="discover-card-image discover-card-image-placeholder">
      <span>{churrasqueiro.name.slice(0, 1).toUpperCase()}</span>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [churrasqueiros, setChurrasqueiros] = useState<Churrasqueiro[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalChurrasqueiros, setTotalChurrasqueiros] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingChurrasqueiros, setLoadingChurrasqueiros] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoadingChurrasqueiros(true);

    api
      .listChurrasqueirosPaginated(debouncedSearch, {
        page: currentPage,
        pageSize: 9,
      })
      .then((data) => {
        if (active) {
          setChurrasqueiros(data.items as Churrasqueiro[]);
          setTotalChurrasqueiros(data.total);
          setTotalPages(data.totalPages);
        }
      })
      .catch(() => {
        if (active) {
          setChurrasqueiros([]);
          setTotalChurrasqueiros(0);
          setTotalPages(1);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingChurrasqueiros(false);
        }
      });

    return () => {
      active = false;
    };
  }, [currentPage, debouncedSearch]);

  const heroSubtitle = useMemo(() => {
    if (loadingChurrasqueiros) {
      return "Carregando os melhores profissionais da sua regiao.";
    }

    if (churrasqueiros.length === 0) {
      return "Nenhum churrasqueiro encontrado para os filtros atuais.";
    }

    return `${totalChurrasqueiros} profissionais disponiveis para seu proximo evento.`;
  }, [churrasqueiros.length, loadingChurrasqueiros, totalChurrasqueiros]);

  return (
    <>
      <div className="discover-content">
        <div className="discover-hero">
          <div className="discover-hero-copy">
            <span className="discover-hero-kicker">Descobrir</span>
            <h1>Encontre o churrasqueiro ideal para o seu evento</h1>
            <p>{heroSubtitle}</p>
          </div>

          <div className="discover-filter-card discover-filter-card-centered">
            <label htmlFor="discover-search" className="discover-filter-label">
              Filtrar por nome ou cidade
            </label>
            <input
              id="discover-search"
              className="input discover-filter-input"
              placeholder="Ex.: Cuiaba, Ju do Churrasco..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="discover-toolbar">
          <div>
            <h2>
              {loadingChurrasqueiros
                ? "Carregando profissionais..."
                : `${totalChurrasqueiros} profissionais disponiveis`}
            </h2>
            <p>
              Pagina {currentPage} de {totalPages} - exibindo ate 10 por vez.
            </p>
          </div>
        </div>

        {loadingChurrasqueiros && (
          <div className="discover-loading-panel">
            <div className="spinner" />
          </div>
        )}

        {!loadingChurrasqueiros && churrasqueiros.length === 0 && (
          <div className="discover-empty-state">
            Nenhum churrasqueiro encontrado para essa busca.
          </div>
        )}

        {!loadingChurrasqueiros && churrasqueiros.length > 0 && (
          <div className="discover-grid">
            {churrasqueiros.map((item) => (
              <article key={item.id} className="discover-card">
                <div className="discover-card-media">
                  <ChurrasqueiroAvatar churrasqueiro={item} />
                  <span className="discover-badge premium">Premium</span>
                  <span className="discover-badge level">Senior</span>
                </div>

                <div className="discover-card-body">
                  <div className="discover-card-heading">
                    <h3>{item.name}</h3>
                    <p>{item.city}</p>
                  </div>

                  <div className="discover-card-stats">
                    <span>Nota {Number(item.rating ?? 4.9).toFixed(1)}</span>
                    <span>R$ {item.pricePerHour}/h</span>
                  </div>

                  {item.description && (
                    <p className="discover-card-description">
                      {item.description}
                    </p>
                  )}

                  <div className="discover-tag-row">
                    <span className="discover-tag">Churrasco Premium</span>
                    <span className="discover-tag">Eventos</span>
                    <span className="discover-tag">{item.city}</span>
                  </div>

                  <div className="discover-card-footer">
                    <div>
                      <small>A partir de</small>
                      <strong>R$ {item.pricePerHour}</strong>
                    </div>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => router.push(`/perfil/${item.slug}`)}
                    >
                      Ver Perfil
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loadingChurrasqueiros && totalChurrasqueiros > 10 && (
          <div className="discover-toolbar" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="discover-toolbar-pill"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              Anterior
            </button>
            <span>
              Pagina {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              className="discover-toolbar-pill"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
            >
              Proxima
            </button>
          </div>
        )}
      </div>
    </>
  );
}
