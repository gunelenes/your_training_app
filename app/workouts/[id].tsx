import i18n from "@/src/locales";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";

// 💀 SKELETON EXERCISE CARD
const SkeletonExerciseCard = ({ delay = 0 }: { delay?: number }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
    </Animated.View>
  );
};

// 🎯 ANIMATED EXERCISE CARD
const AnimatedExerciseCard = ({
  item,
  index,
  onPress,
  onDelete,
}: {
  item: any;
  index: number;
  onPress: () => void;
  onDelete: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-50)).current;
  const swipeableRef = useRef<Swipeable>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 80,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        delay: index * 80,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
    }).start();
  };

  const renderRightActions = (progress: any, dragX: any) => {
    const scale = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.7, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View 
        style={[
          { height: 80, justifyContent: "center" },
          { opacity, transform: [{ scale }] }
        ]}
      >
        <TouchableOpacity
          onPress={onDelete}
          style={styles.deleteSwipe}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={['#FF3B30', '#C62828']}
            style={styles.deleteGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.deleteIconContainer}>
              <Text style={styles.deleteIcon}>✕</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.exerciseWrapper,
        { transform: [{ scale: scaleAnim }, { translateX }] },
      ]}
    >
      <Swipeable
        ref={swipeableRef}
        overshootRight={false}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onPress}
        >
          <View style={styles.exerciseItem}>
            <View style={styles.exerciseIconContainer}>
              <Text style={styles.exerciseIcon}>💪</Text>
            </View>

            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={styles.setsTag}>
                <View style={styles.setsDot} />
                <Text style={styles.exerciseSets}>
                  {item.sets?.length || 0} {i18n.t("sets")}
                </Text>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [workout, setWorkout] = useState<any>(null);
  const [langUpdate, setLangUpdate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = () => setLangUpdate((x) => x + 1);
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, []);

  const loadWorkout = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const raw = await AsyncStorage.getItem("WORKOUTS");
    const list = raw ? JSON.parse(raw) : [];
    const found = list.find((x: any) => x.id === id);
    setWorkout(found || null);
    setLoading(false);
  };

  useEffect(() => {
    loadWorkout();
  }, [id]);

  const deleteExercise = async (exerciseId: string, swipeableRef?: any) => {
    Alert.alert(
      i18n.t("delete"),
      i18n.t("delete_confirm"),
      [
        { 
          text: i18n.t("cancel"), 
          style: "cancel",
          onPress: () => {
            if (swipeableRef?.current) {
              swipeableRef.current.close();
            }
          }
        },
        {
          text: i18n.t("delete"),
          style: "destructive",
          onPress: async () => {
            const raw = await AsyncStorage.getItem("WORKOUTS");
            const list = raw ? JSON.parse(raw) : [];

            const updated = list.map((w: any) => {
              if (w.id === id) {
                return {
                  ...w,
                  exercises: w.exercises.filter(
                    (ex: any) => ex.id !== exerciseId
                  ),
                };
              }
              return w;
            });

            await AsyncStorage.setItem("WORKOUTS", JSON.stringify(updated));
            loadWorkout();
          },
        },
      ],
      {
        cancelable: true,
        userInterfaceStyle: 'dark'
      }
    );
  };

  const renderExercise = ({ item, index }: { item: any; index: number }) => (
    <AnimatedExerciseCard
      item={item}
      index={index}
      onPress={() => router.push(`/workouts/${id}/exercise/${item.id}`)}
      onDelete={() => deleteExercise(item.id)}
    />
  );

  if (!workout && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{i18n.t("empty")}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
      
      {/* HEADER WITH IMAGE */}
      {workout?.image ? (
        <ImageBackground source={{ uri: workout.image }} style={styles.headerImage} blurRadius={0.5}>
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
            style={styles.headerOverlay}
          />

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/workouts/${id}/edit`)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
              style={styles.editBtnGradient}
            >
              <Text style={styles.editText}>✏️</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerSubtext}>Workout Plan</Text>
            <Text style={styles.headerTitle}>{workout?.name || "..."}</Text>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{workout?.exercises?.length || 0}</Text>
                <Text style={styles.statLabel}>{i18n.t("exercises")}</Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.headerImage, styles.noImage]}>
          <LinearGradient
            colors={['#667EEA', '#764BA2']}
            style={styles.headerOverlay}
          />
          
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/workouts/${id}/edit`)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
              style={styles.editBtnGradient}
            >
              <Text style={styles.editText}>✏️</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerSubtext}>Workout Plan</Text>
            <Text style={styles.headerTitle}>{workout?.name || "..."}</Text>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{workout?.exercises?.length || 0}</Text>
                <Text style={styles.statLabel}>{i18n.t("exercises")}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* EXERCISES SECTION */}
      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{i18n.t("exercises")}</Text>
          <View style={styles.exerciseCount}>
            <Text style={styles.exerciseCountText}>
              {workout?.exercises?.length || 0}
            </Text>
          </View>
        </View>

        {loading ? (
          <View>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonExerciseCard key={i} delay={i * 100} />
            ))}
          </View>
        ) : (
          <FlatList
            data={workout?.exercises || []}
            keyExtractor={(item) => item.id}
            renderItem={renderExercise}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏋️</Text>
                <Text style={styles.emptyTitle}>
                  {i18n.t("no_exercises") ?? "No exercises yet"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  Tap + to add your first exercise
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* FAB BUTTON */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push(`/workouts/${id}/add-exercise`)}
      >
        <LinearGradient
          colors={['#4ADE80', '#22C55E']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.fabText}>+</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#0A0B0D" 
  },

  headerImage: {
    height: 280,
    justifyContent: "flex-end",
  },

  noImage: {
    backgroundColor: "#667EEA",
  },

  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  headerContent: {
    padding: 24,
    paddingBottom: 32,
  },

  headerSubtext: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  headerTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: "white",
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  headerStats: {
    flexDirection: "row",
    gap: 24,
  },

  statItem: {
    alignItems: "center",
  },

  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },

  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    fontWeight: "600",
  },

  editBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },

  editBtnGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    backdropFilter: "blur(10px)",
  },

  editText: {
    fontSize: 20,
  },

  contentContainer: {
    flex: 1,
    backgroundColor: "#0A0B0D",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
  },

  exerciseCount: {
    backgroundColor: "#1A1C1E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  exerciseCountText: {
    color: "#4ADE80",
    fontSize: 14,
    fontWeight: "700",
  },

  exerciseWrapper: {
    marginBottom: 12,
  },

  exerciseItem: {
    backgroundColor: "#1A1C1E",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  exerciseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(74, 222, 128, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  exerciseIcon: {
    fontSize: 24,
  },

  exerciseInfo: {
    flex: 1,
  },

  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginBottom: 6,
  },

  setsTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  setsDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#4ADE80",
    marginRight: 6,
  },

  exerciseSets: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },

  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  arrow: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  deleteSwipe: {
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    marginLeft: 8,
    overflow: 'hidden',
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  deleteGradient: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteIcon: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },

  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },

  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },

  emptySubtitle: {
    color: "#6E7178",
    fontSize: 14,
    textAlign: "center",
  },

  emptyText: {
    color: "#6E7178",
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    shadowColor: "#4ADE80",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },

  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  fabText: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
    marginTop: -2,
  },

  // 💀 SKELETON
  skeletonCard: {
    backgroundColor: "#1A1C1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    height: 80,
    justifyContent: "center",
  },

  skeletonTitle: {
    width: "60%",
    height: 18,
    backgroundColor: "#2A2C2E",
    borderRadius: 8,
    marginBottom: 10,
  },

  skeletonSubtitle: {
    width: "30%",
    height: 14,
    backgroundColor: "#2A2C2E",
    borderRadius: 8,
  },
});