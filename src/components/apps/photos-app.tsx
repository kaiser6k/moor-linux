import { useMemo, useRef, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { fileToContent, isDataUrl, isImageName, saveToPhone } from "@/lib/device";
import { HOME, listDir } from "@/lib/fs";
import { useMoor } from "@/lib/store";

const DIR = `${HOME}/Pictures`;

export function PhotosApp() {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const remove = useMoor((s) => s.remove);
  const importRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const pics = useMemo(
    () =>
      (listDir(fs, DIR) ?? []).filter(
        (e) => e.node.kind === "file" && (isImageName(e.name) || isDataUrl(e.node.content)),
      ),
    [fs],
  );
  const current = pics.find((p) => p.name === view);

  async function onImport(files: FileList | null) {
    if (!files?.length) return;
    let n = 0;
    for (const file of Array.from(files)) {
      try {
        writeFile(`${DIR}/${file.name.replace(/[/\\]/g, "-")}`, await fileToContent(file));
        n += 1;
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Import failed");
      }
    }
    if (n) setStatus(`Imported ${n} photo${n === 1 ? "" : "s"}`);
  }

  return (
    <AppShell
      bar={
        <>
          <span className="flex-1 text-xs text-muted">{pics.length} in Pictures</span>
          <BarBtn onClick={() => importRef.current?.click()}>Import from phone</BarBtn>
          {current?.node.kind === "file" ? (
            <>
              <BarBtn
                onClick={() => {
                  if (current.node.kind !== "file") return;
                  void saveToPhone(current.name, current.node.content);
                }}
              >
                Save to phone
              </BarBtn>
              <BarBtn
                danger
                onClick={() => {
                  remove(`${DIR}/${current.name}`);
                  setView(null);
                }}
              >
                Delete
              </BarBtn>
            </>
          ) : null}
          <input
            ref={importRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void onImport(e.target.files);
              e.target.value = "";
            }}
          />
        </>
      }
    >
      {status ? <p className="px-3 py-2 text-xs text-muted">{status}</p> : null}
      {current?.node.kind === "file" ? (
        <button type="button" className="flex h-full w-full items-center justify-center bg-crust p-3" onClick={() => setView(null)}>
          {isDataUrl(current.node.content) ? (
            <img src={current.node.content} alt={current.name} className="max-h-full max-w-full object-contain" />
          ) : (
            <p className="text-sm text-muted">{current.name} is not an image file.</p>
          )}
        </button>
      ) : (
        <ul className="grid grid-cols-3 gap-2 p-3 sm:grid-cols-4">
          {pics.length === 0 ? (
            <li className="col-span-full py-12 text-center text-sm text-muted">
              Import photos from the phone. They stay in this session and can be saved back to Files or Photos.
            </li>
          ) : (
            pics.map((p) => (
              <li key={p.name}>
                <button
                  type="button"
                  onClick={() => setView(p.name)}
                  className="block aspect-square w-full overflow-hidden rounded-md bg-overlay"
                >
                  {p.node.kind === "file" && isDataUrl(p.node.content) ? (
                    <img src={p.node.content} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center px-1 text-xs text-muted">{p.name}</span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </AppShell>
  );
}
