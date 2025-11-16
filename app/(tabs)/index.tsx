import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Workout = {
  id: string;
  name: string;
  image?: string;
  exercises?: any[];
};

export default function Home() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [langUpdate, setLangUpdate] = useState(0);

  // Dil değişimi
  useEffect(() => {
    const handler = () => setLangUpdate((n) => n + 1);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  // STORAGE YÜKLE
  const loadWorkouts = async () => {
    const raw = await AsyncStorage.getItem("WORKOUTS");
    const data = raw ? JSON.parse(raw) : [];
    setWorkouts(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  // SİLME
  const deleteWorkout = async (id: string) => {
    Alert.alert(
      i18n.t("delete_workout"),
      i18n.t("delete_confirm"),
      [
        { text: i18n.t("cancel"), style: "cancel" },
        {
          text: i18n.t("delete"),
          style: "destructive",
          onPress: async () => {
            const raw = await AsyncStorage.getItem("WORKOUTS");
            const list = raw ? JSON.parse(raw) : [];
            const updated = list.filter((w: any) => w.id !== id);
            await AsyncStorage.setItem("WORKOUTS", JSON.stringify(updated));
            setWorkouts(updated);
          },
        },
      ]
    );
  };

  // KART
  const renderWorkout = ({ item }: { item: Workout }) => (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => deleteWorkout(item.id)}
      >
        <Text style={styles.deleteBtnText}>X</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push(`/workouts/${item.id}`)}>
        <ImageBackground
          source={
            item.image
              ? { uri: item.image }
              : {
                  uri: "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=1200&auto=format&fit=crop",
                }
          }
          imageStyle={{ borderRadius: 16 }}
          style={styles.card}
        >
          <View style={styles.overlay} />
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>
            {item.exercises?.length || 0} {i18n.t("exercises")}
          </Text>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );

  return (
  <View style={styles.container}>

    {/* 🌟 Modern boşluk (kartlar biraz aşağıdan başlar) */}
    <View style={{ height: 50 }} />

    <FlatList
      data={workouts}
      keyExtractor={(item) => item.id}
      renderItem={renderWorkout}
      contentContainerStyle={{ paddingBottom: 120 }}
      ListEmptyComponent={
        <Text style={styles.empty}>{i18n.t("no_workouts")}</Text>
      }
    />

    <TouchableOpacity
      style={styles.floatingBtn}
      onPress={() => router.push("/create-workout")}
    >
      <Text style={styles.floatingPlus}>+</Text>
    </TouchableOpacity>

  </View>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
    paddingHorizontal: 20,
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    opacity: 0.6,
  },

  cardWrapper: {
    marginBottom: 18,
  },

  card: {
    height: 190,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 16,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },

  cardTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },

  cardSubtitle: {
    color: "white",
    fontSize: 16,
    marginTop: 4,
  },

  deleteBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: "red",
    width: 38,
    height: 38,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  deleteBtnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  floatingBtn: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },

  floatingPlus: {
    color: "white",
    fontSize: 33,
    fontWeight: "bold",
    marginTop: -2,
  },
});
