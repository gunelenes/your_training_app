import { theme } from "@/constants/theme";
import { hapticSuccess, hapticTap } from "@/src/lib/haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  initialSeconds: number;
  onClose: () => void;
};

const PRESETS = [30, 60, 90, 120, 180];

export default function RestTimer({ visible, initialSeconds, onClose }: Props) {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(initialSeconds);
  const [running, setRunning] = useState(true);
  const [target, setTarget] = useState(initialSeconds);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setRemaining(initialSeconds);
      setTarget(initialSeconds);
      setRunning(true);
    }
  }, [visible, initialSeconds]);

  useEffect(() => {
    if (!visible || !running) return;
    if (remaining <= 0) return;

    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          hapticSuccess();
          Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.15, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
          ]).start();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, running, remaining, scaleAnim]);

  const setPreset = (s: number) => {
    hapticTap();
    setTarget(s);
    setRemaining(s);
    setRunning(true);
  };

  const toggle = () => {
    hapticTap();
    setRunning((r) => !r);
  };

  const reset = () => {
    hapticTap();
    setRemaining(target);
    setRunning(true);
  };

  const add = (delta: number) => {
    hapticTap();
    setRemaining((r) => Math.max(0, r + delta));
  };

  const progress = target > 0 ? 1 - remaining / target : 0;
  const isDone = remaining === 0;

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const display = `${mm}:${ss.toString().padStart(2, "0")}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.label}>{t("rest_timer")}</Text>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Text style={[styles.time, isDone && styles.timeDone]}>
              {display}
            </Text>
          </Animated.View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(progress * 100, 100)}%` },
              ]}
            />
          </View>

          <View style={styles.presetRow}>
            {PRESETS.map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setPreset(s)}
                style={[
                  styles.presetBtn,
                  target === s && styles.presetBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    target === s && styles.presetTextActive,
                  ]}
                >
                  {s}s
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.controlRow}>
            <TouchableOpacity onPress={() => add(-15)} style={styles.stepBtn}>
              <Text style={styles.stepText}>-15</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={toggle} style={styles.mainBtn}>
              <LinearGradient
                colors={[theme.color.accent, theme.color.accentPressed]}
                style={styles.mainBtnGradient}
              >
                <Text style={styles.mainBtnText}>
                  {isDone ? "↻" : running ? "❚❚" : "▶"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => add(15)} style={styles.stepBtn}>
              <Text style={styles.stepText}>+15</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <TouchableOpacity onPress={reset} style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>{t("reset")}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.footerBtn}>
              <Text style={styles.footerBtnText}>{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: theme.color.surface,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.space.xxl,
    paddingBottom: 40,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.color.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: theme.space.xl,
  },

  label: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    textAlign: "center",
    marginBottom: theme.space.md,
  },

  time: {
    color: theme.color.text,
    fontSize: 72,
    fontWeight: theme.font.weight.bold,
    textAlign: "center",
    letterSpacing: -2,
    fontVariant: ["tabular-nums"],
  },

  timeDone: {
    color: theme.color.accent,
  },

  progressTrack: {
    height: 6,
    backgroundColor: theme.color.border,
    borderRadius: 3,
    marginVertical: theme.space.xl,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: theme.color.accent,
  },

  presetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.space.sm,
    marginBottom: theme.space.xl,
  },

  presetBtn: {
    flex: 1,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    backgroundColor: theme.color.surfaceElevated,
    alignItems: "center",
  },

  presetBtnActive: {
    backgroundColor: theme.color.accentSoft,
  },

  presetText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.sm,
    fontWeight: theme.font.weight.bold,
  },

  presetTextActive: {
    color: theme.color.accent,
  },

  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.space.xl,
    marginBottom: theme.space.xl,
  },

  stepBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.color.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
  },

  stepText: {
    color: theme.color.text,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.bold,
  },

  mainBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
  },

  mainBtnGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  mainBtnText: {
    color: theme.color.bg,
    fontSize: 26,
    fontWeight: theme.font.weight.bold,
  },

  footerRow: {
    flexDirection: "row",
    gap: theme.space.md,
  },

  footerBtn: {
    flex: 1,
    paddingVertical: theme.space.md,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },

  footerBtnText: {
    color: theme.color.textMuted,
    fontSize: theme.font.size.md,
    fontWeight: theme.font.weight.semibold,
  },
});
