export interface AuthState {
  token: string | null;
  email: string | null;
  role: "user" | "admin" | "churrasqueiro" | null;
}

export const EMPTY_AUTH_STATE: AuthState = {
  token: null,
  email: null,
  role: null,
};
