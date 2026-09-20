import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useMoor, type Win } from "@/lib/store";

const BAR = 32;
const DOCK = 84;

export function WindowFrame({
  win,
  compact,
  children,
}: {
  win: Win;
  compact: boolean;
  children: ReactNode;
}) {
  const focusedId = useMoor((s) => s.focusedId);
  const focusWindow = useMoor((s) => s.focusWindow);
  const moveWindow = useMoor((s) => s.moveWindow);
  const resizeWindow = useMoor((s) => s.resizeWindow);
  const closeWindow = useMoor((s) => s.closeWindow);
  const toggleMax = useMoor((s) => s.toggleMax);
  const toggleMin = useMoor((s) => s.toggleMin);
  const focused = focusedId === win.id;
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const resize = useRef<{ x: number; y: number; w: number; h: number } | null>(null);

  const maximized = compact || win.maximized;

  function onDragStart(e: PointerEvent<HTMLElement>) {
    if (maximized) return;
    if ((e.target as HTMLElement).closest("button")) return;
    focusWindow(win.id);
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDragMove(e: PointerEvent<HTMLElement>) {
    if (!drag.current) return;
    const x = Math.max(-win.w + 80, e.clientX - drag.current.dx);
    const y = Math.max(BAR, Math.min(window.innerHeight - 80, e.clientY - drag.current.dy));
    moveWindow(win.id, x, y);
  }

  function onResizeStart(e: PointerEvent<HTMLElement>) {
    e.stopPropagation();
    focusWindow(win.id);
    resize.current = { x: e.clientX, y: e.clientY, w: win.w, h: win.h };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onResizeMove(e: PointerEvent<HTMLElement>) {
    if (!resize.current) return;
    const w = Math.max(280, resize.current.w + (e.clientX - resize.current.x));
    const h = Math.max(200, resize.current.h + (e.clientY - resize.current.y));
    resizeWindow(win.id, w, h);
  }

  if (win.minimized) return null;

  return (
    <section
      role="dialog"
      aria-label={win.title}
      onPointerDown={() => focusWindow(win.id)}
      className={cn(
        "absolute flex flex-col overflow-hidden bg-surface text-fg",
        maximized ? "rounded-none" : "rounded-md",
        focused ? "border border-primary/70 shadow-lg shadow-crust/50" : "border border-border",
      )}
      style={
        maximized
          ? { left: 0, top: BAR, width: "100%", height: `calc(100% - ${BAR + (compact ? 72 : DOCK)}px)`, zIndex: win.z }
          : { left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }
      }
    >
      <header
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={() => {
          drag.current = null;
        }}
        onDoubleClick={() => toggleMax(win.id)}
        className="flex h-8 shrink-0 cursor-default items-center gap-2 border-b border-border bg-overlay/80 px-2 touch-none select-none"
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label="Close"
            onClick={() => closeWindow(win.id)}
            className="h-2.5 w-2.5 rounded-full bg-danger/90 hover:bg-danger"
          />
          <button
            type="button"
            aria-label="Minimize"
            onClick={() => toggleMin(win.id)}
            className="h-2.5 w-2.5 rounded-full bg-warn/90 hover:bg-warn"
          />
          <button
            type="button"
            aria-label="Maximize"
            onClick={() => toggleMax(win.id)}
            className="h-2.5 w-2.5 rounded-full bg-ok/90 hover:bg-ok"
          />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-xs font-medium text-muted">{win.title}</p>
        <span className="w-10" />
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
      {!maximized ? (
        <div
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={() => {
            resize.current = null;
          }}
          className="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize"
          aria-hidden
        />
      ) : null}
    </section>
  );
}
