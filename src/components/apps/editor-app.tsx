import { useEffect, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { saveToPhone } from "@/lib/device";
import { baseName, getNode, HOME } from "@/lib/fs";
import { useMoor } from "@/lib/store";

export function EditorApp({ path }: { path?: string }) {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const target = path ?? `${HOME}/Documents/welcome.md`;
  const node = getNode(fs, target);
  const initial = node?.kind === "file" ? node.content : "";
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    const n = getNode(useMoor.getState().fs, target);
    setText(n?.kind === "file" ? n.content : "");
    setSaved(true);
  }, [target]);

  if (node && node.kind !== "file") {
    return <p className="p-4 text-sm text-muted">Not a file.</p>;
  }

  return (
    <AppShell
      bar={
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-muted">{target}</span>
          <BarBtn
            disabled={saved}
            onClick={() => {
              writeFile(target, text);
              setSaved(true);
            }}
          >
            {saved ? "Saved" : "Save"}
          </BarBtn>
          <BarBtn onClick={() => void saveToPhone(baseName(target), text)}>Save to phone</BarBtn>
        </>
      }
    >
      <textarea
        value={text}
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        className="h-full min-h-full w-full resize-none bg-crust p-3 font-mono text-sm text-fg outline-none"
      />
    </AppShell>
  );
}
