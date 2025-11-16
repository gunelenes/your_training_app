import i18n from "@/src/locales"; // alias kullanıyorsan
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// alias yoksa:  import i18n from "../../src/locales";

export default function Profile() {
  const { t } = useTranslation();

  const changeLanguage = async (lng: "tr" | "en") => {
    // Dili kaydet
    await AsyncStorage.setItem("APP_LANG", lng);

    try {
      // i18n init tam yüklenmeden çağırırsak hata vermesin
      await i18n.changeLanguage(lng);
    } catch (err) {
      console.log("changeLanguage error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("language")}</Text>
      <Text style={styles.subtitle}>{t("chooseLanguage")}</Text>

      <View style={styles.languageRow}>
        {/* TÜRKÇE */}
        <TouchableOpacity
          onPress={() => changeLanguage("tr")}
          style={[
            styles.langBtn,
            i18n.language === "tr" ? styles.langBtnActive : null,
          ]}
        >
          <Text
            style={[
              styles.langBtnText,
              i18n.language === "tr" ? styles.langBtnTextActive : null,
            ]}
          >
            🇹🇷 {t("turkish")}
          </Text>
        </TouchableOpacity>

        {/* ENGLISH */}
        <TouchableOpacity
          onPress={() => changeLanguage("en")}
          style={[
            styles.langBtn,
            i18n.language === "en" ? styles.langBtnActive : null,
          ]}
        >
          <Text
            style={[
              styles.langBtnText,
              i18n.language === "en" ? styles.langBtnTextActive : null,
            ]}
          >
            🇬🇧 {t("english")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    marginTop: 30,
  },

  subtitle: {
    fontSize: 18,
    marginTop: 10,
    color: "#666",
  },

  languageRow: {
    flexDirection: "row",
    marginTop: 30,
    gap: 15,
  },

  langBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#bbb",
    paddingVertical: 15,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  langBtnActive: {
    backgroundColor: "#0d6efd",
    borderColor: "#0d6efd",
  },

  langBtnText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },

  langBtnTextActive: {
    color: "#fff",
  },
});
