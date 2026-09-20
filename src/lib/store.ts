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
  writeFile: (path: string, content: string) => void;
  mkdir: (path: string) => void;
  remove: (path: string) => void;
  resetFs: () => void;
  runContainer: (image: ImageId, name?: string) => Ctr;
  stopContainer: (id: string) => void;
  removeContainer: (id: string) => void;
  setContainerCwd: (id: string, cwd: string) => void;
  touchContainer: (id: string) => void;
};

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
      writeFile: (path, content) =>
        set((s) => {
          const fs = cloneFs(s.fs);
          writeFileAt(fs, path, content);
          return { fs };
        }),
      mkdir: (path) =>
        set((s) => {
          const fs = cloneFs(s.fs);
          mkdirp(fs, path);
          return { fs };
        }),
      remove: (path) =>
        set((s) => {
          const fs = cloneFs(s.fs);
          removePath(fs, path);
          return { fs };
        }),
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
    }),
    {
      name: "moor-v1",
      skipHydration: true,
      storage: createJSONStorage(() => idbStorage),
      partialize: (s) => ({ fs: s.fs, wallpaperId: s.wallpaperId, containers: s.containers }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.fs = migrateFs(state.fs);
      },
    },
  ),
);
