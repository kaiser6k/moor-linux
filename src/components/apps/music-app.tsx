import { useMemo, useRef, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { fileToContent, isAudioName, isDataUrl } from "@/lib/device";
import { HOME, listDir } from "@/lib/fs";
import { useMoor } from "@/lib/store";

const DIR = `${HOME}/Music`;

export function MusicApp() {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const importRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const tracks = useMemo(
    () =>
      (listDir(fs, DIR) ?? []).filter(
        (e) => e.node.kind === "file" && (isAudioName(e.name) || isDataUrl(e.node.content)),
      ),
    [fs],
  );
  const playing = tracks.find((t) => t.name === current);

  return (
    <AppShell
      bar={
        <>
          <span className="flex-1 text-xs text-muted">{tracks.length} tracks</span>
          <BarBtn onClick={() => importRef.current?.click()}>Import from phone</BarBtn>
          <input
            ref={importRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files) return;
              let n = 0;
              for (const file of Array.from(files)) {
                try {
                  writeFile(`${DIR}/${file.name.replace(/[/\\]/g, "-")}`, await fileToContent(file));
                  n += 1;
                } catch (err) {
                  setStatus(err instanceof Error ? err.message : "Import failed");
                }
              }
              if (n) setStatus(`Imported ${n}`);
              e.target.value = "";
            }}
          />
        </>
      }
    >
      {status ? <p className="px-3 py-2 text-xs text-muted">{status}</p> : null}
      {playing?.node.kind === "file" && isDataUrl(playing.node.content) ? (
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium">{playing.name}</p>
          <audio src={playing.node.content} controls autoPlay className="mt-2 w-full" />
        </div>
      ) : null}
      <ul className="p-2">
        {tracks.length === 0 ? (
          <li className="px-3 py-10 text-center text-sm text-muted">Import audio from the phone to play it here.</li>
        ) : (
          tracks.map((t) => (
            <li key={t.name}>
              <button
                type="button"
                onClick={() => setCurrent(t.name)}
                className={`w-full rounded-sm px-3 py-2 text-left text-sm ${
                  t.name === current ? "bg-overlay" : "hover:bg-overlay"
                }`}
              >
                {t.name}
              </button>
            </li>
          ))
        )}
      </ul>
    </AppShell>
  );
}
