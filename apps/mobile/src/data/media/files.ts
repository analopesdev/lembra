import { Directory, File, Paths } from "expo-file-system";

export function mediaDir(): Directory {
  const dir = new Directory(Paths.document, "media");
  if (!dir.exists) dir.create();
  return dir;
}

export async function storeLocal(
  id: string,
  sourceUri: string,
  ext: string,
): Promise<{ path: string; bytes: number }> {
  const dest = new File(mediaDir(), `${id}.${ext}`);
  const data = new Uint8Array(await new File(sourceUri).arrayBuffer());
  dest.create({ overwrite: true });
  dest.write(data);
  return { path: dest.uri, bytes: data.byteLength };
}
