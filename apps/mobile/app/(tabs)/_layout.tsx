import { Tabs } from "expo-router";

import { AppTabBar } from "@/features/navigation";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigateToTab }) => (
        <AppTabBar
          activeRoute={state.routes[state.index]?.name ?? "index"}
          onNavigate={(route) => {
            const target = state.routes.find((r) => r.name === route);
            if (target) navigateToTab(target.key);
          }}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="colecoes" />
      <Tabs.Screen name="quizzes" />
      <Tabs.Screen name="progresso" />
    </Tabs>
  );
}
