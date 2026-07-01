import { theme } from "@/constants/theme";
import { hapticSuccess } from "@/src/lib/haptics";
import { getWorkout, updateWorkout } from "@/src/lib/storage";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp, SlideInLeft } from "react-native-reanimated";

export default function EditWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const w = await getWorkout(id);
      if (w) {
        setName(w.name);
        setImage(w.image || null);
      }
    })();
  }, [id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const saveChanges = async () => {
    if (!name.trim()) {
      Alert.alert(t("error"), t("workout_name_required"));
      return;
    }
    await updateWorkout(id, { name, image: image ?? undefined });
    hapticSuccess();
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("edit_workout"),
          headerStyle: { backgroundColor: theme.color.bg },
          headerTintColor: theme.color.accent,
          headerTitleStyle: { fontWeight: "700", fontSize: 18, color: theme.color.text },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
        }}
      />
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(500)}>
          <Text style={styles.headerLabel}>{t("edit_workout")}</Text>
          <Text style={styles.title}>{t("edit_workout")}</Text>
          <Text style={styles.subtitle}>{t("edit_workout_desc")}</Text>
        </Animated.View>

        <Animated.View entering={SlideInLeft.delay(200)} style={styles.section}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            {image ? (
              <View style={styles.imgWrap}>
                <Image source={{ uri: image }} style={styles.image} />
                <View style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>📷 {t("select_photo")}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noImage}>
                <Text style={styles.noImageText}>{t("select_photo")}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={SlideInLeft.delay(300)} style={styles.section}>
          <Text style={styles.label}>{t("workout_name")}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t("workout_placeholder")}
            placeholderTextColor={theme.color.textDim}
            style={styles.input}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400)}>
          <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
            <Text style={styles.saveBtnText}>💾 {t("save")}</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
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

  imgWrap: { borderRadius: theme.radius.lg, overflow: "hidden", position: "relative" },
  image: { width: "100%", height: 200, resizeMode: "cover" },
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

  noImage: {
    width: "100%",
    height: 200,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.color.border,
    borderStyle: "dashed",
  },
  noImageText: { color: theme.color.textMuted, fontSize: theme.font.size.md, fontWeight: theme.font.weight.semibold },

  input: {
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.semibold,
  },

  saveBtn: {
    backgroundColor: theme.color.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.space.xl,
    alignItems: "center",
  },
  saveBtnText: { color: theme.color.bg, fontSize: theme.font.size.lg, fontWeight: theme.font.weight.bold },
});
