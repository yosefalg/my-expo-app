import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  plan: "free" | "pro" | "enterprise";
  searchesUsed?: number;
  searchesLimit?: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const GUEST_USER: User = {
  id: "guest",
  email: "guest@omnivision.ai",
  name: "Guest",
  role: "user",
  plan: "free",
  searchesUsed: 0,
  searchesLimit: 100,
  createdAt: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType>({
  user: GUEST_USER,
  token: "guest-token",
  isLoading: false,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(GUEST_USER);
  const [token, setToken] = useState<string | null>("guest-token");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
    setAuthTokenGetter(() => token);
  }, [token]);

  const login = useCallback(async (newToken: string, newUser: User) => {
    await Promise.all([
      AsyncStorage.setItem("@omnivision_token", newToken),
      AsyncStorage.setItem("@omnivision_user", JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem("@omnivision_token"),
      AsyncStorage.removeItem("@omnivision_user"),
    ]);
    setToken("guest-token");
    setUser(GUEST_USER);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
