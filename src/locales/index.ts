import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import tr from "./tr.json";

const resources = {
  en: { translation: en },
  tr: { translation: tr }
};

// 📌 Kayıtlı dili oku
export const loadLanguage = async () => {
  const saved = await AsyncStorage.getItem("APP_LANG");
  if (saved) return saved;

  // use the available expo-localization sync API in a typesafe way
  try {
    // expo-localization provides locale and locales on the module (no getLocalizationAsync in types)
    const locInfo = Localization as unknown as { locale?: string; locales?: { languageTag: string }[] };
    const locale = locInfo.locale ?? locInfo.locales?.[0]?.languageTag ?? "en";
    const deviceLang = locale.split("-")[0];
    return deviceLang === "tr" ? "tr" : "en";
  } catch {
    return "en";
  }
};

// 📌 i18n anında initialize edilir — async OLMAYACAK!
i18n.use(initReactI18next).init({
  resources,
  lng: "en",          // geçici
  fallbackLng: "en",
  compatibilityJSON: "v4",
  interpolation: { escapeValue: false }
});

// 📌 Sonradan dili yükleyip uygularız
loadLanguage().then(lng => {
  i18n.changeLanguage(lng);
});

export default i18n;