import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0d6efd",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          height: 80,
          paddingBottom: 15,
          paddingTop: 10,
        },
      }}
    >
      {/* 🔥 Antrenmanlar (Home) */}
      <Tabs.Screen
        name="index"
        options={{
          title: t("my_workouts"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell" size={size + 4} color={color} />
          ),
        }}
      />

      {/* 🔥 Profil */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
