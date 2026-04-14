"use client";

import { useEffect, useMemo, useState } from "react";
import {
  api,
  type ApiError,
  type BlogBlock,
  type BlogPost,
  type ChurrasqueiroSummary,
} from "../../lib/api";

interface AuthState {
  token: string | null;
  email: string | null;
}

interface EditorState {
  id: number | null;
  title: string;
  subtitle: string;
  contentBlocks: BlogBlock[];
}

function getEmptyEditor(): EditorState {
  return {
    id: null,
    title: "",
    subtitle: "",
    contentBlocks: [{ type: "text", text: "" }],
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function BlogPage() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<EditorState>(getEmptyEditor());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentChurrasqueiro, setCurrentChurrasqueiro] =
    useState<ChurrasqueiroSummary | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("pedebrasa_auth");
    if (!stored) {
      setAuth({ token: null, email: null });
      return;
    }

    try {
      const parsed = JSON.parse(stored) as AuthState;
      setAuth(parsed);
    } catch {
      setAuth({ token: null, email: null });
    }
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .listBlogPosts(search)
      .then((data) => {
        if (active) {
          setPosts(data);
        }
      })
      .catch(() => {
        if (active) {
          setPosts([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [search]);

  useEffect(() => {
    if (!auth?.token) {
      setCurrentChurrasqueiro(null);
      return;
    }

    let active = true;
    setProfileLoading(true);

    api
      .getMyChurrasqueiro(auth.token)
      .then((data) => {
        if (active) {
          setCurrentChurrasqueiro(data);
        }
      })
      .catch(() => {
        if (active) {
          setCurrentChurrasqueiro(null);
        }
      })
      .finally(() => {
        if (active) {
          setProfileLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [auth?.token]);

  const canPublish = Boolean(auth?.token && currentChurrasqueiro);

  const myPosts = useMemo(() => {
    if (!currentChurrasqueiro) return [];
    return posts.filter((post) => post.author?.id === currentChurrasqueiro.id);
  }, [currentChurrasqueiro, posts]);

  function setBlock(
    index: number,
    patch: Partial<BlogBlock>,
  ) {
    setEditor((prev) => ({
      ...prev,
      contentBlocks: prev.contentBlocks.map((block, blockIndex) =>
        blockIndex === index ? { ...block, ...patch } : block,
      ),
    }));
  }

  function addBlock(type: BlogBlock["type"], index?: number) {
    const newBlock: BlogBlock =
      type === "text" ? { type: "text", text: "" } : { type: "image", imageUrl: "", caption: "" };

    setEditor((prev) => {
      const nextBlocks = [...prev.contentBlocks];
      if (typeof index === "number") {
        nextBlocks.splice(index, 0, newBlock);
      } else {
        nextBlocks.push(newBlock);
      }
      return {
        ...prev,
        contentBlocks: nextBlocks,
      };
    });
  }

  function removeBlock(index: number) {
    setEditor((prev) => {
      const nextBlocks = prev.contentBlocks.filter((_, blockIndex) => blockIndex !== index);
      return {
        ...prev,
        contentBlocks: nextBlocks.length > 0 ? nextBlocks : [{ type: "text", text: "" }],
      };
    });
  }

  function moveBlock(index: number, direction: -1 | 1) {
    setEditor((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.contentBlocks.length) {
        return prev;
      }

      const nextBlocks = [...prev.contentBlocks];
      const current = nextBlocks[index];
      nextBlocks[index] = nextBlocks[targetIndex];
      nextBlocks[targetIndex] = current;

      return {
        ...prev,
        contentBlocks: nextBlocks,
      };
    });
  }

  function loadPostIntoEditor(post: BlogPost) {
    setEditor({
      id: post.id,
      title: post.title,
      subtitle: post.subtitle ?? "",
      contentBlocks: post.contentBlocks.length
        ? post.contentBlocks
        : [{ type: "text", text: "" }],
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetEditor() {
    setEditor(getEmptyEditor());
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (!auth?.token) {
      setError("Voce precisa estar autenticado.");
      return;
    }

    if (!canPublish) {
      setError("Apenas churrasqueiros podem publicar no blog.");
      return;
    }

    if (!editor.title.trim()) {
      setError("Informe um titulo para a postagem.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editor.id) {
        await api.updateBlogPost(
          editor.id,
          {
            title: editor.title,
            subtitle: editor.subtitle || null,
            contentBlocks: editor.contentBlocks,
          },
          auth.token,
        );
      } else {
        await api.createBlogPost(
          {
            title: editor.title,
            subtitle: editor.subtitle || undefined,
            contentBlocks: editor.contentBlocks,
          },
          auth.token,
        );
      }

      const updated = await api.listBlogPosts(search);
      setPosts(updated);
      resetEditor();
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      setError(apiErr.message ?? "Nao foi possivel salvar a postagem.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="blog-shell">
      <section className="blog-hero card">
        <div>
          <span className="discover-hero-kicker">Blog</span>
          <h1 style={{ marginBottom: "0.5rem" }}>Bastidores dos churrascos</h1>
          <p style={{ margin: 0, color: "#94a3b8" }}>
            Publicacoes feitas pelos proprios churrasqueiros com historias,
            fotos e experiencias de cada evento.
          </p>
        </div>
        <div className="blog-search-box">
          <input
            className="input"
            placeholder="Buscar por titulo ou subtitulo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </section>

      <div className="blog-content-grid">
        <aside className="blog-editor-panel card">
          <div className="blog-editor-header">
            <div>
              <h2>{editor.id ? "Editar postagem" : "Nova postagem"}</h2>
              <p>
                Editor em blocos: adicione texto e imagem e reorganize como quiser.
              </p>
            </div>
            {editor.id && (
              <button type="button" className="discover-toolbar-pill" onClick={resetEditor}>
                Nova postagem
              </button>
            )}
          </div>

          {profileLoading && <p>Carregando seu perfil de churrasqueiro...</p>}

          {!profileLoading && !canPublish && (
            <div className="blog-editor-locked">
              Apenas usuarios com perfil de churrasqueiro podem publicar.
            </div>
          )}

          {!profileLoading && canPublish && (
            <form onSubmit={handleSave} className="blog-editor-form">
              <input
                className="input"
                placeholder="Titulo da postagem"
                value={editor.title}
                onChange={(e) =>
                  setEditor((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
              <input
                className="input"
                placeholder="Subtitulo opcional"
                value={editor.subtitle}
                onChange={(e) =>
                  setEditor((prev) => ({ ...prev, subtitle: e.target.value }))
                }
              />

              <div className="blog-editor-block-actions">
                <button
                  type="button"
                  className="discover-toolbar-pill active"
                  onClick={() => addBlock("text")}
                >
                  + Texto
                </button>
                <button
                  type="button"
                  className="discover-toolbar-pill"
                  onClick={() => addBlock("image")}
                >
                  + Imagem
                </button>
              </div>

              <div className="blog-block-list">
                {editor.contentBlocks.map((block, index) => (
                  <div key={`${block.type}-${index}`} className="blog-block-editor">
                    <div className="blog-block-toolbar">
                      <span>
                        {block.type === "text"
                          ? `Bloco de texto ${index + 1}`
                          : `Bloco de imagem ${index + 1}`}
                      </span>
                      <div className="blog-block-toolbar-actions">
                        <button
                          type="button"
                          className="discover-toolbar-pill"
                          onClick={() => moveBlock(index, -1)}
                        >
                          Subir
                        </button>
                        <button
                          type="button"
                          className="discover-toolbar-pill"
                          onClick={() => moveBlock(index, 1)}
                        >
                          Descer
                        </button>
                        <button
                          type="button"
                          className="discover-toolbar-pill"
                          onClick={() => removeBlock(index)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>

                    {block.type === "text" ? (
                      <textarea
                        className="input blog-textarea"
                        placeholder="Escreva o conteudo deste bloco..."
                        value={block.text ?? ""}
                        onChange={(e) =>
                          setBlock(index, { text: e.target.value })
                        }
                      />
                    ) : (
                      <div className="blog-image-editor-fields">
                        <input
                          className="input"
                          placeholder="URL da imagem"
                          value={block.imageUrl ?? ""}
                          onChange={(e) =>
                            setBlock(index, { imageUrl: e.target.value })
                          }
                        />
                        <input
                          className="input"
                          placeholder="Legenda opcional"
                          value={block.caption ?? ""}
                          onChange={(e) =>
                            setBlock(index, { caption: e.target.value })
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {error && <p className="discover-auth-error">{error}</p>}

              <button className="btn" type="submit" disabled={saving}>
                {saving
                  ? "Salvando..."
                  : editor.id
                    ? "Atualizar postagem"
                    : "Publicar postagem"}
              </button>
            </form>
          )}

          {canPublish && myPosts.length > 0 && (
            <div className="blog-my-posts">
              <h3>Suas postagens</h3>
              <div className="recommendations-grid">
                {myPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    className="recommendation-chip static"
                    onClick={() => loadPostIntoEditor(post)}
                  >
                    {post.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <section className="blog-feed">
          {loading && (
            <div className="discover-loading-panel">
              <div className="spinner" />
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="discover-empty-state">
              Nenhuma postagem encontrada no blog.
            </div>
          )}

          {!loading &&
            posts.map((post) => (
              <article key={post.id} className="blog-post-card card">
                <div className="blog-post-header">
                  <div>
                    <h2>{post.title}</h2>
                    {post.subtitle && <p>{post.subtitle}</p>}
                  </div>
                  <div className="blog-post-meta">
                    <span>{post.author?.name ?? "Churrasqueiro"}</span>
                    <small>
                      {post.author?.city ?? "Cidade"} • atualizado em{" "}
                      {formatDate(post.updatedAt)}
                    </small>
                  </div>
                </div>

                <div className="blog-post-blocks">
                  {post.contentBlocks.map((block, index) =>
                    block.type === "text" ? (
                      <p key={`${post.id}-text-${index}`} className="blog-post-text">
                        {block.text}
                      </p>
                    ) : (
                      <figure key={`${post.id}-img-${index}`} className="blog-post-image-block">
                        <img src={block.imageUrl} alt={block.caption || post.title} />
                        {block.caption && <figcaption>{block.caption}</figcaption>}
                      </figure>
                    ),
                  )}
                </div>

                {canPublish && post.author?.id === currentChurrasqueiro?.id && (
                  <div className="blog-post-actions">
                    <button
                      type="button"
                      className="btn"
                      onClick={() => loadPostIntoEditor(post)}
                    >
                      Editar postagem
                    </button>
                  </div>
                )}
              </article>
            ))}
        </section>
      </div>
    </div>
  );
}
