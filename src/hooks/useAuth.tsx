import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "@/lib/auth-server";

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: "farmer" | "sea";
  farm_name?: string;
  organization?: string;
  country?: string;
  region?: string;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    password: string;
    role: "farmer" | "sea";
    farmName?: string;
    organization?: string;
    country?: string;
    region?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isMock: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  useEffect(() => {
    // Load session from localStorage on boot
    const storedUser = localStorage.getItem("terrabrew_user");
    const storedIsMock = localStorage.getItem("terrabrew_is_mock") === "true";
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsMock(storedIsMock);
      } catch {
        localStorage.removeItem("terrabrew_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginUser({ data: { email, password } });
      if (res.success && res.user) {
        const profile: UserProfile = res.user as any;
        setUser(profile);
        setIsMock(false);
        localStorage.setItem("terrabrew_user", JSON.stringify(profile));
        localStorage.setItem("terrabrew_is_mock", "false");
        setIsLoading(false);
        return { success: true };
      } else {
        // FALLBACK: If database is not connected, support mock accounts for smooth testing
        const errMsg = res.error || "Login failed";
        if (errMsg.includes("Database connection not available") || errMsg.includes("Failed to connect")) {
          // Check for mock credentials
          const cleanEmail = email.toLowerCase().trim();
          if (
            (cleanEmail === "petani@terrabrew.com" || cleanEmail === "farmer@terrabrew.com") &&
            password === "password"
          ) {
            const mockUser: UserProfile = {
              id: 999,
              email: cleanEmail,
              full_name: "Budi Santoso (Demo)",
              role: "farmer",
              farm_name: "Aceh Gayo Farm",
              country: "Indonesia",
              region: "Aceh",
              created_at: new Date().toISOString(),
            };
            setUser(mockUser);
            setIsMock(true);
            localStorage.setItem("terrabrew_user", JSON.stringify(mockUser));
            localStorage.setItem("terrabrew_is_mock", "true");
            setIsLoading(false);
            return { success: true };
          } else if (
            (cleanEmail === "sea@terrabrew.com" || cleanEmail === "validator@terrabrew.com") &&
            password === "password"
          ) {
            const mockUser: UserProfile = {
              id: 888,
              email: cleanEmail,
              full_name: "Hendrik Wijaya (Demo)",
              role: "sea",
              organization: "Sucofindo / SEA Indonesia",
              country: "Indonesia",
              region: "Aceh",
              created_at: new Date().toISOString(),
            };
            setUser(mockUser);
            setIsMock(true);
            localStorage.setItem("terrabrew_user", JSON.stringify(mockUser));
            localStorage.setItem("terrabrew_is_mock", "true");
            setIsLoading(false);
            return { success: true };
          }
        }
        setIsLoading(false);
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      console.error("Auth context login error", err);
      setIsLoading(false);
      return { success: false, error: err.message || "An unexpected error occurred" };
    }
  };

  const register = async (data: {
    fullName: string;
    email: string;
    password: string;
    role: "farmer" | "sea";
    farmName?: string;
    organization?: string;
    country?: string;
    region?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await registerUser({ data });
      if (res.success && res.user) {
        const profile: UserProfile = res.user as any;
        setUser(profile);
        setIsMock(false);
        localStorage.setItem("terrabrew_user", JSON.stringify(profile));
        localStorage.setItem("terrabrew_is_mock", "false");
        setIsLoading(false);
        return { success: true };
      } else {
        // Fallback for registry mock mode
        const errMsg = res.error || "Registration failed";
        if (errMsg.includes("Database connection not available") || errMsg.includes("Failed to connect")) {
          const mockUser: UserProfile = {
            id: Math.floor(Math.random() * 1000) + 1,
            email: data.email.toLowerCase().trim(),
            full_name: data.fullName,
            role: data.role,
            farm_name: data.farmName,
            organization: data.organization,
            country: data.country,
            region: data.region,
            created_at: new Date().toISOString(),
          };
          setUser(mockUser);
          setIsMock(true);
          localStorage.setItem("terrabrew_user", JSON.stringify(mockUser));
          localStorage.setItem("terrabrew_is_mock", "true");
          setIsLoading(false);
          return { success: true };
        }
        setIsLoading(false);
        return { success: false, error: errMsg };
      }
    } catch (err: any) {
      console.error("Auth context register error", err);
      setIsLoading(false);
      return { success: false, error: err.message || "An unexpected error occurred" };
    }
  };

  const logout = () => {
    setUser(null);
    setIsMock(false);
    localStorage.removeItem("terrabrew_user");
    localStorage.removeItem("terrabrew_is_mock");
    // Optionally redirect is handled in component
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isMock }}>
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
