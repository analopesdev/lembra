import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { createBackup, restoreBackup } from "@/data/backup";
import { getContainer } from "@/data/container";
import { cardsToCsv, parseBackup, serializeBackup } from "@/domain/backup/backup";

import { pickText, saveText } from "./backupIo";

export interface BackupActions {
  busy: boolean;
  message: string | null;
  exportJson: () => Promise<void>;
  exportCsv: () => Promise<void>;
  importJson: () => Promise<void>;
}

function stamp(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function useBackupActions(): BackupActions {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const run = useCallback(
    async (job: () => Promise<string | null>) => {
      setBusy(true);
      setMessage(null);
      try {
        setMessage(await job());
      } catch {
        setMessage(t("backup.failed"));
      } finally {
        setBusy(false);
      }
    },
    [t],
  );

  const exportJson = useCallback(
    () =>
      run(async () => {
        const c = await getContainer();
        const file = await createBackup(c);
        await saveText(`lembra-backup-${stamp(c.now())}.json`, serializeBackup(file), "application/json");
        return t("backup.exported", { count: file.cards.length });
      }),
    [run, t],
  );

  const exportCsv = useCallback(
    () =>
      run(async () => {
        const c = await getContainer();
        const file = await createBackup(c);
        await saveText(
          `lembra-cards-${stamp(c.now())}.csv`,
          cardsToCsv(file.cards, file.collections),
          "text/csv",
        );
        return t("backup.exportedCsv", { count: file.cards.length });
      }),
    [run, t],
  );

  const importJson = useCallback(
    () =>
      run(async () => {
        const text = await pickText();
        if (text === null) return null;
        const parsed = parseBackup(text);
        if (!parsed.ok) return t(`backup.errors.${parsed.error}`);
        const c = await getContainer();
        const summary = await restoreBackup(c, parsed.file);
        return t("backup.restored", {
          cards: summary.cards,
          reviews: summary.reviews,
          collections: summary.collections,
        });
      }),
    [run, t],
  );

  return { busy, message, exportJson, exportCsv, importJson };
}
