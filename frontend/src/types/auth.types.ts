export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'cashier';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
