import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExerciseSet = {
  id: string;
  weight: string;
  reps: string;
  date: string;
  note?: string;
};

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "legs"
  | "glutes"
  | "core"
  | "cardio"
  | "other";

export type Exercise = {
  id: string;
  name: string;
  image?: string | null;
  muscleGroup?: MuscleGroup;
  sets: ExerciseSet[];
};

export type Workout = {
  id: string;
  name: string;
  image?: string;
  exercises: Exercise[];
};

export type WeightEntry = {
  id: string;
  date: string;
  kg: number;
};

export type WorkoutSession = {
  id: string;
  workoutId: string;
  workoutName: string;
  startedAt: string;
  finishedAt?: string;
  durationSec?: number;
  totalVolume?: number;
};

const WORKOUTS_KEY = "WORKOUTS";
const WEIGHTS_KEY = "WEIGHT_LOG";
const SESSIONS_KEY = "SESSIONS";

// ---------- WORKOUTS ----------

export async function getWorkouts(): Promise<Workout[]> {
  const raw = await AsyncStorage.getItem(WORKOUTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveWorkouts(list: Workout[]): Promise<void> {
  await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(list));
}

export async function getWorkout(id: string): Promise<Workout | null> {
  const list = await getWorkouts();
  return list.find((w) => w.id === id) ?? null;
}

export async function addWorkout(workout: Workout): Promise<void> {
  const list = await getWorkouts();
  list.push(workout);
  await saveWorkouts(list);
}

export async function updateWorkout(
  id: string,
  patch: Partial<Omit<Workout, "id">>
): Promise<void> {
  const list = await getWorkouts();
  const updated = list.map((w) => (w.id === id ? { ...w, ...patch } : w));
  await saveWorkouts(updated);
}

export async function deleteWorkout(id: string): Promise<void> {
  const list = await getWorkouts();
  await saveWorkouts(list.filter((w) => w.id !== id));
}

export async function addExercise(
  workoutId: string,
  exercise: Exercise
): Promise<void> {
  const list = await getWorkouts();
  const updated = list.map((w) =>
    w.id === workoutId
      ? { ...w, exercises: [...w.exercises, exercise] }
      : w
  );
  await saveWorkouts(updated);
}

export async function deleteExercise(
  workoutId: string,
  exerciseId: string
): Promise<void> {
  const list = await getWorkouts();
  const updated = list.map((w) =>
    w.id === workoutId
      ? { ...w, exercises: w.exercises.filter((e) => e.id !== exerciseId) }
      : w
  );
  await saveWorkouts(updated);
}

export async function updateExerciseSets(
  workoutId: string,
  exerciseId: string,
  sets: ExerciseSet[]
): Promise<void> {
  const list = await getWorkouts();
  const updated = list.map((w) =>
    w.id === workoutId
      ? {
          ...w,
          exercises: w.exercises.map((e) =>
            e.id === exerciseId ? { ...e, sets } : e
          ),
        }
      : w
  );
  await saveWorkouts(updated);
}

// ---------- WEIGHT LOG ----------

export async function getWeightLog(): Promise<WeightEntry[]> {
  const raw = await AsyncStorage.getItem(WEIGHTS_KEY);
  const list: WeightEntry[] = raw ? JSON.parse(raw) : [];
  return list.sort((a, b) => a.date.localeCompare(b.date));
}

export async function addWeightEntry(entry: WeightEntry): Promise<void> {
  const list = await getWeightLog();
  const existing = list.find((e) => e.date === entry.date);
  const updated = existing
    ? list.map((e) => (e.date === entry.date ? entry : e))
    : [...list, entry];
  await AsyncStorage.setItem(WEIGHTS_KEY, JSON.stringify(updated));
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const list = await getWeightLog();
  await AsyncStorage.setItem(
    WEIGHTS_KEY,
    JSON.stringify(list.filter((e) => e.id !== id))
  );
}

// ---------- SESSIONS ----------

export async function getSessions(): Promise<WorkoutSession[]> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function addSession(session: WorkoutSession): Promise<void> {
  const list = await getSessions();
  list.push(session);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(list));
}

// ---------- EXPORT / IMPORT ----------

export type ExportPayload = {
  version: 1;
  exportedAt: string;
  workouts: Workout[];
  weights: WeightEntry[];
  sessions: WorkoutSession[];
  water: {
    daily: number;
    goal: number;
    history: unknown[];
    lastDate: string | null;
  };
};

export async function exportAll(): Promise<ExportPayload> {
  const [workouts, weights, sessions, waterDaily, waterGoal, waterHistory, lastDate] =
    await Promise.all([
      getWorkouts(),
      getWeightLog(),
      getSessions(),
      AsyncStorage.getItem("DAILY_WATER"),
      AsyncStorage.getItem("WATER_GOAL"),
      AsyncStorage.getItem("WATER_HISTORY"),
      AsyncStorage.getItem("LAST_WATER_DATE"),
    ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    workouts,
    weights,
    sessions,
    water: {
      daily: waterDaily ? Number(waterDaily) : 0,
      goal: waterGoal ? Number(waterGoal) : 2500,
      history: waterHistory ? JSON.parse(waterHistory) : [],
      lastDate,
    },
  };
}

export async function importAll(payload: ExportPayload): Promise<void> {
  if (payload.version !== 1) {
    throw new Error("Unsupported export version");
  }
  await Promise.all([
    saveWorkouts(payload.workouts ?? []),
    AsyncStorage.setItem(WEIGHTS_KEY, JSON.stringify(payload.weights ?? [])),
    AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(payload.sessions ?? [])),
    AsyncStorage.setItem("DAILY_WATER", String(payload.water?.daily ?? 0)),
    AsyncStorage.setItem("WATER_GOAL", String(payload.water?.goal ?? 2500)),
    AsyncStorage.setItem(
      "WATER_HISTORY",
      JSON.stringify(payload.water?.history ?? [])
    ),
    payload.water?.lastDate
      ? AsyncStorage.setItem("LAST_WATER_DATE", payload.water.lastDate)
      : AsyncStorage.removeItem("LAST_WATER_DATE"),
  ]);
}
