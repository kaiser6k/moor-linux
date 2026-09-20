export function guessMime(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".svg")) return "image/svg+xml";
  if (n.endsWith(".mp3")) return "audio/mpeg";
  if (n.endsWith(".wav")) return "audio/wav";
  if (n.endsWith(".ogg")) return "audio/ogg";
  if (n.endsWith(".m4a")) return "audio/mp4";
  if (n.endsWith(".mp4")) return "video/mp4";
  if (n.endsWith(".webm")) return "video/webm";
  if (n.endsWith(".mov")) return "video/quicktime";
  if (n.endsWith(".csv")) return "text/csv";
  if (n.endsWith(".json")) return "application/json";
  if (n.endsWith(".md")) return "text/markdown";
  if (n.endsWith(".html")) return "text/html";
  if (n.endsWith(".pdf")) return "application/pdf";
  return "text/plain";
}

export function isDataUrl(content: string): boolean {
  return content.startsWith("data:");
}

export function isImageName(name: string): boolean {
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name);
}

export function isAudioName(name: string): boolean {
  return /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(name);
}

export function isVideoName(name: string): boolean {
  return /\.(mp4|webm|mov|m4v)$/i.test(name);
}

export function contentToBlob(filename: string, content: string): Blob {
  if (content.startsWith("data:")) {
    const comma = content.indexOf(",");
    const header = content.slice(5, comma);
    const mime = header.split(";")[0] || guessMime(filename);
    const binary = atob(content.slice(comma + 1));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([content], { type: guessMime(filename) });
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2_000);
}

export async function saveToPhone(filename: string, content: string): Promise<"shared" | "downloaded"> {
  const blob = contentToBlob(filename, content);
  const file = new File([blob], filename, { type: blob.type || guessMime(filename) });
  const payload = { files: [file], title: filename };
  try {
    const nav = navigator as Navigator & { canShare?: (d: { files?: File[] }) => boolean };
    if (typeof nav.share === "function" && (!nav.canShare || nav.canShare(payload))) {
      await nav.share(payload);
      return "shared";
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return "shared";
  }
  downloadBlob(filename, blob);
  return "downloaded";
}

export function pickFiles(accept = "*/*", multiple = true): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.style.position = "fixed";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    const done = (files: File[]) => {
      input.remove();
      resolve(files);
    };
    input.addEventListener("change", () => done(Array.from(input.files ?? [])), { once: true });
    input.addEventListener("cancel", () => done([]), { once: true });
    input.click();
  });
}

const MAX_IMPORT_BYTES = 12 * 1024 * 1024;

export async function fileToContent(file: File): Promise<string> {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error(`${file.name} is larger than 12 MB`);
  }
  if (file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")) {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
  return await file.text();
}
