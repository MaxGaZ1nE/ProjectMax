declare module '@contexts/AuthContext' {
  import type { ReactNode } from 'react';

  export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    name: string;
    phone: string;
    role: string;
    address?: string;
    province?: string;
    postalCode?: string;
    birthDate?: string;
    gender?: string;
  }

  export interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;

    register: (
      email: string,
      phone: string,
      password: string,
      firstName: string,
      lastName?: string,
      role?: string
    ) => Promise<User>;

    login: (email: string, password: string) => Promise<User>;
    logout: () => Promise<void>;

    getProfile: () => Promise<User>;
    updateProfile: (data: Partial<User>) => Promise<User>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;

    isAuthenticated: () => boolean;
    hasRole: (role: string) => boolean;
  }

  export const AuthContext: React.Context<AuthContextType>;
  export const useAuth: () => AuthContextType;
  export const AuthProvider: (props: { children?: ReactNode }) => JSX.Element;
}

declare module '@/contexts/AuthContext' {
  export * from '@contexts/AuthContext';
}
