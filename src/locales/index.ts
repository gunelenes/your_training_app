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

  const deviceLang = Localization.locale.split("-")[0];
  return deviceLang === "tr" ? "tr" : "en";
};

// 📌 i18n anında initialize edilir — async OLMAYACAK!
i18n.use(initReactI18next).init({
  resources,
  lng: "en",          // geçici
  fallbackLng: "en",
  compatibilityJSON: "v3",
  interpolation: { escapeValue: false }
});

// 📌 Sonradan dili yükleyip uygularız
loadLanguage().then(lng => {
  i18n.changeLanguage(lng);
});

export default i18n;
