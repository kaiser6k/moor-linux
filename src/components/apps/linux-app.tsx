export function LinuxApp() {
  return (
    <div className="flex h-full flex-col bg-bg p-5">
      <p className="text-xs font-medium tracking-widest text-primary uppercase">Debian</p>
      <h1 className="mt-2 text-xl font-semibold">Ubuntu-class userspace</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        Real bash, apt, gcc, python, and vim — an x86 Debian machine in this browser. First boot downloads the disk;
        your files stay here. It opens in its own window so the CPU can run; this desktop stays the DeX session.
      </p>
      <a
        href="/linux-vm.html"
        target="moor-debian"
        rel="noopener"
        className="mt-5 inline-flex w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-crust"
      >
        Launch Debian
      </a>
      <p className="mt-4 text-xs text-muted">Close that window or use Back to desktop to return.</p>
    </div>
  );
}
