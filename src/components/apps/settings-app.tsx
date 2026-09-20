import { useState } from "react";
import { BmcButton } from "@/components/bmc-button";
import { GITHUB_URL, WALLPAPERS } from "@/lib/apps";
import { saveToPhone } from "@/lib/device";
import { HOME, walkFiles } from "@/lib/fs";
import { useMoor } from "@/lib/store";
import { cn } from "@/lib/utils";

export function SettingsApp() {
  const wallpaperId = useMoor((s) => s.wallpaperId);
  const setWallpaper = useMoor((s) => s.setWallpaper);
  const resetFs = useMoor((s) => s.resetFs);
  const reboot = useMoor((s) => s.reboot);
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const currentUser = useMoor((s) => s.currentUser);
  const openApp = useMoor((s) => s.openApp);
  const [status, setStatus] = useState<string | null>(null);

  async function exportHome() {
    const files = walkFiles(fs, HOME);
    const payload = JSON.stringify({ version: 1, files }, null, 2);
    await saveToPhone("moor-home.json", payload);
    setStatus("Home backup offered to the phone");
  }

  function importBackup() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text()) as { files?: { path: string; content: string }[] };
        if (!parsed.files) throw new Error("Not a Moor backup");
        for (const f of parsed.files) writeFile(f.path, f.content);
        setStatus(`Restored ${parsed.files.length} files`);
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Import failed");
      }
    };
    input.click();
  }

  return (
    <div className="h-full overflow-auto bg-bg p-5">
      <h1 className="text-lg font-semibold">Settings</h1>
      <section className="mt-5">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Wallpaper</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {WALLPAPERS.map((paper) => (
            <button
              key={paper.id}
              type="button"
              onClick={() => setWallpaper(paper.id)}
              className={cn(
                "overflow-hidden rounded-md border text-left",
                wallpaperId === paper.id ? "border-primary" : "border-border",
              )}
            >
              {paper.src ? (
                <img src={paper.src} alt="" className="h-20 w-full object-cover" />
              ) : (
                <div className="wallpaper-abyss h-20 w-full" />
              )}
              <p className="px-2 py-2 text-xs">{paper.name}</p>
            </button>
          ))}
        </div>
      </section>
      <section className="mt-6">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Phone storage</h2>
        <p className="mt-2 text-sm text-muted">
          Session files live on this device. Use Save to phone in Files to copy them into iOS Files or Photos.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => void exportHome()} className="rounded-md bg-overlay px-3 py-2 text-sm">
            Export home to phone
          </button>
          <button type="button" onClick={importBackup} className="rounded-md bg-overlay px-3 py-2 text-sm">
            Restore backup
          </button>
        </div>
        {status ? <p className="mt-2 text-xs text-muted">{status}</p> : null}
      </section>
      <section className="mt-6">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Session</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">User</dt>
            <dd>{currentUser}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Host</dt>
            <dd>iphone</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Distro</dt>
            <dd>Moor Linux 1.2</dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={() => openApp("users")}
          className="mt-3 rounded-md bg-overlay px-3 py-2 text-sm"
        >
          Users & groups
        </button>
      </section>
      <section className="mt-6">
        <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Support</h2>
        <p className="mt-2 text-sm text-muted">Moor is free. Coffee keeps the lights on.</p>
        <div className="mt-3">
          <BmcButton />
        </div>
      </section>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={reboot} className="rounded-md bg-overlay px-3 py-2 text-sm">
          Reboot session
        </button>
        <button type="button" onClick={resetFs} className="rounded-md bg-overlay px-3 py-2 text-sm">
          Reset files
        </button>
      </div>
      <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="mt-6 inline-block text-xs text-primary">
        github.com/kaiser6k/moor-linux
      </a>
    </div>
  );
}
