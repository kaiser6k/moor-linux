import { useRef, useState } from "react";
import { ChevronRight, FileText, Folder, Home, Image, Music, Video } from "lucide-react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { isAudioName, isImageName, isVideoName, fileToContent, saveToPhone } from "@/lib/device";
import { HOME, baseName, listDir, parentPath, resolvePath } from "@/lib/fs";
import { appForPath } from "@/lib/open-path";
import { useMoor } from "@/lib/store";

export function FilesApp() {
  const fs = useMoor((s) => s.fs);
  const openApp = useMoor((s) => s.openApp);
  const writeFile = useMoor((s) => s.writeFile);
  const mkdir = useMoor((s) => s.mkdir);
  const remove = useMoor((s) => s.remove);
  const [path, setPath] = useState(HOME);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const entries = listDir(fs, path) ?? [];
  const crumbs = path === "/" ? [""] : path.split("/").filter(Boolean);

  function iconFor(name: string, dir: boolean) {
    if (dir) return Folder;
    if (isImageName(name)) return Image;
    if (isAudioName(name)) return Music;
    if (isVideoName(name)) return Video;
    return FileText;
  }

  async function onImport(files: FileList | null) {
    if (!files?.length) return;
    let n = 0;
    for (const file of Array.from(files)) {
      try {
        const content = await fileToContent(file);
        writeFile(`${path}/${file.name.replace(/[/\\]/g, "-")}`, content);
        n += 1;
      } catch (err) {
        setStatus(err instanceof Error ? err.message : "Import failed");
      }
    }
    if (n) setStatus(`Imported ${n} file${n === 1 ? "" : "s"} into ${path}`);
  }

  async function saveSelected() {
    if (!selected) return;
    const node = entries.find((e) => resolvePath(path, e.name) === selected)?.node;
    if (!node || node.kind !== "file") {
      setStatus("Select a file to save onto the phone");
      return;
    }
    const how = await saveToPhone(baseName(selected), node.content);
    setStatus(how === "shared" ? "Share sheet opened — Save to Files or Photos" : "Download started");
  }

  return (
    <AppShell
      bar={
        <>
          <button
            type="button"
            className="rounded-sm p-1 text-muted hover:bg-overlay hover:text-fg"
            onClick={() => {
              setPath(HOME);
              setSelected(null);
            }}
            aria-label="Home"
          >
            <Home className="size-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-auto text-sm">
            {crumbs.map((c, i) => {
              const next = "/" + crumbs.slice(0, i + 1).join("/");
              return (
                <span key={next} className="flex items-center gap-1">
                  <ChevronRight className="size-3 text-muted" />
                  <button
                    type="button"
                    className="hover:text-primary"
                    onClick={() => {
                      setPath(next || "/");
                      setSelected(null);
                    }}
                  >
                    {c || "/"}
                  </button>
                </span>
              );
            })}
          </div>
          <BarBtn
            onClick={() => {
              const name = window.prompt("Folder name");
              if (!name) return;
              mkdir(resolvePath(path, name.trim()));
            }}
          >
            New folder
          </BarBtn>
          <BarBtn onClick={() => importRef.current?.click()}>Import from phone</BarBtn>
          <BarBtn disabled={!selected} onClick={() => void saveSelected()}>
            Save to phone
          </BarBtn>
          <BarBtn
            danger
            disabled={!selected}
            onClick={() => {
              if (!selected) return;
              remove(selected);
              setSelected(null);
            }}
          >
            Delete
          </BarBtn>
          <input
            ref={importRef}
            type="file"
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
      {status ? <p className="border-b border-border px-3 py-2 text-xs text-muted">{status}</p> : null}
      <ul className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-3">
        {path !== "/" ? (
          <li>
            <button
              type="button"
              onClick={() => {
                setPath(parentPath(path));
                setSelected(null);
              }}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm hover:bg-overlay"
            >
              <Folder className="size-4 text-muted" />
              ..
            </button>
          </li>
        ) : null}
        {entries.map((entry) => {
          const next = resolvePath(path, entry.name);
          const Icon = iconFor(entry.name, entry.node.kind === "dir");
          const active = selected === next;
          return (
            <li key={entry.name}>
              <button
                type="button"
                onClick={() => {
                  if (entry.node.kind === "dir") {
                    setPath(next);
                    setSelected(null);
                    return;
                  }
                  if (selected === next) openApp(appForPath(next), next);
                  else setSelected(next);
                }}
                className={`flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left text-sm ${
                  active ? "bg-overlay text-fg" : "hover:bg-overlay"
                }`}
              >
                <Icon className={`size-4 ${entry.node.kind === "dir" ? "text-primary" : "text-muted"}`} />
                <span className="truncate">{entry.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="px-3 pb-3 text-xs text-muted">
        Tap a file to select it, tap again to open. Save to phone uses the iOS share sheet.
      </p>
    </AppShell>
  );
}
