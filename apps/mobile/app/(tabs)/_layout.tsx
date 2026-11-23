import { Tabs, useRouter } from "expo-router";

import { AppTabBar } from "@/features/navigation";

export default function TabsLayout() {
  const router = useRouter();
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
          onChoose={(choice) => {
            if (choice === "card") router.push("/card/novo");
            if (choice === "collection") router.push("/colecao/nova");
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
