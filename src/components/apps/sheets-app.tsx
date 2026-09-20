import { useMemo, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { saveToPhone } from "@/lib/device";
import { HOME, getNode } from "@/lib/fs";
import { useMoor } from "@/lib/store";

const COLS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const ROWS = 16;
const PATH = `${HOME}/Documents/sheet.csv`;

function emptyGrid(): string[][] {
  return Array.from({ length: ROWS }, () => Array.from({ length: COLS.length }, () => ""));
}

function parseCsv(raw: string): string[][] {
  const grid = emptyGrid();
  raw.split(/\r?\n/).forEach((line, r) => {
    if (r >= ROWS) return;
    line.split(",").forEach((cell, c) => {
      if (c < COLS.length) grid[r]![c] = cell;
    });
  });
  return grid;
}

function toCsv(grid: string[][]): string {
  return grid.map((row) => row.join(",")).join("\n");
}

export function SheetsApp() {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const node = getNode(fs, PATH);
  const initial = useMemo(
    () => (node?.kind === "file" && node.content ? parseCsv(node.content) : emptyGrid()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [grid, setGrid] = useState(initial);

  function setCell(r: number, c: number, value: string) {
    setGrid((g) => g.map((row, i) => (i === r ? row.map((cell, j) => (j === c ? value : cell)) : row)));
  }

  return (
    <AppShell
      bar={
        <>
          <span className="flex-1 text-xs text-muted">Untitled sheet</span>
          <BarBtn
            onClick={() => {
              writeFile(PATH, toCsv(grid));
            }}
          >
            Save
          </BarBtn>
          <BarBtn onClick={() => void saveToPhone("sheet.csv", toCsv(grid))}>Save CSV to phone</BarBtn>
        </>
      }
    >
      <div className="overflow-auto p-2">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-8 text-muted" />
              {COLS.map((c) => (
                <th key={c} className="px-1 py-1 font-medium text-muted">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                <td className="px-1 text-muted">{r + 1}</td>
                {row.map((cell, c) => (
                  <td key={c} className="p-0">
                    <input
                      value={cell}
                      onChange={(e) => setCell(r, c, e.target.value)}
                      className="h-8 w-24 border border-border bg-crust px-1 outline-none focus:border-primary"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
