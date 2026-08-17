import TodaySummary from "@/components/today-summary";
import { theme } from "@/constants/theme";
import { hapticTap } from "@/src/lib/haptics";
import { resolveImage } from "@/src/lib/images";
import { deleteWorkout, getWorkouts, type Workout } from "@/src/lib/storage";
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

const CARD_HEIGHT = 100;

const SkeletonCard = ({ delay = 0 }: { delay?: number }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, delay, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [delay, pulseAnim]);
  const opacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[styles.skeletonCard, { opacity }]} />;
};

const WorkoutCard = ({
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
  const translateY = useRef(new Animated.Value(30)).current;
  const swipeableRef = useRef<Swipeable>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay: index * 60,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        delay: index * 60,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, scaleAnim, translateY]);

  const renderRightActions = (
    _p: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.7, 0],
      extrapolate: "clamp",
    });
    return (
      <Animated.View style={[{ height: CARD_HEIGHT, justifyContent: "center" }, { opacity }]}>
        <TouchableOpacity
          onPress={() => onDelete(item.id, swipeableRef)}
          style={styles.deleteSwipe}
        >
          <Text style={styles.deleteIcon}>✕</Text>
          <Text style={styles.deleteLabel}>{t("delete")}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }, { translateY }] }]}
    >
      <Swipeable
        ref={swipeableRef}
        overshootRight={false}
        renderRightActions={renderRightActions}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={() => onPress(item.id)}>
          <View style={styles.card}>
            {item.image && (
              <Image source={{ uri: resolveImage(item.image) }} style={styles.cardImage} blurRadius={0.5} />
            )}
            <View style={styles.cardOverlay} />
            <View style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.cardTag}>
                  <View style={styles.cardTagDot} />
                  <Text style={styles.cardTagText}>
                    {item.exercises?.length || 0} {t("exercises")}
                  </Text>
                </View>
              </View>
              <View style={styles.cardArrow}>
                <Text style={styles.cardArrowText}>→</Text>
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
            hapticTap();
            await deleteWorkout(id);
            setWorkouts((prev) => prev.filter((w) => w.id !== id));
          },
        },
      ],
      { cancelable: true, userInterfaceStyle: "dark" }
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.subtitle}>{t("my_workouts")}</Text>
            <Text style={styles.title}>{t("workouts")}</Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              hapticTap();
              router.push("/create-workout");
            }}
            style={styles.addBtn}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Today ring */}
        <TodaySummary />

        {/* Workouts */}
        {loading ? (
          <View>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonCard key={i} delay={i * 100} />
            ))}
          </View>
        ) : (
          <FlatList
            data={workouts}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <WorkoutCard
                item={item}
                index={index}
                onDelete={handleDeleteWorkout}
                onPress={(id) => router.push(`/workouts/${id}`)}
              />
            )}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={theme.color.accent}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>💪</Text>
                <Text style={styles.emptyTitle}>{t("no_workouts")}</Text>
                <Text style={styles.emptySub}>{t("tap_plus_first_workout")}</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.color.bg },
  container: { flex: 1, backgroundColor: theme.color.bg, paddingHorizontal: theme.space.xl },

  headerRow: {
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  subtitle: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: theme.color.text,
    fontSize: theme.font.size.hero,
    fontWeight: theme.font.weight.bold,
    letterSpacing: -1,
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnText: {
    color: theme.color.bg,
    fontSize: 28,
    fontWeight: theme.font.weight.bold,
    marginTop: -2,
  },

  cardWrapper: { marginBottom: theme.space.md },

  card: {
    height: CARD_HEIGHT,
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    backgroundColor: theme.color.surface,
  },

  cardImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10,11,13,0.55)",
  },

  cardContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.space.lg,
    gap: theme.space.md,
  },

  cardTitle: {
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
    marginBottom: theme.space.xs,
  },

  cardTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.color.accentSoft,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    alignSelf: "flex-start",
    gap: 6,
  },

  cardTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.accent,
  },

  cardTagText: {
    color: theme.color.accent,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
  },

  cardArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.color.accent,
    justifyContent: "center",
    alignItems: "center",
  },

  cardArrowText: {
    color: theme.color.bg,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  deleteSwipe: {
    width: 90,
    height: CARD_HEIGHT,
    marginLeft: 8,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.danger,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },

  deleteIcon: {
    color: theme.color.text,
    fontSize: theme.font.size.xl,
    fontWeight: theme.font.weight.bold,
  },

  deleteLabel: {
    color: theme.color.text,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
  },

  skeletonCard: {
    height: CARD_HEIGHT,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.color.surface,
    marginBottom: theme.space.md,
  },

  emptyBox: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 40,
  },

  emptyIcon: { fontSize: 56, marginBottom: theme.space.md },
  emptyTitle: {
    color: theme.color.text,
    fontSize: theme.font.size.lg,
    fontWeight: theme.font.weight.bold,
    marginBottom: theme.space.sm,
    textAlign: "center",
  },
  emptySub: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    textAlign: "center",
  },
});
