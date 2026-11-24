import { useLocalSearchParams, useRouter } from "expo-router";

import { CollectionDetailScreen } from "@/features/collections";

export default function CollectionDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <CollectionDetailScreen
      collectionId={id}
      onBack={() => router.back()}
      onEdit={() => router.push(`/colecao/${id}/editar`)}
      onNewCard={() => router.push({ pathname: "/card/novo", params: { collectionId: id } })}
      onStudy={() => router.push("/revisao/sessao")}
      onOpenCard={(cardId) => router.push(`/card/${cardId}`)}
      onDeleted={() => (router.canGoBack() ? router.back() : router.replace("/colecoes"))}
    />
  );
}
