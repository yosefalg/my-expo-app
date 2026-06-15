import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useState } from "react";

export interface LocalSearchResult {
  id: string;
  url: string;
  title: string;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  confidence: number;
  source: string;
  providerName: string;
  pageTitle: string | null;
  siteName: string | null;
  matchType: "exact" | "similar" | "partial";
}

export interface LocalSearchJob {
  id: string;
  imageUrl: string;
  status: "pending" | "running" | "completed" | "failed";
  results: LocalSearchResult[];
  totalResults: number;
  processingTimeMs: number | null;
  createdAt: string;
  completedAt: string | null;
  error: string | null;
}

interface SearchContextType {
  activeJob: LocalSearchJob | null;
  setActiveJob: (job: LocalSearchJob | null) => void;
  recentHistory: LocalSearchJob[];
  addToHistory: (job: LocalSearchJob) => void;
  clearHistory: () => void;
  selectedProviders: string[];
  setSelectedProviders: (providers: string[]) => void;
}

const SearchContext = createContext<SearchContextType>({
  activeJob: null,
  setActiveJob: () => {},
  recentHistory: [],
  addToHistory: () => {},
  clearHistory: () => {},
  selectedProviders: ["google_lens", "bing_visual", "tineye", "yandex"],
  setSelectedProviders: () => {},
});

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [activeJob, setActiveJob] = useState<LocalSearchJob | null>(null);
  const [recentHistory, setRecentHistory] = useState<LocalSearchJob[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([
    "google_lens", "bing_visual", "tineye", "yandex",
  ]);

  const addToHistory = useCallback((job: LocalSearchJob) => {
    setRecentHistory(prev => {
      const updated = [job, ...prev.filter(h => h.id !== job.id)].slice(0, 50);
      AsyncStorage.setItem("@omnivision_history", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setRecentHistory([]);
    AsyncStorage.removeItem("@omnivision_history").catch(() => {});
  }, []);

  return (
    <SearchContext.Provider
      value={{
        activeJob,
        setActiveJob,
        recentHistory,
        addToHistory,
        clearHistory,
        selectedProviders,
        setSelectedProviders,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => useContext(SearchContext);
