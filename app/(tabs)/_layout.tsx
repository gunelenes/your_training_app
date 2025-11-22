import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#667EEA",
          tabBarInactiveTintColor: "#6E7178",
          tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            height: 70,
            backgroundColor: Platform.OS === 'ios' ? 'rgba(26, 28, 30, 0.8)' : '#1A1C1E',
            borderRadius: 25,
            borderTopWidth: 0,
            paddingBottom: 10,
            paddingTop: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
            marginTop: 4,
          },
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : null,
        }}
      >

        {/* 🔥 Home / Workouts */}
        <Tabs.Screen
          name="index"
          options={{
            title: t("my_workouts"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.iconContainer,
                focused && styles.iconContainerActive
              ]}>
                {focused && (
                  <View style={styles.activeIndicator} />
                )}
                <Ionicons
                  name={focused ? "barbell" : "barbell-outline"}
                  size={28}
                  color={color}
                />
              </View>
            ),
          }}
        />

        {/* 💦 Water Tracking */}
        <Tabs.Screen
          name="water"
          options={{
            title: t("water"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.iconContainer,
                focused && styles.iconContainerActive
              ]}>
                {focused && (
                  <View style={styles.activeIndicator} />
                )}

                <Ionicons
                  name={focused ? "water" : "water-outline"}
                  size={26}
                  color={color}
                />
              </View>
            ),
          }}
        />

        {/* 👤 Profile */}
        <Tabs.Screen
          name="profile"
          options={{
            title: t("profile"),
            tabBarIcon: ({ color, focused }) => (
              <View style={[
                styles.iconContainer,
                focused && styles.iconContainerActive
              ]}>
                {focused && (
                  <View style={styles.activeIndicator} />
                )}
                <Ionicons
                  name={focused ? "person" : "person-outline"}
                  size={26}
                  color={color}
                />
              </View>
            ),
          }}
        />

      </Tabs>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },

  iconContainerActive: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderRadius: 16,
  },

  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 30,
    height: 4,
    backgroundColor: '#667EEA',
    borderRadius: 2,
  },
});
