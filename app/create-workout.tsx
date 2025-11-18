import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [langUpdate, setLangUpdate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handler = () => setLangUpdate((x) => x + 1);
    i18n.on("languageChanged", handler);

    return () => {
      i18n.off("languageChanged", handler);
    };
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.7,
      allowsEditing: true,
      aspect: [16, 9],
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const createWorkout = async () => {
    if (!name.trim()) return;

    setIsLoading(true);

    const newWorkout = {
      id: Date.now().toString(),
      name,
      image,
      exercises: [],
    };

    const raw = await AsyncStorage.getItem("WORKOUTS");
    const list = raw ? JSON.parse(raw) : [];

    list.push(newWorkout);

    await AsyncStorage.setItem("WORKOUTS", JSON.stringify(list));

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);

    router.push("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <Text style={styles.headerSubtext}>Create New</Text>
            <Text style={styles.title}>{i18n.t("new_workout")}</Text>
            <Text style={styles.headerDescription}>
              Build your custom workout plan
            </Text>
          </Animated.View>

          {/* WORKOUT NAME */}
          <Animated.View entering={SlideInDown.delay(200)} style={styles.section}>
            <Text style={styles.label}>
              <Text style={styles.labelIcon}>💪 </Text>
              {i18n.t("workout_name")}
            </Text>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder={i18n.t("workout_placeholder")}
                placeholderTextColor="#6E7178"
                value={name}
                onChangeText={setName}
                style={styles.input}
              />
            </View>
          </Animated.View>

          {/* IMAGE PICKER */}
          <Animated.View entering={SlideInDown.delay(400)} style={styles.section}>
            <Text style={styles.label}>
              <Text style={styles.labelIcon}>🖼️ </Text>
              {i18n.t("select_photo")}
            </Text>

            {image ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.preview} />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.6)']}
                  style={styles.previewOverlay}
                />
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={pickImage}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                    style={styles.changePhotoBtnGradient}
                  >
                    <Text style={styles.changePhotoBtnText}>
                      📷 {i18n.t("change_photo") ?? "Change Photo"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
                <LinearGradient
                  colors={['#667EEA', '#764BA2']}
                  style={styles.photoBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.photoBtnContent}>
                    <View style={styles.photoBtnIconContainer}>
                      <Text style={styles.photoBtnIcon}>📷</Text>
                    </View>
                    <Text style={styles.photoBtnText}>
                      {i18n.t("select_photo")}
                    </Text>
                    <Text style={styles.photoBtnSubtext}>
                      Tap to choose from gallery
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* CREATE BUTTON */}
          <Animated.View entering={SlideInDown.delay(600)} style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveBtn, !name.trim() && styles.saveBtnDisabled]}
              onPress={createWorkout}
              disabled={!name.trim() || isLoading}
            >
              <LinearGradient
                colors={
                  !name.trim()
                    ? ['#2A2C2E', '#1A1C1E']
                    : ['#4ADE80', '#22C55E']
                }
                style={styles.saveBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={[
                  styles.saveBtnText,
                  !name.trim() && styles.saveBtnTextDisabled
                ]}>
                  {isLoading ? "⏳ Creating..." : `✨ ${i18n.t("create")}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              You can add exercises after creating the workout
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 40,
  },

  headerSubtext: {
    color: "#6E7178",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  headerDescription: {
    color: "#6E7178",
    fontSize: 16,
    fontWeight: "500",
  },

  section: {
    marginBottom: 32,
  },

  label: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginBottom: 12,
  },

  labelIcon: {
    fontSize: 20,
  },

  inputContainer: {
    backgroundColor: "#1A1C1E",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#2A2C2E",
    overflow: "hidden",
  },

  input: {
    padding: 18,
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },

  photoBtn: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  photoBtnGradient: {
    padding: 32,
    alignItems: "center",
  },

  photoBtnContent: {
    alignItems: "center",
  },

  photoBtnIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  photoBtnIcon: {
    fontSize: 32,
  },

  photoBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },

  photoBtnSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },

  imagePreviewContainer: {
    position: "relative",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  preview: {
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
    backgroundColor: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
  },

  changePhotoBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  buttonContainer: {
    marginTop: 20,
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

  saveBtnDisabled: {
    shadowOpacity: 0,
  },

  saveBtnGradient: {
    paddingVertical: 20,
    alignItems: "center",
  },

  saveBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  saveBtnTextDisabled: {
    color: "#6E7178",
  },

  helperText: {
    color: "#6E7178",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});