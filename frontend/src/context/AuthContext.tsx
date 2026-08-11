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
import { apiClient, setAccessToken, registerUnauthorizedHandler } from "@/services/apiClient";

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
  refreshToken: string;
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
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Where each user type lands after login. */
export function homeRouteFor(userType: UserType): string {
  if (userType === "school") return "/portal";
  if (userType === "dealer") return "/dealer";
  return "/admin"; // admin, staff
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const data = await apiClient.get<{ user: AuthUser }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      setUser(null);
    });
    // Try to establish a session from the refresh cookie on first load.
    (async () => {
      try {
        const data = await apiClient.post<{ accessToken: string; refreshToken: string; expiresIn: number }>(
          "/auth/refresh",
          {},
          { anonymous: true },
        );
        setAccessToken(data.accessToken);
        await refreshMe();
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.post<LoginResponse>("/auth/login", { email, password }, { anonymous: true });
    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await apiClient.post("/auth/register", payload, { anonymous: true });
    toast.success("Account created — please check your email to verify your address.");
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout", {});
    } catch {
      // Ignore — we clear local state regardless.
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshMe }),
    [user, isLoading, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
