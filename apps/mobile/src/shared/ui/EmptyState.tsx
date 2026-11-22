import { Text, View } from "react-native";

type Props = { title: string; description: string };

/** Estado vazio genérico; não conhece domínio (recebe dados prontos). */
export function EmptyState({ title, description }: Props) {
  return (
    <View
      accessibilityRole="summary"
      className="flex-1 items-center justify-center bg-fundo p-6 dark:bg-fundo-escuro"
    >
      <Text accessibilityRole="header" className="text-2xl font-bold text-texto dark:text-texto-escuro">
        {title}
      </Text>
      <Text className="mt-2 text-center text-base text-suave dark:text-suave-escuro">{description}</Text>
    </View>
  );
}
