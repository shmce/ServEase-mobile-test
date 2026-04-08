"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { adminLogin, storeToken, clearToken } from "../../lib/adminApi";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    const storedAdmin = localStorage.getItem("servease_admin");
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem("servease_admin");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await adminLogin(email, password);
      setAdmin(result.admin);
      localStorage.setItem("servease_admin", JSON.stringify(result.admin));
      storeToken(result.token);
      setSessionExpired(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem("servease_admin");
    clearToken();
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
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
