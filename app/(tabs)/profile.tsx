import i18n from "@/src/locales";
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";

type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
];

export default function Profile() {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language || "en");

  useEffect(() => {
    const handler = () => setCurrentLang(i18n.language);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  const changeLanguage = async (langCode: string) => {
    await i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    const langName = LANGUAGES.find(l => l.code === langCode)?.nativeName;
    Alert.alert(
      "✅",
      t("language_changed", { lang: langName }),
      [{ text: t("ok") }],
      { userInterfaceStyle: 'dark' }
    );
  };

  const currentLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>👤</Text>
            </LinearGradient>
          </View>
          <Text style={styles.headerTitle}>{t("profile")}</Text>
          <Text style={styles.headerSubtext}>{t("manage_preferences")}</Text>
        </Animated.View>

        <Animated.View entering={SlideInRight.delay(200)} style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionIcon}>🌐 </Text>
            {t("language")}
          </Text>

          <View style={styles.currentLangCard}>
            <LinearGradient
              colors={['#1A1C1E', '#0F1012']}
              style={styles.currentLangGradient}
            >
              <Text style={styles.currentLangFlag}>{currentLanguage.flag}</Text>
              <View style={styles.currentLangInfo}>
                <Text style={styles.currentLangName}>{currentLanguage.nativeName}</Text>
                <Text style={styles.currentLangSubtext}>{t("current_language")}</Text>
              </View>
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.languageGrid}>
            {LANGUAGES.map((lang, index) => (
              <Animated.View
                key={lang.code}
                entering={SlideInRight.delay(300 + index * 100)}
                style={styles.langCardWrapper}
              >
                <TouchableOpacity
                  style={[
                    styles.langCard,
                    currentLang === lang.code && styles.langCardActive,
                  ]}
                  onPress={() => changeLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  {currentLang === lang.code ? (
                    <LinearGradient
                      colors={['#667EEA', '#764BA2']}
                      style={styles.langCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <Text style={styles.langNativeName}>{lang.nativeName}</Text>
                      <Text style={[styles.langName, { color: 'rgba(255,255,255,0.7)' }]}>{lang.name}</Text>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>✓ {t("active")}</Text>
                      </View>
                    </LinearGradient>
                  ) : (
                    <View style={styles.langCardContent}>
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <Text style={styles.langNativeName}>{lang.nativeName}</Text>
                      <Text style={styles.langName}>{lang.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={SlideInRight.delay(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionIcon}>⚙️ </Text>
            {t("settings")}
          </Text>

          <View style={[styles.settingItem, styles.settingItemDisabled]}>
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🔔</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t("notifications")}</Text>
              <Text style={styles.settingSubtext}>{t("notifications_desc")}</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{t("coming_soon")}</Text>
            </View>
          </View>

          <View style={[styles.settingItem, styles.settingItemDisabled]}>
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>📊</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t("statistics")}</Text>
              <Text style={styles.settingSubtext}>{t("statistics_desc")}</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{t("coming_soon")}</Text>
            </View>
          </View>

          <View style={[styles.settingItem, styles.settingItemDisabled]}>
            <View style={styles.settingIconContainer}>
              <Text style={styles.settingIcon}>🎨</Text>
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t("theme")}</Text>
              <Text style={styles.settingSubtext}>{t("theme_desc")}</Text>
            </View>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>{t("coming_soon")}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={SlideInRight.delay(700)} style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionIcon}>ℹ️ </Text>
            {t("about")}
          </Text>

          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              <Text style={styles.aboutLabel}>{t("version")}: </Text>1.1.2
            </Text>
            <Text style={styles.aboutText}>{t("made_with_love")}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0B0D",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    alignItems: "center",
    marginBottom: 40,
  },

  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  avatarGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 48,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },

  headerSubtext: {
    fontSize: 16,
    color: "#6E7178",
    fontWeight: "500",
  },

  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
  },

  sectionIcon: {
    fontSize: 24,
  },

  currentLangCard: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  currentLangGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },

  currentLangFlag: {
    fontSize: 48,
  },

  currentLangInfo: {
    flex: 1,
  },

  currentLangName: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },

  currentLangSubtext: {
    fontSize: 14,
    color: "#6E7178",
    fontWeight: "600",
  },

  checkmarkContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4ADE80",
    justifyContent: "center",
    alignItems: "center",
  },

  checkmark: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },

  languageGrid: {
    flexDirection: "row",
    gap: 12,
  },

  langCardWrapper: {
    flex: 1,
  },

  langCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  langCardActive: {
    shadowColor: "#667EEA",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },

  langCardGradient: {
    padding: 24,
    alignItems: "center",
    minHeight: 120,
    justifyContent: "center",
  },

  langCardContent: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#1A1C1E",
    minHeight: 120,
    justifyContent: "center",
  },

  langFlag: {
    fontSize: 36,
    marginBottom: 12,
  },

  langNativeName: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },

  langName: {
    fontSize: 13,
    color: "#6E7178",
    fontWeight: "600",
    textAlign: "center",
  },

  activeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },

  activeBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
  },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1C1E",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },

  settingItemDisabled: {
    opacity: 0.7,
  },

  settingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#0F1012",
    justifyContent: "center",
    alignItems: "center",
  },

  settingIcon: {
    fontSize: 24,
  },

  settingInfo: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },

  settingSubtext: {
    fontSize: 13,
    color: "#6E7178",
    fontWeight: "500",
  },

  comingSoonBadge: {
    backgroundColor: "rgba(102, 126, 234, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  comingSoonText: {
    color: "#667EEA",
    fontSize: 11,
    fontWeight: "700",
  },

  aboutCard: {
    backgroundColor: "#1A1C1E",
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },

  aboutText: {
    fontSize: 16,
    color: "#6E7178",
    fontWeight: "500",
  },

  aboutLabel: {
    color: "white",
    fontWeight: "700",
  },
});
