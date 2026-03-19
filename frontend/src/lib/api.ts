const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export interface ApiError {
  message: string;
  status: number;
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
  async register(payload: { name: string; email: string; password: string }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Não foi possível conectar ao servidor",
        status: 0,
      };
      throw error;
    }
    return handle<{ token: string; user: unknown }>(res);
  },

  async login(payload: { email: string; password: string }) {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      const error: ApiError = {
        message: "Não foi possível conectar ao servidor",
        status: 0,
      };
      throw error;
    }
    return handle<{ token: string; user: unknown }>(res);
  },

  async listChurrasqueiros() {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/churrasqueiros`);
    } catch {
      const error: ApiError = {
        message: "Não foi possível carregar os churrasqueiros",
        status: 0,
      };
      throw error;
    }
    return handle<any[]>(res);
  },
};

