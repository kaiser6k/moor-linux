import type { ReactNode } from "react";

export function AppShell({ bar, children }: { bar?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-bg">
      {bar ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border px-3 py-2">{bar}</div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}

export function BarBtn({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        danger
          ? "rounded-sm bg-overlay px-2 py-1 text-xs text-danger disabled:opacity-40"
          : "rounded-sm bg-overlay px-2 py-1 text-xs text-fg disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}
