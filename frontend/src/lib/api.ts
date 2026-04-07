const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

export interface ApiError {
  message: string;
  status: number;
}

export interface ChurrasqueiroSummary {
  id: number;
  name: string;
  city: string;
  imgChurrasqueiro?: string | null;
}

export interface Parceiro {
  id: number;
  name: string;
  category: string;
  description: string | null;
  featuredProducts: string | null;
  location: string;
  city: string;
  phone: string;
  openingHours: string;
  couponCode: string;
  validUntil: string;
  recommendedChurrasqueiros: ChurrasqueiroSummary[];
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
        message: "Nao foi possivel conectar ao servidor",
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
        message: "Nao foi possivel conectar ao servidor",
        status: 0,
      };
      throw error;
    }
    return handle<{ token: string; user: unknown }>(res);
  },

  async listChurrasqueiros(search?: string) {
    let res: Response;
    const params = new URLSearchParams();
    if (search?.trim()) {
      params.set("search", search.trim());
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
    return handle<any[]>(res);
  },

  async createChurrasqueiro(
    payload: {
      name: string;
      city: string;
      description?: string;
      pricePerHour: number;
      imgChurrasqueiro?: string;
    },
    token: string,
  ) {
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
    return handle<any>(res);
  },

  async createBooking(
    payload: {
      churrasqueiroId: number;
      date: string;
      startTime: string;
      endTime: string;
      notes?: string;
    },
    token: string,
  ) {
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
    return handle<any>(res);
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

  async createParceiro(
    payload: {
      name: string;
      category: string;
      description?: string;
      featuredProducts?: string;
      location: string;
      city: string;
      phone: string;
      openingHours: string;
      couponCode: string;
      validUntil: string;
      recommendedChurrasqueiroIds?: number[];
    },
    token: string,
  ) {
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
};
