import { useState } from "react";
import { useMoor } from "@/lib/store";
import { avatarClass } from "@/lib/users";
import { cn } from "@/lib/utils";

export function LockScreen() {
  const users = useMoor((s) => s.users);
  const currentUser = useMoor((s) => s.currentUser);
  const unlockSession = useMoor((s) => s.unlockSession);
  const [picked, setPicked] = useState(currentUser);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const user = users.find((u) => u.name === picked);

  function unlock() {
    const result = unlockSession(picked, password || undefined);
    if (result.needPassword) setError("Password required");
    else if (!result.ok) setError(result.error ?? "Failed");
    else setError(null);
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-crust/95 p-6 backdrop-blur-md">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Moor Linux</p>
      <h1 className="mt-2 text-2xl font-semibold">Locked</h1>
      <p className="mt-2 text-sm text-muted">Pick an account. Superuser is optional — stay as moor.</p>
      <ul className="mt-6 flex flex-wrap justify-center gap-3">
        {users.map((u) => (
          <li key={u.name}>
            <button
              type="button"
              onClick={() => {
                setPicked(u.name);
                setPassword("");
                setError(null);
              }}
              className={cn(
                "flex w-24 flex-col items-center gap-2 rounded-md border px-2 py-3 text-sm",
                picked === u.name ? "border-primary bg-overlay" : "border-border hover:border-primary/50",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-full text-sm font-medium text-crust",
                  avatarClass(u.uid),
                )}
              >
                {u.name.slice(0, 1).toUpperCase()}
              </span>
              {u.name}
              <span className="text-[10px] text-muted">{u.uid === 0 ? "root" : "user"}</span>
            </button>
          </li>
        ))}
      </ul>
      {user?.password ? (
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") unlock();
          }}
          placeholder="Password"
          className="mt-6 w-56 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
      ) : null}
      <button
        type="button"
        onClick={unlock}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-crust"
      >
        Unlock as {picked}
      </button>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
