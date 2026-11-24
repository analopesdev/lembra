import * as DocumentPicker from "expo-document-picker";

export async function saveText(name: string, text: string, mime: string): Promise<void> {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export async function pickText(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain", "*/*"],
    multiple: false,
  });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset?.file) return null;
  return asset.file.text();
}
