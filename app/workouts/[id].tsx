import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [langUpdate, setLangUpdate] = useState(0); // dil değişince yenile

  // 🔥 Dil değişimini dinle
  useEffect(() => {
    const handler = () => setLangUpdate((x) => x + 1);
    i18n.on("languageChanged", handler);

    return () => i18n.off("languageChanged", handler);
  }, []);

  // 🔥 Antrenmanı yükle
  const loadWorkout = async () => {
    const raw = await AsyncStorage.getItem("WORKOUTS");
    const list = raw ? JSON.parse(raw) : [];
    const found = list.find((x: any) => x.id === id);

    setWorkout(found || null);
  };

  useEffect(() => {
    loadWorkout();
  }, [id]);

  // 🔥 Egzersiz render
  const renderExercise = ({ item }: any) => (
    <TouchableOpacity
      style={styles.exerciseItem}
      onPress={() => router.push(`/workouts/${id}/exercise/${item.id}`)}
    >
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.exerciseSets}>
        {item.sets?.length || 0} {i18n.t("sets")}
      </Text>
    </TouchableOpacity>
  );

  if (!workout) {
    return (
      <View style={styles.container}>
        <Text>{i18n.t("empty")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER IMAGE */}
      {workout.image ? (
        <ImageBackground
          source={{ uri: workout.image }}
          style={styles.headerImage}
        >
          <View style={styles.headerOverlay} />
          <Text style={styles.headerTitle}>{workout.name}</Text>
        </ImageBackground>
      ) : (
        <View style={[styles.headerImage, styles.noImage]}>
          <Text style={styles.headerTitle}>{workout.name}</Text>
        </View>
      )}

      {/* EXERCISE LIST */}
      <Text style={styles.sectionTitle}>{i18n.t("exercises")}</Text>

      <FlatList
        data={workout.exercises || []}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{i18n.t("no_exercises") ?? "Henüz egzersiz yok."}</Text>
        }
      />

      {/* ADD EXERCISE BTN */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/workouts/${id}/add-exercise`)}
      >
        <Text style={styles.fabText}>+</Text>
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
    backgroundColor: "#F5F5F7",
  },

  headerImage: {
    height: 240,
    justifyContent: "flex-end",
    padding: 20,
  },

  noImage: {
    backgroundColor: "#dadada",
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "white",
    position: "absolute",
    left: 20,
    bottom: 20,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginLeft: 20,
    marginBottom: 10,
  },

  exerciseItem: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    elevation: 2,
  },

  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
  },

  exerciseSets: {
    fontSize: 16,
    opacity: 0.7,
  },

  emptyText: {
    textAlign: "center",
    marginTop: 20,
    opacity: 0.6,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#34C759",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  fabText: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    marginTop: -3,
  },
});
