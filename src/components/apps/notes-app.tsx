import { useMemo, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { saveToPhone } from "@/lib/device";
import { HOME, listDir } from "@/lib/fs";
import { useMoor } from "@/lib/store";

const NOTES = `${HOME}/Notes`;

export function NotesApp() {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const remove = useMoor((s) => s.remove);
  const mkdir = useMoor((s) => s.mkdir);
  const entries = useMemo(
    () => (listDir(fs, NOTES) ?? []).filter((e) => e.node.kind === "file"),
    [fs],
  );
  const [active, setActive] = useState(entries[0]?.name ?? "getting-started.txt");
  const path = `${NOTES}/${active}`;
  const node = entries.find((e) => e.name === active)?.node;
  const text = node?.kind === "file" ? node.content : "";

  return (
    <AppShell
      bar={
        <>
          <BarBtn
            onClick={() => {
              mkdir(NOTES);
              const name = `note-${Date.now().toString(36)}.txt`;
              writeFile(`${NOTES}/${name}`, "");
              setActive(name);
            }}
          >
            New
          </BarBtn>
          <BarBtn
            onClick={() => {
              if (!active) return;
              void saveToPhone(active, text);
            }}
          >
            Save to phone
          </BarBtn>
          <BarBtn
            danger
            onClick={() => {
              if (!active) return;
              remove(path);
              setActive(entries.find((e) => e.name !== active)?.name ?? "");
            }}
          >
            Delete
          </BarBtn>
        </>
      }
    >
      <div className="flex h-full min-h-0">
        <ul className="w-40 shrink-0 overflow-auto border-r border-border p-2">
          {entries.map((e) => (
            <li key={e.name}>
              <button
                type="button"
                onClick={() => setActive(e.name)}
                className={`w-full truncate rounded-sm px-2 py-2 text-left text-xs ${
                  e.name === active ? "bg-overlay text-fg" : "text-muted hover:bg-overlay"
                }`}
              >
                {e.name}
              </button>
            </li>
          ))}
        </ul>
        <textarea
          value={text}
          onChange={(e) => writeFile(path, e.target.value)}
          placeholder="Write a note"
          className="min-h-0 flex-1 resize-none bg-crust p-3 text-sm outline-none"
        />
      </div>
    </AppShell>
  );
}
