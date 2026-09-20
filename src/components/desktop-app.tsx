import { useEffect, type ReactNode } from "react";
import { BootScreen } from "@/components/boot-screen";
import { Dock } from "@/components/dock";
import { Launcher } from "@/components/launcher";
import { TopBar } from "@/components/top-bar";
import { WindowFrame } from "@/components/window-frame";
import { BrowserApp } from "@/components/apps/browser-app";
import { CalcApp } from "@/components/apps/calc-app";
import { CalendarApp } from "@/components/apps/calendar-app";
import { ClockApp } from "@/components/apps/clock-app";
import { ContactsApp } from "@/components/apps/contacts-app";
import { ContainersApp } from "@/components/apps/containers-app";
import { UsersApp } from "@/components/apps/users-app";
import { LockScreen } from "@/components/lock-screen";
import { DiskApp } from "@/components/apps/disk-app";
import { EditorApp } from "@/components/apps/editor-app";
import { FilesApp } from "@/components/apps/files-app";
import { HelpApp } from "@/components/apps/help-app";
import { LinuxApp } from "@/components/apps/linux-app";
import { MapsApp } from "@/components/apps/maps-app";
import { MonitorApp } from "@/components/apps/monitor-app";
import { MusicApp } from "@/components/apps/music-app";
import { NotesApp } from "@/components/apps/notes-app";
import { PaintApp } from "@/components/apps/paint-app";
import { PhotosApp } from "@/components/apps/photos-app";
import { ScreenshotApp } from "@/components/apps/screenshot-app";
import { SettingsApp } from "@/components/apps/settings-app";
import { SheetsApp } from "@/components/apps/sheets-app";
import { SoftwareApp } from "@/components/apps/software-app";
import { TerminalApp } from "@/components/apps/terminal-app";
import { VideosApp } from "@/components/apps/videos-app";
import { WeatherApp } from "@/components/apps/weather-app";
import { WelcomeApp } from "@/components/apps/welcome-app";
import { WriterApp } from "@/components/apps/writer-app";
import { WALLPAPERS, type AppId } from "@/lib/apps";
import { useMoor, type Win } from "@/lib/store";

const BODIES: Record<AppId, (win: Win) => ReactNode> = {
  welcome: () => <WelcomeApp />,
  terminal: (win) => <TerminalApp windowId={win.id} path={win.path} />,
  linux: () => <LinuxApp />,
  files: () => <FilesApp />,
  editor: (win) => <EditorApp path={win.path} />,
  browser: () => <BrowserApp />,
  monitor: () => <MonitorApp />,
  calc: () => <CalcApp />,
  settings: () => <SettingsApp />,
  software: () => <SoftwareApp />,
  notes: () => <NotesApp />,
  writer: () => <WriterApp />,
  sheets: () => <SheetsApp />,
  calendar: () => <CalendarApp />,
  clock: () => <ClockApp />,
  weather: () => <WeatherApp />,
  maps: () => <MapsApp />,
  photos: () => <PhotosApp />,
  paint: () => <PaintApp />,
  music: () => <MusicApp />,
  videos: () => <VideosApp />,
  help: () => <HelpApp />,
  disk: () => <DiskApp />,
  contacts: () => <ContactsApp />,
  screenshot: () => <ScreenshotApp />,
  containers: () => <ContainersApp />,
  users: () => <UsersApp />,
};

function AppBody({ win }: { win: Win }) {
  return BODIES[win.appId](win);
}

export function Desktop({ compact }: { compact: boolean }) {
  const booting = useMoor((s) => s.booting);
  const windows = useMoor((s) => s.windows);
  const wallpaperId = useMoor((s) => s.wallpaperId);
  const launcherOpen = useMoor((s) => s.launcherOpen);
  const setLauncherOpen = useMoor((s) => s.setLauncherOpen);
  const openApp = useMoor((s) => s.openApp);
  const locked = useMoor((s) => s.locked);
  const lockSession = useMoor((s) => s.lockSession);
  const paper = WALLPAPERS.find((w) => w.id === wallpaperId);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.key === "Meta";
      if (e.key === "Escape") setLauncherOpen(false);
      if (meta && !e.repeat && e.key === " ") {
        e.preventDefault();
        setLauncherOpen(!useMoor.getState().launcherOpen);
      }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        openApp("terminal");
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        lockSession();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openApp, setLauncherOpen, lockSession]);

  return (
    <div className="relative h-dvh overflow-hidden bg-crust text-fg">
      {paper?.src ? (
        <img src={paper.src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 wallpaper-abyss" />
      )}
      <div className="absolute inset-0 bg-crust/20" />
      <TopBar compact={compact} />
      <div className="absolute inset-0">
        {windows.map((win) => (
          <WindowFrame key={win.id} win={win} compact={compact}>
            <AppBody win={win} />
          </WindowFrame>
        ))}
      </div>
      {launcherOpen ? <Launcher /> : null}
      <Dock />
      {booting ? <BootScreen /> : null}
      {locked ? <LockScreen /> : null}
    </div>
  );
}
