import React, { createContext, useContext, useState, useMemo, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "@/lib/query-client";

interface UserData {
  id: string;
  username: string;
  displayName?: string;
  handicap?: number;
}

interface AuthContextValue {
  user: UserData | null;
  isLoggedIn: boolean;
  isDeveloper: boolean;
  login: (username: string, password: string) => Promise<void>;
  loginDeveloper: (password: string) => Promise<boolean>;
  logout: () => void;
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

  const value = useMemo(() => ({
    user,
    isLoggedIn: !!user,
    isDeveloper,
    login,
    loginDeveloper,
    logout,
  }), [user, isDeveloper, login, loginDeveloper, logout]);

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
