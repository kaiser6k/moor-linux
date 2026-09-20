import { useEffect, useRef, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { saveToPhone } from "@/lib/device";
import { HOME } from "@/lib/fs";
import { useMoor } from "@/lib/store";

const COLORS = ["#e8edf7", "#5ee0c4", "#f07178", "#e6b450", "#9ece6a", "#0b0d12"];

export function PaintApp() {
  const writeFile = useMoor((s) => s.writeFile);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [color, setColor] = useState(COLORS[0]!);
  const [size, setSize] = useState(4);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#12151c";
    ctx.fillRect(0, 0, c.width, c.height);
  }, []);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  }

  function paint(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  function snapshot(): string {
    return canvasRef.current?.toDataURL("image/png") ?? "";
  }

  return (
    <AppShell
      bar={
        <>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className="h-5 w-5 rounded-full border border-border"
              style={{ background: c, outline: color === c ? "2px solid var(--color-primary)" : undefined }}
            />
          ))}
          <input
            type="range"
            min={2}
            max={18}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-24"
          />
          <BarBtn
            onClick={() => {
              const data = snapshot();
              const name = `sketch-${Date.now().toString(36)}.png`;
              writeFile(`${HOME}/Pictures/${name}`, data);
              setStatus(`Saved ${name} to Pictures`);
            }}
          >
            Save to Pictures
          </BarBtn>
          <BarBtn
            onClick={() => {
              const data = snapshot();
              void saveToPhone(`sketch-${Date.now().toString(36)}.png`, data);
            }}
          >
            Save to phone
          </BarBtn>
        </>
      }
    >
      {status ? <p className="px-3 py-2 text-xs text-muted">{status}</p> : null}
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="h-full w-full touch-none bg-crust"
        onPointerDown={(e) => {
          drawing.current = true;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          paint(e);
        }}
        onPointerMove={paint}
        onPointerUp={() => {
          drawing.current = false;
        }}
      />
    </AppShell>
  );
}
