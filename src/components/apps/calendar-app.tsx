import { useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { AppShell, BarBtn } from "@/components/app-shell";
import { HOME, getNode } from "@/lib/fs";
import { useMoor } from "@/lib/store";
import "react-day-picker/style.css";

const PATH = `${HOME}/Documents/calendar.json`;

type Ev = { date: string; title: string };

function load(raw: string | undefined): Ev[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Ev[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CalendarApp() {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const node = getNode(fs, PATH);
  const events = useMemo(() => load(node?.kind === "file" ? node.content : undefined), [node]);
  const [day, setDay] = useState<Date>(new Date());
  const key = format(day, "yyyy-MM-dd");
  const todays = events.filter((e) => e.date === key);
  const marked = new Set(events.map((e) => e.date));

  function add() {
    const title = window.prompt("Event title");
    if (!title) return;
    writeFile(PATH, JSON.stringify([...events, { date: key, title }], null, 2));
  }

  function remove(i: number) {
    const next = events.filter((e, idx) => !(e.date === key && todays.indexOf(e) === i));
    writeFile(PATH, JSON.stringify(next, null, 2));
  }

  return (
    <AppShell
      bar={
        <>
          <span className="flex-1 text-xs text-muted">{format(day, "EEEE, d MMMM yyyy")}</span>
          <BarBtn onClick={add}>Add event</BarBtn>
        </>
      }
    >
      <div className="grid gap-4 p-4 md:grid-cols-[1fr_200px]">
        <DayPicker
          mode="single"
          selected={day}
          onSelect={(d) => d && setDay(d)}
          modifiers={{ event: (d) => marked.has(format(d, "yyyy-MM-dd")) }}
          modifiersClassNames={{ event: "text-primary font-semibold" }}
          className="text-sm"
        />
        <div>
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">This day</h2>
          {todays.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No events.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {todays.map((e, i) => (
                <li key={`${e.title}-${i}`} className="flex items-center justify-between rounded-md bg-surface px-3 py-2 text-sm">
                  <span>{e.title}</span>
                  <button type="button" className="text-xs text-danger" onClick={() => remove(i)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
