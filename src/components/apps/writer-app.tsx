import { useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { saveToPhone } from "@/lib/device";
import { HOME, getNode } from "@/lib/fs";
import { useMoor } from "@/lib/store";

const PATH = `${HOME}/Documents/draft.md`;

export function WriterApp() {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const node = getNode(fs, PATH);
  const stored = node?.kind === "file" ? node.content : "# Untitled\n\n";
  const [text, setText] = useState(stored);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <AppShell
      bar={
        <>
          <span className="flex-1 text-xs text-muted">{PATH}</span>
          <span className="text-xs text-muted">{words} words</span>
          <BarBtn
            onClick={() => {
              writeFile(PATH, text);
            }}
          >
            Save
          </BarBtn>
          <BarBtn onClick={() => void saveToPhone("draft.md", text)}>Save to phone</BarBtn>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-full min-h-full w-full resize-none bg-crust p-5 text-base leading-relaxed outline-none"
      />
    </AppShell>
  );
}
