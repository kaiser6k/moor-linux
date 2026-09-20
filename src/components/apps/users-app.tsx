import { useState } from "react";
import { AppShell, BarBtn } from "@/components/app-shell";
import { activeUser, useMoor } from "@/lib/store";
import { avatarClass, type OsUser } from "@/lib/users";
import { cn } from "@/lib/utils";

export function UsersApp() {
  const users = useMoor((s) => s.users);
  const currentUser = useMoor((s) => s.currentUser);
  const switchUser = useMoor((s) => s.switchUser);
  const addUser = useMoor((s) => s.addUser);
  const setUserPassword = useMoor((s) => s.setUserPassword);
  const setUserSudo = useMoor((s) => s.setUserSudo);
  const removeUser = useMoor((s) => s.removeUser);
  const actor = useMoor((s) => activeUser(s));
  const [picked, setPicked] = useState(currentUser);
  const [status, setStatus] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newFull, setNewFull] = useState("");
  const user = users.find((u) => u.name === picked) ?? actor;

  function note(result: { ok: boolean; error?: string; needPassword?: boolean }, okText: string) {
    if (result.needPassword) setStatus("This account has a password — enter it, then Switch.");
    else if (!result.ok) setStatus(result.error ?? "Failed");
    else setStatus(okText);
  }

  return (
    <AppShell
      bar={
        <>
          <span className="text-xs text-muted">
            Signed in as <span className="text-fg">{currentUser}</span>
            {actor.uid === 0 ? " · root" : ""}
          </span>
          {actor.uid === 0 ? (
            <span className="ml-auto text-xs text-warn">You are superuser. Switch back to a regular account.</span>
          ) : (
            <span className="ml-auto text-xs text-muted">Daily work as a regular user. sudo only when needed.</span>
          )}
        </>
      }
    >
      <div className="grid h-full min-h-0 md:grid-cols-[220px_1fr]">
        <aside className="border-b border-border p-3 md:border-r md:border-b-0">
          <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Accounts</h2>
          <ul className="mt-2 space-y-1">
            {users.map((u) => (
              <li key={u.name}>
                <button
                  type="button"
                  onClick={() => {
                    setPicked(u.name);
                    setPassword("");
                    setStatus(null);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
                    picked === u.name ? "bg-overlay text-fg" : "text-muted hover:bg-overlay",
                  )}
                >
                  <Avatar user={u} />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="block font-medium text-fg">{u.name}</span>
                    <span className="block text-xs">{u.uid === 0 ? "Superuser" : u.sudo ? "sudo" : "standard"}</span>
                  </span>
                  {u.name === currentUser ? <span className="text-xs text-ok">active</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="min-h-0 overflow-auto p-5">
          <div className="flex items-center gap-3">
            <Avatar user={user} large />
            <div>
              <h1 className="text-lg font-semibold">{user.name}</h1>
              <p className="text-xs text-muted">
                uid {user.uid} · {user.home} · {user.gecos}
              </p>
            </div>
          </div>

          {user.uid === 0 ? (
            <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-warn">
              root can change anything. Don't stay here. Switch to moor (or another account) for daily use.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            <BarBtn
              onClick={() => note(switchUser(user.name, password || undefined), `Now ${user.name}`)}
              disabled={user.name === currentUser}
            >
              Switch to {user.name}
            </BarBtn>
            {user.name !== "root" && user.name !== "moor" && user.name !== currentUser ? (
              <BarBtn danger onClick={() => note(removeUser(user.name), `Removed ${user.name}`)}>
                Remove
              </BarBtn>
            ) : null}
          </div>

          {user.password ? (
            <label className="mt-4 block text-sm">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
            </label>
          ) : (
            <p className="mt-4 text-sm text-muted">No password. Switch is immediate.</p>
          )}

          <label className="mt-4 block text-sm">
            Set password
            <div className="mt-1 flex gap-2">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="leave empty for none"
                className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 outline-none focus:border-primary"
              />
              <BarBtn onClick={() => note(setUserPassword(user.name, password), "Password updated")}>Save</BarBtn>
            </div>
          </label>

          {user.uid !== 0 ? (
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={user.sudo}
                onChange={(e) => note(setUserSudo(user.name, e.target.checked), "sudo updated")}
              />
              May use sudo
            </label>
          ) : null}

          <h2 className="mt-8 text-xs font-medium tracking-wide text-muted uppercase">Add user</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="username"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <input
              value={newFull}
              onChange={(e) => setNewFull(e.target.value)}
              placeholder="full name"
              className="rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <button
            type="button"
            className="mt-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-crust"
            onClick={() => {
              const result = addUser(newName, { gecos: newFull || undefined });
              note(result, `Created ${newName}`);
              if (result.ok) {
                setPicked(newName.trim().toLowerCase());
                setNewName("");
                setNewFull("");
              }
            }}
          >
            Create account
          </button>
          {status ? <p className="mt-4 text-sm text-muted">{status}</p> : null}
        </section>
      </div>
    </AppShell>
  );
}

function Avatar({ user, large }: { user: OsUser; large?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-crust",
        large ? "size-12 text-lg" : "size-8 text-xs",
        avatarClass(user.uid),
      )}
    >
      {user.name.slice(0, 1).toUpperCase()}
    </span>
  );
}
