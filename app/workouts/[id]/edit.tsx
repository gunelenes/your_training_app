import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function EditWorkout() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // Mevcut veriyi yükle
  useEffect(() => {
    loadWorkout();
  }, []);

  const loadWorkout = async () => {
    const raw = await AsyncStorage.getItem("WORKOUTS");
    const list = raw ? JSON.parse(raw) : [];

    const w = list.find((x: any) => x.id === id);

    if (w) {
      setName(w.name);
      setImage(w.image || null);
    }
  };

  // Fotoğraf seç
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      base64: false,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Kaydet
  const saveChanges = async () => {
    if (!name.trim()) {
      Alert.alert(i18n.t("error"), i18n.t("workout_name_required"));
      return;
    }

    const raw = await AsyncStorage.getItem("WORKOUTS");
    const list = raw ? JSON.parse(raw) : [];

    const updated = list.map((w: any) =>
      w.id === id
        ? {
            ...w,
            name,
            image,
          }
        : w
    );

    await AsyncStorage.setItem("WORKOUTS", JSON.stringify(updated));

    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.t("edit_workout")}</Text>

      <TouchableOpacity onPress={pickImage}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.noImage}>
            <Text style={{ opacity: 0.5 }}>{i18n.t("select_photo")}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder={i18n.t("workout_name")}
        style={styles.input}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
        <Text style={styles.saveText}>{i18n.t("save")}</Text>
      </TouchableOpacity>
    </View>
  );
}

//
// STYLES
//
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F5F5F7",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  noImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveText: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
  },
});
