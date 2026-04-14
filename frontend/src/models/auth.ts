export interface AuthState {
  token: string | null;
  email: string | null;
}

export const EMPTY_AUTH_STATE: AuthState = {
  token: null,
  email: null,
};
