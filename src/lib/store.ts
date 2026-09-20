import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { APP_META, type AppId, type WallpaperId } from "./apps";
import {
  cloneFs,
  createDefaultFs,
  HOME,
  migrateFs,
  mkdirp,
  removePath,
  writeFile as writeFileAt,
  type FsDir,
} from "./fs";
import { makeContainer, type Ctr, type ImageId } from "./containers";
import { idbStorage } from "./idb";
import {
  DEFAULT_USER,
  DEFAULT_USERS,
  canWritePath,
  findUser,
  groupText,
  makeUser,
  migrateUsers,
  passwdText,
  validUsername,
  type OsUser,
} from "./users";

export type PhoneTab = "home" | "display" | "session" | "about";

export type Win = {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  path?: string;
};

type MoorState = {
  fs: FsDir;
  cwd: string;
  wallpaperId: WallpaperId;
  sessionActive: boolean;
  booting: boolean;
  hasBooted: boolean;
  phoneTab: PhoneTab;
  windows: Win[];
  focusedId: string | null;
  zTop: number;
  launcherOpen: boolean;
  cascade: number;
  containers: Ctr[];
  users: OsUser[];
  currentUser: string;
  locked: boolean;
  startSession: (opts?: { skipBoot?: boolean }) => void;
  endSession: () => void;
  finishBoot: () => void;
  reboot: () => void;
  setPhoneTab: (tab: PhoneTab) => void;
  setWallpaper: (id: WallpaperId) => void;
  setCwd: (cwd: string) => void;
  setLauncherOpen: (open: boolean) => void;
  openApp: (appId: AppId, path?: string, pos?: { x: number; y: number }) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  toggleMax: (id: string) => void;
  toggleMin: (id: string) => void;
  writeFile: (path: string, content: string) => boolean;
  mkdir: (path: string) => boolean;
  remove: (path: string) => boolean;
  resetFs: () => void;
  runContainer: (image: ImageId, name?: string) => Ctr;
  stopContainer: (id: string) => void;
  removeContainer: (id: string) => void;
  setContainerCwd: (id: string, cwd: string) => void;
  touchContainer: (id: string) => void;
  switchUser: (name: string, password?: string) => { ok: boolean; needPassword?: boolean; error?: string };
  addUser: (name: string, opts?: { gecos?: string; sudo?: boolean; password?: string }) => { ok: boolean; error?: string };
  setUserPassword: (name: string, password: string) => { ok: boolean; error?: string };
  setUserSudo: (name: string, sudo: boolean) => { ok: boolean; error?: string };
  removeUser: (name: string) => { ok: boolean; error?: string };
  lockSession: () => void;
  unlockSession: (name: string, password?: string) => { ok: boolean; needPassword?: boolean; error?: string };
};

export function activeUser(state: { users: OsUser[]; currentUser: string }): OsUser {
  return findUser(state.users, state.currentUser) ?? state.users.find((u) => u.name === DEFAULT_USER) ?? DEFAULT_USERS[1];
}

function syncAccounts(fs: FsDir, users: OsUser[]) {
  writeFileAt(fs, "/etc/passwd", passwdText(users));
  writeFileAt(fs, "/etc/group", groupText(users));
  mkdirp(fs, "/root");
  mkdirp(fs, "/tmp");
  for (const u of users) {
    if (u.uid === 0) continue;
    mkdirp(fs, u.home);
    mkdirp(fs, `${u.home}/Desktop`);
    mkdirp(fs, `${u.home}/Documents`);
    mkdirp(fs, `${u.home}/Downloads`);
  }
}

function isRootish(user: OsUser) {
  return user.uid === 0 || user.sudo;
}

let bootTimer: ReturnType<typeof setTimeout> | null = null;

function nextId() {
  return `w-${Math.random().toString(36).slice(2, 9)}`;
}

function seedWindows(): Win[] {
  const welcome = APP_META.welcome;
  const terminal = APP_META.terminal;
  return [
    {
      id: "w-welcome",
      appId: "welcome",
      title: welcome.title,
      x: welcome.x ?? 40,
      y: welcome.y ?? 56,
      w: welcome.w,
      h: welcome.h,
      z: 11,
      minimized: false,
      maximized: false,
    },
    {
      id: "w-term",
      appId: "terminal",
      title: terminal.title,
      x: terminal.x ?? 490,
      y: terminal.y ?? 88,
      w: terminal.w,
      h: terminal.h,
      z: 12,
      minimized: false,
      maximized: false,
    },
  ];
}

export const useMoor = create<MoorState>()(
  persist(
    (set, get) => ({
      fs: createDefaultFs(),
      cwd: HOME,
      wallpaperId: "fjord",
      sessionActive: false,
      booting: false,
      hasBooted: false,
      phoneTab: "home",
      windows: seedWindows(),
      focusedId: "w-term",
      zTop: 12,
      launcherOpen: false,
      cascade: 2,
      containers: [],
      users: DEFAULT_USERS.map((u) => ({ ...u, groups: [...u.groups] })),
      currentUser: DEFAULT_USER,
      locked: false,
      startSession: (opts) => {
        const { hasBooted } = get();
        if (bootTimer) clearTimeout(bootTimer);
        const reduce =
          typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const skip = opts?.skipBoot || reduce || hasBooted;
        if (skip) {
          set({ sessionActive: true, booting: false, hasBooted: true, launcherOpen: false });
          if (get().windows.length === 0) {
            get().openApp("welcome", undefined, { x: 36, y: 48 });
            get().openApp("terminal", undefined, { x: 500, y: 80 });
          }
          return;
        }
        set({ sessionActive: true, booting: true, launcherOpen: false });
        bootTimer = setTimeout(() => get().finishBoot(), 1400);
      },
      finishBoot: () => {
        set({ booting: false, hasBooted: true });
        if (get().windows.length === 0) {
          get().openApp("welcome", undefined, { x: 36, y: 48 });
          get().openApp("terminal", undefined, { x: 500, y: 80 });
        }
      },
      endSession: () => set({ sessionActive: false, launcherOpen: false }),
      reboot: () => {
        if (bootTimer) clearTimeout(bootTimer);
        set({
          booting: true,
          hasBooted: false,
          windows: [],
          focusedId: null,
          cascade: 0,
          launcherOpen: false,
          sessionActive: true,
        });
        bootTimer = setTimeout(() => get().finishBoot(), 1600);
      },
      setPhoneTab: (phoneTab) => set({ phoneTab }),
      setWallpaper: (wallpaperId) => set({ wallpaperId }),
      setCwd: (cwd) => set({ cwd }),
      setLauncherOpen: (launcherOpen) => set({ launcherOpen }),
      openApp: (appId, path, pos) => {
        const meta = APP_META[appId];
        const state = get();
        if (meta.singleton) {
          const existing = state.windows.find((w) => w.appId === appId && (!path || w.path === path));
          if (existing) {
            set({
              windows: state.windows.map((w) =>
                w.id === existing.id ? { ...w, minimized: false, z: state.zTop + 1, path: path ?? w.path } : w,
              ),
              focusedId: existing.id,
              zTop: state.zTop + 1,
              launcherOpen: false,
            });
            return;
          }
        }
        if (appId === "editor" && path) {
          const existing = state.windows.find((w) => w.appId === "editor" && w.path === path);
          if (existing) {
            set({
              windows: state.windows.map((w) =>
                w.id === existing.id ? { ...w, minimized: false, z: state.zTop + 1 } : w,
              ),
              focusedId: existing.id,
              zTop: state.zTop + 1,
              launcherOpen: false,
            });
            return;
          }
        }
        const n = state.cascade;
        const id = nextId();
        let title = meta.title;
        if (appId === "editor" && path) title = path.split("/").filter(Boolean).pop() ?? meta.title;
        if (appId === "terminal" && path?.startsWith("ctr:")) {
          const ctr = state.containers.find((c) => c.id === path.slice(4));
          title = ctr ? `sh · ${ctr.name}` : "sh · container";
        }
        const win: Win = {
          id,
          appId,
          title,
          x: pos?.x ?? meta.x ?? 56 + (n % 6) * 28,
          y: pos?.y ?? meta.y ?? 56 + (n % 6) * 24,
          w: meta.w,
          h: meta.h,
          z: state.zTop + 1,
          minimized: false,
          maximized: false,
          path,
        };
        set({
          windows: [...state.windows, win],
          focusedId: id,
          zTop: state.zTop + 1,
          cascade: n + 1,
          launcherOpen: false,
        });
      },
      closeWindow: (id) =>
        set((s) => ({
          windows: s.windows.filter((w) => w.id !== id),
          focusedId: s.focusedId === id ? s.windows.find((w) => w.id !== id)?.id ?? null : s.focusedId,
        })),
      focusWindow: (id) =>
        set((s) => ({
          focusedId: id,
          zTop: s.zTop + 1,
          windows: s.windows.map((w) => (w.id === id ? { ...w, z: s.zTop + 1, minimized: false } : w)),
        })),
      moveWindow: (id, x, y) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
        })),
      resizeWindow: (id, w, h) =>
        set((s) => ({
          windows: s.windows.map((win) => (win.id === id ? { ...win, w, h } : win)),
        })),
      toggleMax: (id) =>
        set((s) => ({
          windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized, minimized: false } : w)),
          focusedId: id,
        })),
      toggleMin: (id) =>
        set((s) => {
          const target = s.windows.find((w) => w.id === id);
          const minimizing = target ? !target.minimized : false;
          return {
            windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)),
            focusedId: minimizing ? s.windows.find((w) => w.id !== id && !w.minimized)?.id ?? null : id,
          };
        }),
      writeFile: (path, content) => {
        const s = get();
        const user = activeUser(s);
        if (!canWritePath(user, path)) return false;
        const fs = cloneFs(s.fs);
        writeFileAt(fs, path, content);
        set({ fs });
        return true;
      },
      mkdir: (path) => {
        const s = get();
        const user = activeUser(s);
        if (!canWritePath(user, path)) return false;
        const fs = cloneFs(s.fs);
        mkdirp(fs, path);
        set({ fs });
        return true;
      },
      remove: (path) => {
        const s = get();
        const user = activeUser(s);
        if (!canWritePath(user, path)) return false;
        const fs = cloneFs(s.fs);
        removePath(fs, path);
        set({ fs });
        return true;
      },
      resetFs: () => set({ fs: createDefaultFs(), cwd: HOME }),
      runContainer: (image, name) => {
        const ctr = makeContainer(image, name);
        set((s) => ({ containers: [ctr, ...s.containers] }));
        return ctr;
      },
      stopContainer: (id) =>
        set((s) => ({
          containers: s.containers.map((c) => (c.id === id ? { ...c, status: "exited" as const } : c)),
        })),
      removeContainer: (id) =>
        set((s) => ({
          containers: s.containers.filter((c) => c.id !== id),
          windows: s.windows.filter((w) => w.path !== `ctr:${id}`),
        })),
      setContainerCwd: (id, cwd) =>
        set((s) => ({
          containers: s.containers.map((c) => (c.id === id ? { ...c, cwd } : c)),
        })),
      touchContainer: (id) =>
        set((s) => ({
          containers: s.containers.map((c) => (c.id === id ? { ...c } : c)),
        })),
      switchUser: (name, password) => {
        const s = get();
        const user = findUser(s.users, name);
        if (!user) return { ok: false, error: `Unknown user: ${name}` };
        if (user.password) {
          if (password === undefined) return { ok: false, needPassword: true };
          if (password !== user.password) return { ok: false, error: "Authentication failure" };
        }
        set({ currentUser: user.name, cwd: user.home, locked: false });
        return { ok: true };
      },
      addUser: (name, opts) => {
        const s = get();
        const actor = activeUser(s);
        if (!isRootish(actor)) return { ok: false, error: "Only root or sudo can add users" };
        const trimmed = name.trim().toLowerCase();
        if (!validUsername(trimmed)) return { ok: false, error: "Invalid username" };
        if (findUser(s.users, trimmed)) return { ok: false, error: "User exists" };
        const user = makeUser(trimmed, s.users, opts);
        const users = [...s.users, user];
        const fs = cloneFs(s.fs);
        syncAccounts(fs, users);
        set({ users, fs });
        return { ok: true };
      },
      setUserPassword: (name, password) => {
        const s = get();
        const actor = activeUser(s);
        if (actor.name !== name && !isRootish(actor)) return { ok: false, error: "Permission denied" };
        if (!findUser(s.users, name)) return { ok: false, error: "Unknown user" };
        set({
          users: s.users.map((u) => (u.name === name ? { ...u, password } : u)),
        });
        return { ok: true };
      },
      setUserSudo: (name, sudo) => {
        const s = get();
        if (!isRootish(activeUser(s))) return { ok: false, error: "Permission denied" };
        if (name === "root") return { ok: false, error: "root always has sudo" };
        const users = s.users.map((u) =>
          u.name === name
            ? {
                ...u,
                sudo,
                groups: sudo
                  ? [...new Set([...u.groups.filter((g) => g !== "sudo"), "sudo"])]
                  : u.groups.filter((g) => g !== "sudo"),
              }
            : u,
        );
        const fs = cloneFs(s.fs);
        syncAccounts(fs, users);
        set({ users, fs });
        return { ok: true };
      },
      removeUser: (name) => {
        const s = get();
        if (!isRootish(activeUser(s))) return { ok: false, error: "Permission denied" };
        if (name === "root" || name === "moor") return { ok: false, error: "Cannot remove system user" };
        if (name === s.currentUser) return { ok: false, error: "Cannot remove the active user" };
        if (!findUser(s.users, name)) return { ok: false, error: "Unknown user" };
        const users = s.users.filter((u) => u.name !== name);
        const fs = cloneFs(s.fs);
        syncAccounts(fs, users);
        set({ users, fs });
        return { ok: true };
      },
      lockSession: () => set({ locked: true, launcherOpen: false }),
      unlockSession: (name, password) => get().switchUser(name, password),
    }),
    {
      name: "moor-v1",
      skipHydration: true,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({
        fs: s.fs,
        wallpaperId: s.wallpaperId,
        containers: s.containers,
        users: s.users,
        currentUser: s.currentUser === "root" ? DEFAULT_USER : s.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.fs = migrateFs(state.fs);
        state.users = migrateUsers(state.users);
        if (!findUser(state.users, state.currentUser) || state.currentUser === "root") {
          state.currentUser = DEFAULT_USER;
        }
        const user = findUser(state.users, state.currentUser);
        if (user) state.cwd = user.home;
        syncAccounts(state.fs, state.users);
      },
    },
  ),
);
