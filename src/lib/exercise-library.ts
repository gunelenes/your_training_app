import type { MuscleGroup } from "./storage";

export type LibraryExercise = {
  name: string;
  muscleGroup: MuscleGroup;
};

export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // Chest
  { name: "Bench Press", muscleGroup: "chest" },
  { name: "Incline Dumbbell Press", muscleGroup: "chest" },
  { name: "Dumbbell Fly", muscleGroup: "chest" },
  { name: "Push-Up", muscleGroup: "chest" },
  { name: "Cable Crossover", muscleGroup: "chest" },
  { name: "Dips", muscleGroup: "chest" },

  // Back
  { name: "Deadlift", muscleGroup: "back" },
  { name: "Pull-Up", muscleGroup: "back" },
  { name: "Barbell Row", muscleGroup: "back" },
  { name: "Lat Pulldown", muscleGroup: "back" },
  { name: "Seated Cable Row", muscleGroup: "back" },
  { name: "T-Bar Row", muscleGroup: "back" },

  // Shoulders
  { name: "Overhead Press", muscleGroup: "shoulders" },
  { name: "Lateral Raise", muscleGroup: "shoulders" },
  { name: "Rear Delt Fly", muscleGroup: "shoulders" },
  { name: "Arnold Press", muscleGroup: "shoulders" },
  { name: "Face Pull", muscleGroup: "shoulders" },

  // Biceps
  { name: "Barbell Curl", muscleGroup: "biceps" },
  { name: "Dumbbell Curl", muscleGroup: "biceps" },
  { name: "Hammer Curl", muscleGroup: "biceps" },
  { name: "Preacher Curl", muscleGroup: "biceps" },

  // Triceps
  { name: "Triceps Pushdown", muscleGroup: "triceps" },
  { name: "Skull Crusher", muscleGroup: "triceps" },
  { name: "Overhead Triceps Extension", muscleGroup: "triceps" },
  { name: "Close-Grip Bench Press", muscleGroup: "triceps" },

  // Legs
  { name: "Squat", muscleGroup: "legs" },
  { name: "Front Squat", muscleGroup: "legs" },
  { name: "Leg Press", muscleGroup: "legs" },
  { name: "Romanian Deadlift", muscleGroup: "legs" },
  { name: "Lunges", muscleGroup: "legs" },
  { name: "Leg Curl", muscleGroup: "legs" },
  { name: "Leg Extension", muscleGroup: "legs" },
  { name: "Calf Raise", muscleGroup: "legs" },

  // Glutes
  { name: "Hip Thrust", muscleGroup: "glutes" },
  { name: "Glute Bridge", muscleGroup: "glutes" },
  { name: "Bulgarian Split Squat", muscleGroup: "glutes" },

  // Core
  { name: "Plank", muscleGroup: "core" },
  { name: "Crunches", muscleGroup: "core" },
  { name: "Hanging Leg Raise", muscleGroup: "core" },
  { name: "Cable Woodchopper", muscleGroup: "core" },
  { name: "Ab Wheel Rollout", muscleGroup: "core" },

  // Cardio
  { name: "Treadmill", muscleGroup: "cardio" },
  { name: "Cycling", muscleGroup: "cardio" },
  { name: "Rowing", muscleGroup: "cardio" },
  { name: "Jump Rope", muscleGroup: "cardio" },
];

export const MUSCLE_GROUP_META: Record<
  MuscleGroup,
  { emoji: string; color: string }
> = {
  chest: { emoji: "🎯", color: "#FF6B6B" },
  back: { emoji: "🔷", color: "#4ECDC4" },
  shoulders: { emoji: "🔺", color: "#FFD93D" },
  biceps: { emoji: "💪", color: "#95E1D3" },
  triceps: { emoji: "🔨", color: "#F38181" },
  legs: { emoji: "🦵", color: "#AA96DA" },
  glutes: { emoji: "🍑", color: "#FCBAD3" },
  core: { emoji: "⚡", color: "#C6FF00" },
  cardio: { emoji: "🏃", color: "#FF9F1C" },
  other: { emoji: "🏋️", color: "#8B9096" },
};

export function searchLibrary(query: string): LibraryExercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return EXERCISE_LIBRARY.filter((e) =>
    e.name.toLowerCase().includes(q)
  ).slice(0, 8);
}

export function inferMuscleGroup(name: string): MuscleGroup {
  const match = EXERCISE_LIBRARY.find(
    (e) => e.name.toLowerCase() === name.trim().toLowerCase()
  );
  return match?.muscleGroup ?? "other";
}
