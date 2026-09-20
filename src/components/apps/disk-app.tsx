import { HOME, getNode, nodeSize, type FsDir } from "@/lib/fs";
import { useMoor } from "@/lib/store";

function fmt(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DiskApp() {
  const fs = useMoor((s) => s.fs);
  const home = getNode(fs, HOME);
  const total = nodeSize(fs);
  const entries =
    home?.kind === "dir"
      ? Object.entries(home.children)
          .map(([name, node]) => ({ name, size: nodeSize(node), dir: node.kind === "dir" }))
          .sort((a, b) => b.size - a.size)
      : [];
  const max = Math.max(1, ...entries.map((e) => e.size));

  return (
    <div className="h-full overflow-auto bg-bg p-5">
      <h1 className="text-lg font-semibold">Disks</h1>
      <p className="mt-1 text-sm text-muted">Session storage · {fmt(total)} used</p>
      <ul className="mt-5 space-y-3">
        {entries.map((e) => (
          <li key={e.name}>
            <div className="flex justify-between text-sm">
              <span>
                {e.name}
                {e.dir ? "/" : ""}
              </span>
              <span className="tabular-nums text-muted">{fmt(e.size)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-overlay">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(e.size / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <RootHint root={fs} />
    </div>
  );
}

function RootHint({ root }: { root: FsDir }) {
  const etc = nodeSize(getNode(root, "/etc") ?? { kind: "dir", children: {} });
  const usr = nodeSize(getNode(root, "/usr") ?? { kind: "dir", children: {} });
  return (
    <p className="mt-6 text-xs text-muted">
      System · /etc {fmt(etc)} · /usr {fmt(usr)}. Media imports are stored on this device, not in iCloud, until you
      Save to phone.
    </p>
  );
}
