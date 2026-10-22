"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type Language = "en" | "he";

const LANGUAGE_STORAGE_KEY = "iec-hub-language";

function getLanguageSnapshot(): Language {
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en"
    ? "en"
    : "he";
}

function getServerLanguageSnapshot(): Language {
  return "he";
}

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("iec-hub-language-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("iec-hub-language-change", onChange);
  };
}

export function useLanguagePreference() {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot,
  );
  const isRtl = language === "he";

  const setLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event("iec-hub-language-change"));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [isRtl, language]);

  return { language, isRtl, setLanguage };
}
