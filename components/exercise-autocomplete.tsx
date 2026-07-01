import { theme } from "@/constants/theme";
import { hapticSelect } from "@/src/lib/haptics";
import { MUSCLE_GROUP_META, searchLibrary, type LibraryExercise } from "@/src/lib/exercise-library";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  query: string;
  onSelect: (exercise: LibraryExercise) => void;
};

export default function ExerciseAutocomplete({ query, onSelect }: Props) {
  const { t } = useTranslation();
  const suggestions = useMemo(() => searchLibrary(query), [query]);

  if (suggestions.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("suggested")}</Text>
      {suggestions.map((s) => {
        const meta = MUSCLE_GROUP_META[s.muscleGroup];
        return (
          <TouchableOpacity
            key={s.name}
            style={styles.item}
            onPress={() => {
              hapticSelect();
              onSelect(s);
            }}
          >
            <View style={[styles.dot, { backgroundColor: meta.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{s.name}</Text>
              <Text style={styles.group}>
                {meta.emoji} {t(`muscle_${s.muscleGroup}`)}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.space.sm,
    backgroundColor: theme.color.surface,
    borderRadius: theme.radius.md,
    padding: theme.space.sm,
  },
  label: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: theme.space.sm,
    marginBottom: theme.space.sm,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.space.md,
    borderRadius: theme.radius.sm,
    gap: theme.space.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.semibold,
  },
  group: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.xs,
    marginTop: 2,
  },
});
