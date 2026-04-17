"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import {
  api,
  getApiBaseUrl,
  type ApiError,
  type ChatConversation,
  type ChatMessage,
  type ChatParticipant,
} from "../../lib/api";
import { readStoredAuth } from "../../lib/auth";

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatConversationTime(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getSocketBaseUrl() {
  const apiBase = getApiBaseUrl();

  if (apiBase.startsWith("http://") || apiBase.startsWith("https://")) {
    return apiBase.replace(/\/api\/?$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function upsertConversation(
  conversations: ChatConversation[],
  nextConversation: ChatConversation,
) {
  const filtered = conversations.filter(
    (conversation) => conversation.id !== nextConversation.id,
  );

  return [nextConversation, ...filtered].sort((first, second) => {
    return (
      new Date(second.lastMessageAt).getTime() -
      new Date(first.lastMessageAt).getTime()
    );
  });
}

export default function ChatPage() {
  const socketRef = useRef<Socket | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ChatParticipant[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation = useMemo(
    () =>
      conversations.find(
        (conversation) => conversation.id === selectedConversationId,
      ) ?? null,
    [conversations, selectedConversationId],
  );

  useEffect(() => {
    const auth = readStoredAuth();
    setToken(auth.token);
    setEmail(auth.email);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([api.listChatContacts(token), api.listChatConversations(token)])
      .then(([nextContacts, nextConversations]) => {
        if (!active) {
          return;
        }

        setContacts(nextContacts);
        setConversations(nextConversations);

        if (nextConversations.length > 0) {
          setSelectedConversationId((current) => {
            if (current && nextConversations.some((item) => item.id === current)) {
              return current;
            }

            return nextConversations[0]?.id ?? null;
          });
        }
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        const apiErr = err as Partial<ApiError>;
        setError(apiErr.message ?? "Nao foi possivel carregar o chat.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    socket.on(
      "chat:message",
      (payload: { conversationId: number; message: ChatMessage }) => {
        setMessages((current) => {
          if (payload.conversationId !== selectedConversationId) {
            return current;
          }

          const exists = current.some((message) => message.id === payload.message.id);
          return exists ? current : [...current, payload.message];
        });

        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === payload.conversationId
              ? {
                  ...conversation,
                  lastMessage: payload.message,
                  lastMessageAt: payload.message.createdAt,
                }
              : conversation,
          ).sort((first, second) => {
            return (
              new Date(second.lastMessageAt).getTime() -
              new Date(first.lastMessageAt).getTime()
            );
          }),
        );
      },
    );

    socketRef.current = socket;

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [selectedConversationId, token]);

  useEffect(() => {
    if (!token || !selectedConversationId) {
      setMessages([]);
      return;
    }

    let active = true;
    setLoadingMessages(true);

    api
      .listChatMessages(selectedConversationId, token)
      .then((nextMessages) => {
        if (active) {
          setMessages(nextMessages);
        }
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        const apiErr = err as Partial<ApiError>;
        setError(apiErr.message ?? "Nao foi possivel carregar as mensagens.");
      })
      .finally(() => {
        if (active) {
          setLoadingMessages(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedConversationId, token]);

  async function handleOpenConversation(participant: ChatParticipant) {
    if (!token) {
      return;
    }

    setError(null);

    try {
      const conversation = await api.createChatConversation(participant.id, token);
      setConversations((current) => upsertConversation(current, conversation));
      setSelectedConversationId(conversation.id);
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      setError(apiErr.message ?? "Nao foi possivel abrir essa conversa.");
    }
  }

  async function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedConversationId || !draft.trim()) {
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await api.sendChatMessage(
        selectedConversationId,
        draft,
        token,
      );

      setDraft("");
      setMessages((current) => {
        const exists = current.some((message) => message.id === response.message.id);
        return exists ? current : [...current, response.message];
      });

      setConversations((current) =>
        current.map((conversation) =>
          conversation.id === response.conversationId
            ? {
                ...conversation,
                lastMessage: response.message,
                lastMessageAt: response.message.createdAt,
              }
            : conversation,
        ).sort((first, second) => {
          return (
            new Date(second.lastMessageAt).getTime() -
            new Date(first.lastMessageAt).getTime()
          );
        }),
      );
    } catch (err) {
      const apiErr = err as Partial<ApiError>;
      setError(apiErr.message ?? "Nao foi possivel enviar a mensagem.");
    } finally {
      setSending(false);
    }
  }

  if (!token) {
    return (
      <section className="card chat-login-card">
        <h1>Chat privado</h1>
        <p>
          Entre na plataforma para conversar com clientes e churrasqueiros em
          tempo real.
        </p>
      </section>
    );
  }

  return (
    <div className="chat-page">
      <section className="chat-header card">
        <div>
          <span className="chat-kicker">Chat seguro</span>
          <h1>Painel de conversas</h1>
          <p>
            Conversas privadas 1:1 com entrega em tempo real e acesso restrito
            apenas aos participantes.
          </p>
        </div>
        <div className="chat-header-user">
          <small>Conectado como</small>
          <strong>{email}</strong>
        </div>
      </section>

      {error && <p className="discover-auth-error">{error}</p>}

      <div className="chat-layout">
        <aside className="chat-sidebar card">
          <div className="chat-sidebar-section">
            <div className="chat-section-header">
              <h2>Conversas</h2>
              <small>{conversations.length}</small>
            </div>

            {loading && <p className="chat-muted">Carregando conversas...</p>}

            {!loading && conversations.length === 0 && (
              <p className="chat-muted">
                Nenhuma conversa iniciada ainda. Escolha um contato abaixo.
              </p>
            )}

            <div className="chat-list">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={`chat-list-item${
                    conversation.id === selectedConversationId ? " is-active" : ""
                  }`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                >
                  <div className="chat-list-item-top">
                    <strong>{conversation.participant.name}</strong>
                    <small>{formatConversationTime(conversation.lastMessageAt)}</small>
                  </div>
                  <span>
                    {conversation.lastMessage?.body ?? "Conversa criada. Envie a primeira mensagem."}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="chat-sidebar-section">
            <div className="chat-section-header">
              <h2>Contatos</h2>
              <small>{contacts.length}</small>
            </div>
            <div className="chat-list">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  className="chat-list-item chat-contact-item"
                  onClick={() => handleOpenConversation(contact)}
                >
                  <div className="chat-list-item-top">
                    <strong>{contact.name}</strong>
                    <small>{contact.role}</small>
                  </div>
                  <span>Clique para abrir uma conversa privada</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section className="chat-panel card">
          {selectedConversation ? (
            <>
              <header className="chat-panel-header">
                <div>
                  <small>Conversando com</small>
                  <h2>{selectedConversation.participant.name}</h2>
                </div>
                <span className="chat-role-pill">
                  {selectedConversation.participant.role}
                </span>
              </header>

              <div className="chat-messages">
                {loadingMessages && <p className="chat-muted">Carregando mensagens...</p>}

                {!loadingMessages && messages.length === 0 && (
                  <p className="chat-muted">
                    Essa conversa esta vazia. Comece enviando a primeira mensagem.
                  </p>
                )}

                {!loadingMessages &&
                  messages.map((message) => {
                    const isOwnMessage = message.senderId !== selectedConversation.participant.id;

                    return (
                      <article
                        key={message.id}
                        className={`chat-bubble${isOwnMessage ? " is-own" : ""}`}
                      >
                        <p>{message.body}</p>
                        <small>{formatMessageTime(message.createdAt)}</small>
                      </article>
                    );
                  })}
              </div>

              <form className="chat-compose" onSubmit={handleSendMessage}>
                <textarea
                  className="input chat-compose-input"
                  placeholder="Digite uma mensagem privada..."
                  value={draft}
                  maxLength={2000}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="submit" className="btn" disabled={sending || !draft.trim()}>
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </form>
            </>
          ) : (
            <div className="chat-empty-panel">
              <h2>Escolha uma conversa</h2>
              <p>
                Selecione uma conversa existente ou abra um novo chat pela lista
                de contatos.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
