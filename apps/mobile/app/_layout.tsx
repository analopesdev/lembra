import "@/shared/i18n";

import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { Sora_500Medium, Sora_600SemiBold, Sora_700Bold } from "@expo-google-fonts/sora";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { enableScreens } from "react-native-screens";

import { useApplySettings } from "@/features/settings";

enableScreens(true);

export default function RootLayout() {
  useApplySettings();
  // Manrope para texto e Sora (tabular-nums) para números de dados (DESIGN.md).
  const [loaded, error] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
  });
  if (!loaded && !error) return null; // fontes locais carregam em milissegundos; evita piscar com fonte errada
  return <Stack screenOptions={{ headerShown: false }} />;
}
