export type OsUser = {
  name: string;
  uid: number;
  gid: number;
  gecos: string;
  home: string;
  shell: string;
  groups: string[];
  password: string;
  sudo: boolean;
};

export const DEFAULT_USERS: OsUser[] = [
  {
    name: "root",
    uid: 0,
    gid: 0,
    gecos: "root",
    home: "/root",
    shell: "/bin/msh",
    groups: ["root"],
    password: "",
    sudo: true,
  },
  {
    name: "moor",
    uid: 1000,
    gid: 1000,
    gecos: "Moor",
    home: "/home/moor",
    shell: "/bin/msh",
    groups: ["moor", "sudo"],
    password: "",
    sudo: true,
  },
];

export const DEFAULT_USER = "moor";

export function isRoot(user: OsUser) {
  return user.uid === 0;
}

export function homeOf(user: OsUser) {
  return user.home;
}

export function validUsername(name: string) {
  return /^[a-z][a-z0-9_-]{0,31}$/.test(name);
}

export function nextUid(users: OsUser[]) {
  const max = users.reduce((n, u) => Math.max(n, u.uid), 999);
  return Math.max(1000, max + 1);
}

export function findUser(users: OsUser[], name: string) {
  return users.find((u) => u.name === name);
}

/** Regular users write their home and /tmp. Root writes everything. */
export function canWritePath(user: OsUser, path: string) {
  if (isRoot(user)) return true;
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/tmp" || p.startsWith("/tmp/")) return true;
  if (p === "/var/tmp" || p.startsWith("/var/tmp/")) return true;
  if (p === user.home || p.startsWith(user.home + "/")) return true;
  return false;
}

export function passwdText(users: OsUser[]) {
  return users.map((u) => `${u.name}:x:${u.uid}:${u.gid}:${u.gecos}:${u.home}:${u.shell}`).join("\n") + "\n";
}

export function groupText(users: OsUser[]) {
  const groups = new Map<string, { gid: number; members: string[] }>();
  groups.set("root", { gid: 0, members: [] });
  groups.set("sudo", { gid: 27, members: [] });
  groups.set("users", { gid: 100, members: [] });
  for (const u of users) {
    groups.set(u.name, { gid: u.gid, members: [u.name] });
    if (u.sudo && u.name !== "root") groups.get("sudo")?.members.push(u.name);
    if (u.uid >= 1000) groups.get("users")?.members.push(u.name);
  }
  return [...groups.entries()].map(([name, g]) => `${name}:x:${g.gid}:${[...new Set(g.members)].join(",")}`).join("\n") + "\n";
}

export function makeUser(name: string, users: OsUser[], opts?: { gecos?: string; sudo?: boolean; password?: string }): OsUser {
  const uid = nextUid(users);
  return {
    name,
    uid,
    gid: uid,
    gecos: opts?.gecos || name,
    home: `/home/${name}`,
    shell: "/bin/msh",
    groups: opts?.sudo === false ? [name, "users"] : [name, "users", "sudo"],
    password: opts?.password ?? "",
    sudo: opts?.sudo !== false,
  };
}

export function migrateUsers(users: OsUser[] | undefined): OsUser[] {
  if (!users?.length) return DEFAULT_USERS.map((u) => ({ ...u, groups: [...u.groups] }));
  const names = new Set(users.map((u) => u.name));
  const next = users.map((u) => ({
    ...u,
    groups: u.groups?.length ? u.groups : u.uid === 0 ? ["root"] : [u.name, "users"],
    password: u.password ?? "",
    sudo: u.uid === 0 ? true : Boolean(u.sudo),
    home: u.home || (u.uid === 0 ? "/root" : `/home/${u.name}`),
    shell: u.shell || "/bin/msh",
    gecos: u.gecos || u.name,
  }));
  if (!names.has("root")) next.unshift({ ...DEFAULT_USERS[0] });
  if (!names.has("moor")) next.push({ ...DEFAULT_USERS[1] });
  return next;
}

export const AVATAR_CLASS = ["bg-primary", "bg-ok", "bg-warn", "bg-danger"] as const;

export function avatarClass(uid: number) {
  return AVATAR_CLASS[uid % AVATAR_CLASS.length] ?? "bg-primary";
}
