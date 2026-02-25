import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

interface UserData {
  id: string;
  username: string;
  email?: string;
  displayName?: string;
  handicap?: number;
  emailVerified?: boolean;
  age?: number;
  height?: string;
  swingSpeed?: number;
  avgDriveDistance?: number;
  flexibilityLevel?: string;
  golfGoals?: string;
  clubDistances?: any;
}

interface AuthContextValue {
  user: UserData | null;
  isLoggedIn: boolean;
  isDeveloper: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  loginDeveloper: (password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserData>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);

  React.useEffect(() => {
    AsyncStorage.getItem("golfpro_user").then((saved) => {
      if (saved) setUser(JSON.parse(saved));
    });
    AsyncStorage.getItem("golfpro_dev").then((saved) => {
      if (saved === "true") setIsDeveloper(true);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiRequest("POST", "/api/auth/login", { username, password });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");
    setUser(data);
    await AsyncStorage.setItem("golfpro_user", JSON.stringify(data));
  }, []);

  const register = useCallback(async (username: string, email: string, password: string, displayName: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { username, email, password, displayName });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Registration failed");
    setUser(data);
    await AsyncStorage.setItem("golfpro_user", JSON.stringify(data));
  }, []);

  const loginDeveloper = useCallback(async (password: string) => {
    if (password === "0424") {
      setIsDeveloper(true);
      await AsyncStorage.setItem("golfpro_dev", "true");
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsDeveloper(false);
    AsyncStorage.removeItem("golfpro_user");
    AsyncStorage.removeItem("golfpro_dev");
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserData>) => {
    if (!user) return;
    const res = await apiRequest("PUT", "/api/auth/profile", { userId: user.id, ...data });
    const updated = await res.json();
    if (!res.ok) throw new Error(updated.error || "Update failed");
    setUser(updated);
    await AsyncStorage.setItem("golfpro_user", JSON.stringify(updated));
  }, [user]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const res = await apiRequest("GET", `/api/auth/user/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        await AsyncStorage.setItem("golfpro_user", JSON.stringify(data));
      }
    } catch {}
  }, [user]);

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isDeveloper,
    login,
    register,
    loginDeveloper,
    logout,
    updateProfile,
    refreshUser,
  }), [user, isDeveloper, login, register, loginDeveloper, logout, updateProfile, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
