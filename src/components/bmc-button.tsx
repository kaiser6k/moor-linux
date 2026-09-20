import { BMC_URL } from "@/lib/apps";
import { cn } from "@/lib/utils";

export function BmcButton({ className }: { className?: string }) {
  return (
    <a
      href={BMC_URL}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold no-underline",
        className,
      )}
      style={{ background: "#FFDD00", color: "#000000", boxShadow: "0 0 0 2px #000000" }}
    >
      <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
        <path
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="1.6"
          d="M4.5 8.5h11.5a1 1 0 0 1 1 1v4.2A4.8 4.8 0 0 1 12.2 18.5H9.3A4.8 4.8 0 0 1 4.5 13.7V8.5Z"
        />
        <path fill="none" stroke="#000000" strokeWidth="1.6" d="M17 10.2h1.4a2.4 2.4 0 1 1 0 4.8H17" />
        <path fill="none" stroke="#000000" strokeWidth="1.4" strokeLinecap="round" d="M8 5.5c.4.8.4 1.6 0 2.4M11 5.2c.5.9.5 1.8 0 2.7M14 5.5c.4.8.4 1.6 0 2.4" />
      </svg>
      Buy me a coffee
    </a>
  );
}
