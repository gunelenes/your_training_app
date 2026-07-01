import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const safe = (fn: () => Promise<void>) => {
  if (Platform.OS === "web") return;
  fn().catch(() => {});
};

export const hapticTap = () =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));

export const hapticSuccess = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

export const hapticWarning = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

export const hapticError = () =>
  safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

export const hapticSelect = () =>
  safe(() => Haptics.selectionAsync());

export const hapticHeavy = () =>
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
