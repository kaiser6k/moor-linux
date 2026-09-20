import { useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { saveToPhone } from "@/lib/device";
import { HOME } from "@/lib/fs";
import { WALLPAPERS } from "@/lib/apps";
import { useMoor } from "@/lib/store";

export function ScreenshotApp() {
  const windows = useMoor((s) => s.windows);
  const wallpaperId = useMoor((s) => s.wallpaperId);
  const writeFile = useMoor((s) => s.writeFile);
  const [status, setStatus] = useState<string | null>(null);
  const paper = WALLPAPERS.find((w) => w.id === wallpaperId);

  async function capture(): Promise<string> {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No canvas");
    ctx.fillStyle = "#0b0d12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (paper?.src) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("wallpaper"));
        img.src = paper.src!;
      });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = "rgba(11,13,18,0.28)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const open = windows.filter((w) => !w.minimized);
    open.forEach((w, i) => {
      const x = 48 + (i % 3) * 390;
      const y = 64 + Math.floor(i / 3) * 210;
      ctx.fillStyle = "rgba(26,30,40,0.92)";
      ctx.fillRect(x, y, 360, 180);
      ctx.strokeStyle = "rgba(94,224,196,0.35)";
      ctx.strokeRect(x, y, 360, 180);
      ctx.fillStyle = "#e8edf7";
      ctx.font = "16px Outfit, sans-serif";
      ctx.fillText(w.title, x + 16, y + 32);
    });
    ctx.fillStyle = "#5ee0c4";
    ctx.font = "12px IBM Plex Mono, monospace";
    ctx.fillText(`moor · ${new Date().toISOString()}`, 48, 700);
    return canvas.toDataURL("image/png");
  }

  async function run(dest: "pictures" | "phone") {
    try {
      const data = await capture();
      const name = `session-${Date.now().toString(36)}.png`;
      if (dest === "pictures") {
        writeFile(`${HOME}/Pictures/${name}`, data);
        setStatus(`Saved ${name} to Pictures`);
      } else {
        await saveToPhone(name, data);
        setStatus("Share sheet opened");
      }
    } catch {
      setStatus("Could not capture");
    }
  }

  return (
    <AppShell
      bar={
        <>
          <span className="flex-1 text-xs text-muted">Capture this session</span>
          <BarBtn onClick={() => void run("pictures")}>Save to Pictures</BarBtn>
          <BarBtn onClick={() => void run("phone")}>Save to phone</BarBtn>
        </>
      }
    >
      <div className="p-5">
        <p className="text-sm leading-relaxed text-muted">
          Captures the wallpaper and open windows into a PNG. Save it into Pictures in this session, or onto the phone
          via the share sheet.
        </p>
        <ul className="mt-4 space-y-1 text-sm">
          {windows.filter((w) => !w.minimized).map((w) => (
            <li key={w.id} className="text-muted">
              {w.title}
            </li>
          ))}
        </ul>
        {status ? <p className="mt-4 text-xs text-primary">{status}</p> : null}
      </div>
    </AppShell>
  );
}
