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

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setBaseUrl(`https://${process.env.EXPO_PUBLIC_DOMAIN}`);
    loadStoredAuth();
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => token);
  }, [token]);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem("@omnivision_token"),
        AsyncStorage.getItem("@omnivision_user"),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

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
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
