import { useMemo, useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { saveToPhone } from "@/lib/device";
import { HOME, getNode } from "@/lib/fs";
import { useMoor } from "@/lib/store";

const PATH = `${HOME}/Documents/contacts.json`;

type Person = { name: string; phone: string; email: string };

function load(raw?: string): Person[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Person[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function ContactsApp() {
  const fs = useMoor((s) => s.fs);
  const writeFile = useMoor((s) => s.writeFile);
  const node = getNode(fs, PATH);
  const people = useMemo(() => load(node?.kind === "file" ? node.content : undefined), [node]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  function save(next: Person[]) {
    writeFile(PATH, JSON.stringify(next, null, 2));
  }

  return (
    <AppShell
      bar={
        <>
          <span className="flex-1 text-xs text-muted">{people.length} contacts</span>
          <BarBtn onClick={() => void saveToPhone("contacts.json", JSON.stringify(people, null, 2))}>
            Save to phone
          </BarBtn>
        </>
      }
    >
      <form
        className="grid gap-2 border-b border-border p-3 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          save([...people, { name: name.trim(), phone: phone.trim(), email: email.trim() }]);
          setName("");
          setPhone("");
          setEmail("");
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="rounded-sm border border-border bg-crust px-2 py-2 text-sm outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          className="rounded-sm border border-border bg-crust px-2 py-2 text-sm outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-sm border border-border bg-crust px-2 py-2 text-sm outline-none"
        />
        <button type="submit" className="rounded-sm bg-primary px-3 py-2 text-sm font-medium text-crust">
          Add
        </button>
      </form>
      <ul className="divide-y divide-border">
        {people.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-muted">No contacts yet.</li>
        ) : (
          people.map((p, i) => (
            <li key={`${p.name}-${i}`} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted">
                  {p.phone}
                  {p.phone && p.email ? " · " : ""}
                  {p.email}
                </p>
              </div>
              <button type="button" className="text-xs text-danger" onClick={() => save(people.filter((_, j) => j !== i))}>
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </AppShell>
  );
}
