import { theme } from "@/constants/theme";
import { hapticSelect } from "@/src/lib/haptics";
import i18n from "@/src/locales";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
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

const APP_VERSION = Constants.expoConfig?.version ?? "—";

export default function Profile() {
  const { t } = useTranslation();
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState(i18n.language || "en");

  useEffect(() => {
    const handler = () => setCurrentLang(i18n.language);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  const changeLanguage = async (langCode: string) => {
    hapticSelect();
    await i18n.changeLanguage(langCode);
    setCurrentLang(langCode);
    const langName = LANGUAGES.find((l) => l.code === langCode)?.nativeName;
    Alert.alert("✅", t("language_changed", { lang: langName }), [{ text: t("ok") }], {
      userInterfaceStyle: "dark",
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>💪</Text>
          </View>
          <Text style={styles.headerTitle}>{t("profile")}</Text>
          <Text style={styles.headerSubtext}>{t("manage_preferences")}</Text>
        </Animated.View>

        {/* Language */}
        <Animated.View entering={SlideInRight.delay(100)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t("language")}</Text>
          <View style={styles.langGrid}>
            {LANGUAGES.map((lang) => {
              const active = currentLang === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langCard, active && styles.langCardActive]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <Text style={[styles.langName, active && { color: theme.color.bg }]}>{lang.nativeName}</Text>
                  {active && <Text style={styles.activeLabel}>✓ {t("active")}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Tools */}
        <Animated.View entering={SlideInRight.delay(200)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t("settings")}</Text>

          <TouchableOpacity style={styles.row} onPress={() => router.push("/body-weight")}>
            <View style={styles.rowIcon}>
              <Text style={styles.rowEmoji}>⚖️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("body_weight")}</Text>
              <Text style={styles.rowSub}>{t("log_weight")}</Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => router.push("/data")}>
            <View style={styles.rowIcon}>
              <Text style={styles.rowEmoji}>💾</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{t("data")}</Text>
              <Text style={styles.rowSub}>{t("export_desc")}</Text>
            </View>
            <Text style={styles.rowArrow}>→</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* About */}
        <Animated.View entering={SlideInRight.delay(300)} style={styles.section}>
          <Text style={styles.sectionLabel}>{t("about")}</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutRow}>
              <Text style={styles.aboutKey}>{t("version")}: </Text>{APP_VERSION}
            </Text>
            <Text style={styles.aboutRow}>{t("made_with_love")}</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },
  scrollContent: { padding: theme.space.xl, paddingTop: 60, paddingBottom: 120 },

  header: { alignItems: "center", marginBottom: theme.space.xxxl },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.space.md,
  },
  avatarText: { fontSize: 42 },

  headerTitle: {
    fontSize: theme.font.size.display,
    fontWeight: theme.font.weight.bold,
    color: theme.color.text,
  },
  headerSubtext: {
    fontSize: theme.font.size.sm,
    color: theme.color.textMuted,
    marginTop: 4,
  },

  section: { marginBottom: theme.space.xl },

  sectionLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: theme.space.md,
  },

  langGrid: { flexDirection: "row", gap: theme.space.md },

  langCard: {
    flex: 1,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.xl,
    alignItems: "center",
    gap: theme.space.sm,
  },
  langCardActive: {
    backgroundColor: theme.color.accent,
  },
  langFlag: { fontSize: 32 },
  langName: { color: theme.color.text, fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold },
  activeLabel: {
    color: theme.color.bg,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
    marginTop: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.color.surface,
    padding: theme.space.md,
    borderRadius: theme.radius.md,
    marginBottom: theme.space.sm,
    gap: theme.space.md,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.color.surfaceMuted,
    justifyContent: "center",
    alignItems: "center",
  },
  rowEmoji: { fontSize: 20 },
  rowTitle: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },
  rowSub: { color: theme.color.textMuted, fontSize: theme.font.size.xs, marginTop: 2 },
  rowArrow: { color: theme.color.textMuted, fontSize: theme.font.size.lg },

  aboutCard: {
    backgroundColor: theme.color.surface,
    padding: theme.space.lg,
    borderRadius: theme.radius.md,
    gap: theme.space.sm,
  },
  aboutRow: {
    fontSize: theme.font.size.sm,
    color: theme.color.textMuted,
  },
  aboutKey: { color: theme.color.text, fontWeight: theme.font.weight.bold },
});
