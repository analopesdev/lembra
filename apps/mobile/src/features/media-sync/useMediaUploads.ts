import { useEffect } from "react";
import { AppState } from "react-native";
import { getContainer } from "@/data/container";
import { uploadPending } from "@/data/media/upload";

function run() {
  void getContainer()
    .then((c) => uploadPending(c.media))
    .catch(() => undefined);
}

export function useMediaUploads() {
  useEffect(() => {
    run();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => sub.remove();
  }, []);
}
