import { getWorkout, updateWorkout } from "@/src/lib/storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
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

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const saveChanges = async () => {
    if (!name.trim()) {
      Alert.alert(t("error"), t("workout_name_required"));
      return;
    }

    await updateWorkout(id, { name, image: image ?? undefined });
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: t("edit_workout"),
          headerStyle: { backgroundColor: "#0A0B0D" },
          headerTintColor: "#667EEA",
          headerTitleStyle: {
            fontWeight: "700",
            fontSize: 18,
            color: "#fff",
          },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
          headerBackTitleStyle: { fontSize: 14 },
          gestureEnabled: true,
          fullScreenGestureEnabled: true,
        }}
      />

      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <Text style={styles.headerSubtext}>{t("edit_workout")}</Text>
          <Text style={styles.title}>{t("edit_workout")}</Text>
          <Text style={styles.headerDescription}>
            {t("edit_workout_desc")}
          </Text>
        </Animated.View>

        <Animated.View entering={SlideInLeft.delay(200)} style={styles.section}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.image} />
                <LinearGradient
                  colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
                  style={styles.previewOverlay}
                />
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={pickImage}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                    style={styles.changePhotoBtnGradient}
                  >
                    <Text style={styles.changePhotoBtnText}>
                      📷 {t("select_photo")}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.noImage}>
                <Text style={{ color: "#6E7178", fontWeight: "600" }}>
                  {t("select_photo")}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={SlideInLeft.delay(350)} style={styles.section}>
          <Text style={styles.label}>{t("workout_name")}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t("workout_placeholder")}
              placeholderTextColor="#6E7178"
              style={styles.input}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500)} style={styles.saveContainer}>
          <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
            <LinearGradient
              colors={["#4ADE80", "#22C55E"]}
              style={styles.saveBtnGradient}
            >
              <Text style={styles.saveText}>💾 {t("save")}</Text>
            </LinearGradient>
          </TouchableOpacity>
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

  scrollView: { flex: 1 },

  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: {
    marginBottom: 32,
  },

  headerSubtext: {
    color: "#6E7178",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
    letterSpacing: -0.5,
  },

  headerDescription: {
    color: "#6E7178",
    fontSize: 16,
    marginTop: 4,
  },

  section: {
    marginBottom: 32,
  },

  imagePreviewContainer: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
  },

  image: {
    width: "100%",
    height: 220,
    resizeMode: "cover",
  },

  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  changePhotoBtn: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 12,
    overflow: "hidden",
  },

  changePhotoBtnGradient: {
    padding: 14,
    alignItems: "center",
  },

  changePhotoBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  noImage: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: "#1A1C1E",
    alignItems: "center",
    justifyContent: "center",
  },

  label: {
    color: "white",
    fontSize: 18,
    marginBottom: 12,
    fontWeight: "700",
  },

  inputContainer: {
    backgroundColor: "#1A1C1E",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2A2C2E",
  },

  input: {
    padding: 18,
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },

  saveContainer: {
    marginTop: 10,
  },

  saveBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#4ADE80",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  saveBtnGradient: {
    paddingVertical: 20,
    alignItems: "center",
  },

  saveText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
});
