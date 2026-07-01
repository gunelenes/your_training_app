import { deleteWorkout, getWorkouts, type Workout } from "@/src/lib/storage";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";

const CARD_HEIGHT = 120;

const SkeletonCard = ({ delay = 0 }: { delay?: number }) => {
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
      <View style={styles.skeletonContent}>
        <View>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonSubtitle} />
        </View>
        <View style={styles.skeletonImage} />
      </View>
    </Animated.View>
  );
};

const AnimatedWorkoutCard = ({
  item,
  index,
  onDelete,
  onPress,
}: {
  item: Workout;
  index: number;
  onDelete: (id: string, swipeableRef?: React.RefObject<Swipeable | null>) => void;
  onPress: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const swipeableRef = useRef<Swipeable>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        delay: index * 100,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, scaleAnim, translateY]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
          { height: CARD_HEIGHT, justifyContent: "center" },
          { opacity, transform: [{ scale }] }
        ]}
      >
        <TouchableOpacity
          onPress={() => onDelete(item.id, swipeableRef)}
          style={[styles.deleteSwipe, { height: CARD_HEIGHT }]}
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
            <Text style={styles.deleteSwipeText}>{t("delete")}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.swipeWrapper,
        {
          transform: [{ scale: scaleAnim }, { translateY }],
        }
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
          onPress={() => onPress(item.id)}
        >
          <View style={styles.card}>
            <Image
              source={{
                uri: item.image
                  ? item.image
                  : "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?q=80&w=800&auto=format&fit=crop",
              }}
              style={styles.cardBackground}
              blurRadius={1}
            />

            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
              style={styles.gradientOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />

            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.exerciseTag}>
                  <View style={styles.exerciseDot} />
                  <Text style={styles.cardSubtitle}>
                    {item.exercises?.length || 0} {t("exercises")}
                  </Text>
                </View>
              </View>

              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
};

export default function Home() {
  const router = useRouter();
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadWorkouts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    const data = await getWorkouts();
    setWorkouts(data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkouts(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [])
  );

  const handleDeleteWorkout = async (
    id: string,
    swipeableRef?: React.RefObject<Swipeable | null>
  ) => {
    Alert.alert(
      t("delete_workout"),
      t("delete_confirm"),
      [
        {
          text: t("cancel"),
          style: "cancel",
          onPress: () => swipeableRef?.current?.close(),
        },
        {
          text: t("delete"),
          style: "destructive",
          onPress: async () => {
            await deleteWorkout(id);
            setWorkouts((prev) => prev.filter((w) => w.id !== id));
          },
        },
      ],
      {
        cancelable: true,
        userInterfaceStyle: 'dark',
      }
    );
  };

  const renderWorkout = ({ item, index }: { item: Workout; index: number }) => (
    <AnimatedWorkoutCard
      item={item}
      index={index}
      onDelete={handleDeleteWorkout}
      onPress={(id) => router.push(`/workouts/${id}`)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerSubtext}>{t("my_workouts")}</Text>
            <Text style={styles.headerText}>{t("workouts")}</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/create-workout")}
            style={styles.addBtn}
          >
            <LinearGradient
              colors={['#667EEA', '#764BA2']}
              style={styles.addBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.addBtnText}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingTop: 8 }}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} delay={i * 100} />
            ))}
          </View>
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkout}
            contentContainerStyle={{ paddingBottom: 40, paddingTop: 8 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#667EEA"
                colors={['#667EEA', '#764BA2']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💪</Text>
                <Text style={styles.emptyTitle}>{t("no_workouts")}</Text>
                <Text style={styles.emptySubtitle}>
                  {t("tap_plus_first_workout")}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A0B0D",
  },

  container: {
    flex: 1,
    backgroundColor: "#0A0B0D",
    paddingHorizontal: 20,
  },

  headerRow: {
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerSubtext: {
    color: "#6E7178",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: -4,
  },

  headerText: {
    color: "white",
    fontSize: 36,
    fontWeight: "700",
    letterSpacing: -0.5,
  },

  addBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#667EEA",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  addBtnGradient: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },

  addBtnText: {
    color: "white",
    fontSize: 28,
    fontWeight: "600",
    marginTop: -2,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
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

  swipeWrapper: {
    marginBottom: 16,
  },

  deleteSwipe: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    marginLeft: 8,
    overflow: 'hidden',
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },

  deleteGradient: {
    flex: 1,
    width: 100,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
    gap: 4,
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
    fontSize: 20,
    fontWeight: "700",
  },

  deleteSwipeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  card: {
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },

  cardBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  gradientOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  cardContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  cardInfo: {
    flex: 1,
    justifyContent: "center",
  },

  cardTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  exerciseTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  exerciseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4ADE80",
    marginRight: 6,
  },

  cardSubtitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },

  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  arrow: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
  },

  skeletonCard: {
    height: CARD_HEIGHT,
    backgroundColor: "#1A1C1E",
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
  },

  skeletonContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  skeletonTitle: {
    width: 150,
    height: 24,
    backgroundColor: "#2A2C2E",
    borderRadius: 8,
    marginBottom: 12,
  },

  skeletonSubtitle: {
    width: 100,
    height: 16,
    backgroundColor: "#2A2C2E",
    borderRadius: 8,
  },

  skeletonImage: {
    width: 80,
    height: 80,
    backgroundColor: "#2A2C2E",
    borderRadius: 12,
  },
});
