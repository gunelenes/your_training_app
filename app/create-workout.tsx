import { theme } from "@/constants/theme";
import { hapticSuccess } from "@/src/lib/haptics";
import { persistImage, resolveImage } from "@/src/lib/images";
import { addWorkout } from "@/src/lib/storage";
import * as ImagePicker from "expo-image-picker";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, SlideInDown } from "react-native-reanimated";

export default function CreateWorkout() {
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled && result.assets.length > 0) {
      setImage(await persistImage(result.assets[0].uri));
    }
  };

  const createWorkout = async () => {
    if (!name.trim()) return;
    setIsLoading(true);
    await addWorkout({
      id: Date.now().toString(),
      name,
      image,
      exercises: [],
    });
    hapticSuccess();
    setIsLoading(false);
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("new_workout"),
          headerStyle: { backgroundColor: theme.color.bg },
          headerTintColor: theme.color.accent,
          headerTitleStyle: { fontWeight: "700", fontSize: 18, color: theme.color.text },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
          gestureEnabled: true,
        }}
      />
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(500)}>
            <Text style={styles.headerLabel}>{t("create_new_label")}</Text>
            <Text style={styles.title}>{t("new_workout")}</Text>
            <Text style={styles.subtitle}>{t("build_your_workout")}</Text>
          </Animated.View>

          <Animated.View entering={SlideInDown.delay(150)} style={styles.section}>
            <Text style={styles.label}>{t("workout_name")}</Text>
            <TextInput
              placeholder={t("workout_placeholder")}
              placeholderTextColor={theme.color.textDim}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </Animated.View>

          <Animated.View entering={SlideInDown.delay(300)} style={styles.section}>
            <Text style={styles.label}>{t("select_photo")}</Text>
            {image ? (
              <View style={styles.imgWrap}>
                <Image source={{ uri: resolveImage(image) }} style={styles.imgPreview} />
                <TouchableOpacity style={styles.changeBtn} onPress={pickImage}>
                  <Text style={styles.changeBtnText}>📷 {t("change_photo")}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
                <Text style={styles.photoIcon}>📷</Text>
                <Text style={styles.photoText}>{t("select_photo")}</Text>
                <Text style={styles.photoSubtext}>{t("tap_to_choose_gallery")}</Text>
              </TouchableOpacity>
            )}
          </Animated.View>

          <Animated.View entering={SlideInDown.delay(450)}>
            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={createWorkout}
              disabled={!name.trim() || isLoading}
            >
              <Text style={[styles.saveBtnText, !name.trim() && { color: theme.color.textMuted }]}>
                {isLoading ? "⏳ " + t("creating") : "✨ " + t("create")}
              </Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>{t("add_exercises_after")}</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.color.bg },
  content: { padding: theme.space.xl, paddingTop: 40, paddingBottom: 60 },

  headerLabel: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  title: {
    color: theme.color.text,
    fontSize: theme.font.size.hero,
    fontWeight: theme.font.weight.bold,
    letterSpacing: -1,
    marginTop: 4,
  },
  subtitle: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.md,
    marginTop: 4,
    marginBottom: theme.space.xxl,
  },

  section: { marginBottom: theme.space.xl },

  label: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
    marginBottom: theme.space.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  input: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.semibold,
  },

  photoBox: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.xxxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.color.border,
    borderStyle: "dashed",
  },
  photoIcon: { fontSize: 40, marginBottom: theme.space.sm },
  photoText: { color: theme.color.text, fontSize: theme.font.size.md, fontWeight: theme.font.weight.bold },
  photoSubtext: { color: theme.color.textMuted, fontSize: theme.font.size.xs, marginTop: 4 },

  imgWrap: { borderRadius: theme.radius.lg, overflow: "hidden", position: "relative" },
  imgPreview: { width: "100%", height: 200, resizeMode: "cover" },
  changeBtn: {
    position: "absolute",
    bottom: theme.space.md,
    left: theme.space.md,
    right: theme.space.md,
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: theme.space.sm,
    borderRadius: theme.radius.sm,
    alignItems: "center",
  },
  changeBtnText: { color: theme.color.text, fontSize: theme.font.size.sm, fontWeight: theme.font.weight.bold },

  saveBtn: {
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.space.xl,
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: theme.color.surface },
  saveBtnText: { color: theme.color.bg, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold },

  helperText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    textAlign: "center",
    marginTop: theme.space.md,
  },
});
