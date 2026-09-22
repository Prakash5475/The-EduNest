import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import {
  apiClient,
  registerUnauthorizedHandler,
  setAccessToken,
} from "@/services/apiClient";

export type UserType = "school" | "dealer" | "admin" | "staff";

export interface AuthUser {
  id: string;
  uuid: string;
  fullName: string;
  email: string;
  phone: string | null;
  userType: UserType;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  userType: UserType;
  [key: string]: unknown;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    identifier: string,
    password: string,
    loginAs?: "admin" | "dealer" | "customer",
  ) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function homeRouteFor(userType: UserType): string {
  if (userType === "school") return "/portal";
  if (userType === "dealer") return "/dealer";
  return "/admin";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
      setUser(response.user);
    } catch {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      clearSession();
    });

    let cancelled = false;

    async function initializeSession() {
      try {
        const response = await apiClient.post<{
          accessToken: string;
          refreshToken?: string;
          expiresIn: number;
        }>(
          "/auth/refresh",
          {},
          {
            anonymous: true,
            skipRefresh: true,
          },
        );

        if (cancelled) return;

        setAccessToken(response.accessToken);
        await refreshMe();
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    initializeSession();

    return () => {
      cancelled = true;
    };
  }, [clearSession, refreshMe]);

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      loginAs: "admin" | "dealer" | "customer" = "admin",
    ) => {
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        {
          identifier: identifier.trim(),
          password,
          loginAs,
        },
        {
          anonymous: true,
          skipRefresh: true,
        },
      );

      setAccessToken(response.accessToken);
      setUser(response.user);

      return response.user;
    },
    [],
  );

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiClient.post(
      "/auth/register",
      {
        ...payload,
        fullName: payload.fullName.trim(),
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone.trim(),
      },
      {
        anonymous: true,
        skipRefresh: true,
      },
    );

    toast.success(
      "Account created. Please check your email to verify your address.",
    );
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post(
        "/auth/logout",
        {},
        {
          skipRefresh: true,
        },
      );
    } catch {
      // Session is cleared even when the server-side logout fails.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, isLoading, login, register, logout, refreshMe],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}