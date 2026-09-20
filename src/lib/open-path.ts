import type { AppId } from "./apps";
import { isAudioName, isImageName, isVideoName } from "./device";

export function appForPath(path: string): AppId {
  const name = path.split("/").pop() ?? path;
  if (isImageName(name)) return "photos";
  if (isAudioName(name)) return "music";
  if (isVideoName(name)) return "videos";
  if (/\.(csv|tsv)$/i.test(name)) return "sheets";
  return "editor";
}
