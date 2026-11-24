import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal } from "react-native";

import { ProfileScreen } from "@/features/settings";
import { TodayScreen } from "@/features/today";

export default function Index() {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  return (
    <>
      <TodayScreen
        onStartSession={() => router.push("/revisao/sessao")}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <Modal
        visible={profileOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProfileOpen(false)}
      >
        <ProfileScreen onBack={() => setProfileOpen(false)} />
      </Modal>
    </>
  );
}
