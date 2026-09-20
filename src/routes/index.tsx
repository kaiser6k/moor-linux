import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useSyncExternalStore } from "react";
import { Desktop } from "@/components/desktop-app";
import { PhoneApp } from "@/components/phone-app";
import { useMoor } from "@/lib/store";

export const Route = createFileRoute("/")({ component: Home });

function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia("(min-width: 768px)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function Home() {
  const wide = useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
  const sessionActive = useMoor((s) => s.sessionActive);

  useEffect(() => {
    try {
      void useMoor.persist.rehydrate();
    } catch {
      /* ignore */
    }
    if (wide && !useMoor.getState().sessionActive) {
      useMoor.getState().startSession({ skipBoot: true });
    }
  }, [wide]);

  if (sessionActive) {
    return <Desktop compact={!wide} />;
  }

  return (
    <>
      <div className="md:hidden">
        <PhoneApp displayReady={false} />
      </div>
      <div className="hidden h-dvh md:block">
        <Desktop compact={false} />
      </div>
    </>
  );
}
