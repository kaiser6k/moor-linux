export function BootScreen() {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-crust text-fg">
      <div className="moor-boot flex flex-col items-center">
        <div className="h-16 w-16 overflow-hidden rounded-lg">
          <img src="/brand/mark.jpg" alt="" className="h-full w-full object-cover" />
        </div>
        <p className="mt-6 text-lg font-semibold tracking-wide">Moor Linux</p>
        <p className="mt-1 text-sm text-muted">Starting session on the docked display</p>
        <div className="mt-8 h-0.5 w-48 overflow-hidden rounded-full bg-overlay">
          <div className="moor-bar h-full w-full bg-primary" />
        </div>
      </div>
    </div>
  );
}
