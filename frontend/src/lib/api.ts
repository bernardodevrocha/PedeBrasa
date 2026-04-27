import type {
  ApiError,
  AuthResponse,
  BlogBlock,
  BlogPost,
  BookingResponse,
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChurrasqueiroBookingResponse,
  ChurrasqueiroProfile,
  ChurrasqueiroSummary,
  CurrentUserProfile,
  CreateBlogPostPayload,
  CreateBookingPayload,
  CreateChurrasqueiroPayload,
  CreateParceiroPayload,
  LoginPayload,
  MyBookingResponse,
  Parceiro,
  PaginatedChurrasqueirosResponse,
  PaymentResponse,
  PayBookingPayload,
  ReviewBookingPayload,
  RegisterPayload,
  UpdateBlogPostPayload,
} from "../models/api";

export type {
  ApiError,
  BlogBlock,
  BlogPost,
  BookingResponse,
  ChatConversation,
  ChatMessage,
  ChatParticipant,
  ChurrasqueiroBookingResponse,
  ChurrasqueiroProfile,
  ChurrasqueiroSummary,
  CurrentUserProfile,
  MyBookingResponse,
  PaginatedChurrasqueirosResponse,
  Parceiro,
  PaymentResponse,
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export function getApiBaseUrl() {
  return API_BASE;
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = "Erro ao comunicar com o servidor";
    try {
      const data = await res.json();
      if (typeof data?.message === "string") {
        message = data.message;
      }
    } catch {
      // ignore
    }
    const error: ApiError = { message, status: res.status };
    throw error;
  }

  return (await res.json()) as T;
}

export function authHeaders(token?: string): HeadersInit {
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

export const api = {
  async register(payload: RegisterPayload) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel conectar ao servidor",
        status: 0,
      };
      throw error;
    }
    return handle<AuthResponse>(res);
  },

  async login(payload: LoginPayload) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel conectar ao servidor",
        status: 0,
      };
      throw error;
    }
    return handle<AuthResponse>(res);
  },

  async getCurrentUser(token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/me`, {
        headers: authHeaders(token),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar seu perfil",
        status: 0,
      };
      throw error;
    }
    return handle<CurrentUserProfile>(res);
  },

  async listChurrasqueiros(
    search?: string,
    pagination?: { page?: number; pageSize?: number },
  ) {
    let res: Response;
    const params = new URLSearchParams();
    if (search?.trim()) {
      params.set("search", search.trim());
    }
    if (pagination?.page) {
      params.set("page", String(pagination.page));
    }
    if (pagination?.pageSize) {
      params.set("pageSize", String(pagination.pageSize));
    }
    const url = `${API_BASE}/churrasqueiros${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    try {
      res = await fetch(url);
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar os churrasqueiros",
        status: 0,
      };
      throw error;
    }
    return handle<ChurrasqueiroSummary[]>(res);
  },

  async listChurrasqueirosPaginated(
    search?: string,
    pagination?: { page?: number; pageSize?: number },
  ) {
    let res: Response;
    const params = new URLSearchParams();
    if (search?.trim()) {
      params.set("search", search.trim());
    }
    params.set("page", String(pagination?.page ?? 1));
    params.set("pageSize", String(pagination?.pageSize ?? 10));

    try {
      res = await fetch(`${API_BASE}/churrasqueiros?${params.toString()}`);
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar os churrasqueiros",
        status: 0,
      };
      throw error;
    }
    return handle<PaginatedChurrasqueirosResponse>(res);
  },

  async createChurrasqueiro(payload: CreateChurrasqueiroPayload, token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/churrasqueiros`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel cadastrar o churrasqueiro",
        status: 0,
      };
      throw error;
    }
    return handle<ChurrasqueiroSummary>(res);
  },

  async createBooking(payload: CreateBookingPayload, token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/agendamentos`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel criar o agendamento",
        status: 0,
      };
      throw error;
    }
    return handle<BookingResponse>(res);
  },

  async payBooking(
    bookingId: number,
    payload: PayBookingPayload,
    authToken: string,
    idempotencyKey?: string,
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/pagamentos/${bookingId}`, {
        method: "POST",
        headers: {
          ...authHeaders(authToken),
          "Idempotency-Key":
            idempotencyKey ??
            `booking-${bookingId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        },
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel iniciar o pagamento",
        status: 0,
      };
      throw error;
    }
    return handle<PaymentResponse>(res);
  },

  async reviewBooking(
    bookingId: number,
    payload: ReviewBookingPayload,
    token: string,
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/agendamentos/${bookingId}/aprovacao`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel analisar o agendamento",
        status: 0,
      };
      throw error;
    }
    return handle<BookingResponse>(res);
  },

  async listMyChurrasqueiroBookings(token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/churrasqueiros/me/agendamentos`, {
        headers: authHeaders(token),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar as solicitacoes do churrasqueiro",
        status: 0,
      };
      throw error;
    }
    return handle<ChurrasqueiroBookingResponse[]>(res);
  },

  async listMyBookings(token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/agendamentos`, {
        headers: authHeaders(token),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar seus agendamentos",
        status: 0,
      };
      throw error;
    }
    return handle<MyBookingResponse[]>(res);
  },

  async listChurrasqueiroBookingsById(churrasqueiroId: number, token: string) {
    let res: Response;
    try {
      res = await fetch(
        `${API_BASE}/churrasqueiros/me/agendamentos?churrasqueiroId=${encodeURIComponent(String(churrasqueiroId))}`,
        {
          headers: authHeaders(token),
        },
      );
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar as solicitacoes do churrasqueiro",
        status: 0,
      };
      throw error;
    }
    return handle<ChurrasqueiroBookingResponse[]>(res);
  },

  async listParceiros(filters?: {
    search?: string;
    category?: string;
    city?: string;
  }) {
    let res: Response;
    const params = new URLSearchParams();
    if (filters?.search?.trim()) {
      params.set("search", filters.search.trim());
    }
    if (filters?.category?.trim()) {
      params.set("category", filters.category.trim());
    }
    if (filters?.city?.trim()) {
      params.set("city", filters.city.trim());
    }

    const url = `${API_BASE}/parceiros${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    try {
      res = await fetch(url);
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar os parceiros",
        status: 0,
      };
      throw error;
    }
    return handle<Parceiro[]>(res);
  },

  async createParceiro(payload: CreateParceiroPayload, token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/parceiros`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel cadastrar o parceiro",
        status: 0,
      };
      throw error;
    }
    return handle<Parceiro>(res);
  },

  async listBlogPosts(search?: string) {
    let res: Response;
    const params = new URLSearchParams();
    if (search?.trim()) {
      params.set("search", search.trim());
    }
    const url = `${API_BASE}/blog/posts${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    try {
      res = await fetch(url);
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar o blog",
        status: 0,
      };
      throw error;
    }
    return handle<BlogPost[]>(res);
  },

  async getMyChurrasqueiro(token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/churrasqueiros/me`, {
        headers: authHeaders(token),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar o perfil de churrasqueiro",
        status: 0,
      };
      throw error;
    }
    return handle<ChurrasqueiroSummary>(res);
  },

  async getChurrasqueiroProfile(slug: string) {
    let res: Response;
    try {
      res = await fetch(
        `${API_BASE}/churrasqueiros/perfil/${encodeURIComponent(slug)}`,
      );
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar o perfil do churrasqueiro",
        status: 0,
      };
      throw error;
    }
    return handle<ChurrasqueiroProfile>(res);
  },

  async createBlogPost(
    payload: CreateBlogPostPayload,
    token: string,
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/blog/posts`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel publicar no blog",
        status: 0,
      };
      throw error;
    }
    return handle<BlogPost>(res);
  },

  async updateBlogPost(
    id: number,
    payload: UpdateBlogPostPayload,
    token: string,
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/blog/posts/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel atualizar a postagem",
        status: 0,
      };
      throw error;
    }
    return handle<BlogPost>(res);
  },

  async listChatContacts(token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/chat/contacts`, {
        headers: authHeaders(token),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar os contatos do chat",
        status: 0,
      };
      throw error;
    }
    return handle<ChatParticipant[]>(res);
  },

  async listChatConversations(token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/chat/conversations`, {
        headers: authHeaders(token),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar as conversas",
        status: 0,
      };
      throw error;
    }
    return handle<ChatConversation[]>(res);
  },

  async createChatConversation(participantId: number, token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/chat/conversations`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ participantId }),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel abrir a conversa",
        status: 0,
      };
      throw error;
    }
    return handle<ChatConversation>(res);
  },

  async listChatMessages(conversationId: number, token: string) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
        headers: authHeaders(token),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel carregar as mensagens",
        status: 0,
      };
      throw error;
    }
    return handle<ChatMessage[]>(res);
  },

  async sendChatMessage(
    conversationId: number,
    body: string,
    token: string,
  ) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ body }),
      });
    } catch {
      const error: ApiError = {
        message: "Nao foi possivel enviar a mensagem",
        status: 0,
      };
      throw error;
    }
    return handle<{ conversationId: number; message: ChatMessage }>(res);
  },
};
