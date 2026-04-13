import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AdminApiError,
  clearAdminSession,
  getCurrentAdmin,
  getStoredAdminSession,
  loginAdmin,
  logoutAdmin,
  storeAdminSession,
} from "../../lib/adminApi";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedSession = getStoredAdminSession();
      if (!storedSession) {
        clearAdminSession();
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      setAdmin(storedSession.admin);
      setAccessToken(storedSession.accessToken);

      try {
        const freshAdmin = await getCurrentAdmin(storedSession.accessToken);
        if (isMounted) {
          setAdmin(freshAdmin);
          storeAdminSession({
            accessToken: storedSession.accessToken,
            refreshToken: storedSession.refreshToken,
            admin: freshAdmin,
          });
        }
      } catch {
        if (isMounted) {
          clearAdminSession();
          setAdmin(null);
          setAccessToken(null);
          setSessionExpired(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const session = await loginAdmin(email, password);
      setAdmin(session.admin);
      setAccessToken(session.accessToken);
      storeAdminSession(session);
      setSessionExpired(false);
      return { success: true };
    } catch (error) {
      if (error instanceof AdminApiError) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: "Unable to sign in right now. Please try again.",
      };
    }
  };

  const logout = async () => {
    const token = accessToken ?? getStoredAdminSession()?.accessToken;

    if (token) {
      try {
        await logoutAdmin(token);
      } catch {
        // Ignore backend logout failures and clear the local session.
      }
    }

    setAdmin(null);
    setAccessToken(null);
    clearAdminSession();
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        accessToken,
        isAuthenticated: !!admin,
        isLoading,
        login,
        logout,
        sessionExpired,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
