import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

type Language = "en" | "ar";

interface Translations {
  // Tabs
  search: string;
  history: string;
  engines: string;
  profile: string;
  // Auth
  signIn: string;
  createAccount: string;
  email: string;
  password: string;
  fullName: string;
  somethingWentWrong: string;
  fillAllFields: string;
  demo: string;
  // Search
  searchTitle: string;
  searchSubtitle: string;
  pickImage: string;
  camera: string;
  gallery: string;
  searching: string;
  // Profile
  searchUsage: string;
  accountInfo: string;
  name: string;
  plan: string;
  role: string;
  signOut: string;
  upgradePro: string;
  notSignedIn: string;
  // History
  searchHistory: string;
  noHistory: string;
  results: string;
  // Engines
  searchEngines: string;
  // Language
  language: string;
  arabic: string;
  english: string;
}

const ar: Translations = {
  search: "بحث",
  history: "السجل",
  engines: "المحركات",
  profile: "الملف",
  signIn: "تسجيل الدخول",
  createAccount: "إنشاء حساب",
  email: "البريد الإلكتروني",
  password: "كلمة المرور",
  fullName: "الاسم الكامل",
  somethingWentWrong: "حدث خطأ ما",
  fillAllFields: "يرجى ملء جميع الحقول",
  demo: "تجريبي",
  searchTitle: "البحث البصري",
  searchSubtitle: "ارفع صورة للبحث عبر محركات متعددة",
  pickImage: "اختر صورة",
  camera: "الكاميرا",
  gallery: "المعرض",
  searching: "جاري البحث...",
  searchUsage: "استخدام البحث",
  accountInfo: "معلومات الحساب",
  name: "الاسم",
  plan: "الخطة",
  role: "الدور",
  signOut: "تسجيل الخروج",
  upgradePro: "الترقية إلى Pro",
  notSignedIn: "غير مسجّل الدخول",
  searchHistory: "سجل البحث",
  noHistory: "لا يوجد سجل بعد",
  results: "نتائج",
  searchEngines: "محركات البحث",
  language: "اللغة",
  arabic: "العربية",
  english: "الإنجليزية",
};

const en: Translations = {
  search: "Search",
  history: "History",
  engines: "Engines",
  profile: "Profile",
  signIn: "Sign In",
  createAccount: "Create Account",
  email: "Email address",
  password: "Password",
  fullName: "Full name",
  somethingWentWrong: "Something went wrong",
  fillAllFields: "Please fill in all fields",
  demo: "Demo",
  searchTitle: "Visual Search",
  searchSubtitle: "Upload an image to search across multiple engines",
  pickImage: "Pick an image",
  camera: "Camera",
  gallery: "Gallery",
  searching: "Searching...",
  searchUsage: "Search Usage",
  accountInfo: "Account Info",
  name: "Name",
  plan: "Plan",
  role: "Role",
  signOut: "Sign Out",
  upgradePro: "Upgrade to Pro",
  notSignedIn: "Not signed in",
  searchHistory: "Search History",
  noHistory: "No history yet",
  results: "results",
  searchEngines: "Search Engines",
  language: "Language",
  arabic: "Arabic",
  english: "English",
};

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  t: en,
  setLanguage: () => {},
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLang] = useState<Language>("en");

  useEffect(() => {
    AsyncStorage.getItem("@omnivision_lang").then((val) => {
      if (val === "ar" || val === "en") setLang(val);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    await AsyncStorage.setItem("@omnivision_lang", lang);
    setLang(lang);
  }, []);

  const isRTL = language === "ar";

  return (
    <LanguageContext.Provider
      value={{
        language,
        t: language === "ar" ? ar : en,
        setLanguage,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
