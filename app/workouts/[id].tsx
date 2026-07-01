import { deleteExercise, getWorkout, type Exercise, type Workout } from "@/src/lib/storage";
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { Swipeable } from "react-native-gesture-handler";

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
  }, [delay, pulseAnim]);

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

const AnimatedExerciseCard = ({
  item,
  index,
  onPress,
  onDelete,
}: {
  item: Exercise;
  index: number;
  onPress: () => void;
  onDelete: (swipeableRef: React.RefObject<Swipeable | null>) => void;
}) => {
  const { t } = useTranslation();
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
  }, [index, scaleAnim, translateX]);

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

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
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
          onPress={() => onDelete(swipeableRef)}
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
                  {item.sets?.length || 0} {t("sets")}
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWorkout = useCallback(async () => {
    setLoading(true);
    const found = await getWorkout(id);
    setWorkout(found);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadWorkout();
    }, [loadWorkout])
  );

  const handleDeleteExercise = async (
    exerciseId: string,
    swipeableRef: React.RefObject<Swipeable | null>
  ) => {
    Alert.alert(
      t("delete"),
      t("delete_confirm"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            await deleteExercise(id, exerciseId);
            loadWorkout();
          },
        },
      ],
      {
        cancelable: true,
        userInterfaceStyle: 'dark',
      }
    );
  };

  const renderExercise = ({ item, index }: { item: Exercise; index: number }) => (
    <AnimatedExerciseCard
      item={item}
      index={index}
      onPress={() => router.push(`/workouts/${id}/exercise/${item.id}`)}
      onDelete={(swipeableRef) => handleDeleteExercise(item.id, swipeableRef)}
    />
  );

  if (!workout && !loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>{t("empty")}</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: workout?.name || t("workouts"),
          headerStyle: {
            backgroundColor: '#0A0B0D',
          },
          headerTintColor: '#667EEA',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
            color: '#fff',
          },
          headerShadowVisible: false,
          headerBackTitle: t("back"),
          headerBackTitleStyle: {
            fontSize: 16,
          },
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          fullScreenGestureEnabled: true,
        }}
      />

      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

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
              <Text style={styles.headerSubtext}>{t("workout_plan")}</Text>
              <Text style={styles.headerTitle}>{workout?.name || "..."}</Text>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{workout?.exercises?.length || 0}</Text>
                  <Text style={styles.statLabel}>{t("exercises")}</Text>
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
              <Text style={styles.headerSubtext}>{t("workout_plan")}</Text>
              <Text style={styles.headerTitle}>{workout?.name || "..."}</Text>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{workout?.exercises?.length || 0}</Text>
                  <Text style={styles.statLabel}>{t("exercises")}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("exercises")}</Text>
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
                    {t("no_exercises")}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {t("tap_plus_first_exercise")}
                  </Text>
                </View>
              }
            />
          )}
        </View>

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
    </>
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
