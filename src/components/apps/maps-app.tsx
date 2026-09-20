import { useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";

type Hit = { display_name: string; boundingbox: string[] };

export function MapsApp() {
  const [q, setQ] = useState("Orlando");
  const [bbox, setBbox] = useState("-81.55,28.40,-81.20,28.65");
  const [status, setStatus] = useState<string | null>(null);

  async function search() {
    setStatus("Searching…");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
      );
      const hits = (await res.json()) as Hit[];
      const hit = hits[0];
      if (!hit) {
        setStatus("No results");
        return;
      }
      const [s, n, w, e] = hit.boundingbox;
      setBbox(`${w},${s},${e},${n}`);
      setStatus(hit.display_name);
    } catch {
      setStatus("Search unavailable");
    }
  }

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`;

  return (
    <AppShell
      bar={
        <>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void search();
            }}
            className="min-w-0 flex-1 rounded-sm border border-border bg-crust px-2 py-1 text-sm outline-none"
            placeholder="Search a place"
          />
          <BarBtn onClick={() => void search()}>Go</BarBtn>
        </>
      }
    >
      {status ? <p className="border-b border-border px-3 py-2 text-xs text-muted">{status}</p> : null}
      <iframe title="Map" src={src} className="h-full w-full border-0 bg-crust" />
    </AppShell>
  );
}
