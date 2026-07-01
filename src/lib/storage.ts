import AsyncStorage from "@react-native-async-storage/async-storage";

export type ExerciseSet = {
  id: string;
  weight: string;
  reps: string;
  date: string;
};

export type Exercise = {
  id: string;
  name: string;
  image?: string | null;
  sets: ExerciseSet[];
};

export type Workout = {
  id: string;
  name: string;
  image?: string;
  exercises: Exercise[];
};

const WORKOUTS_KEY = "WORKOUTS";

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
