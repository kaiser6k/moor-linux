import { useState } from "react";
import { cn } from "@/lib/utils";

const KEYS = ["C", "÷", "×", "⌫", "7", "8", "9", "−", "4", "5", "6", "+", "1", "2", "3", "=", "0", "."];

export function CalcApp() {
  const [expr, setExpr] = useState("0");

  function apply(key: string) {
    if (key === "C") {
      setExpr("0");
      return;
    }
    if (key === "⌫") {
      setExpr((v) => (v.length <= 1 ? "0" : v.slice(0, -1)));
      return;
    }
    if (key === "=") {
      try {
        const safe = expr.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-");
        if (!/^[0-9.+\-*/ ()]+$/.test(safe)) return;
        const value = Function(`"use strict"; return (${safe})`)();
        if (typeof value === "number" && Number.isFinite(value)) setExpr(String(value));
      } catch {
        setExpr("Error");
      }
      return;
    }
    setExpr((v) => (v === "0" || v === "Error" ? key : v + key));
  }

  return (
    <div className="flex h-full flex-col bg-bg p-3">
      <p className="mb-3 min-h-12 rounded-md bg-crust px-3 py-3 text-right font-mono text-2xl">{expr}</p>
      <div className="grid grid-cols-4 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => apply(key)}
            className={cn(
              "rounded-md py-3 text-sm font-medium",
              key === "0" ? "col-span-2" : "",
              key === "=" ? "bg-primary text-crust" : "bg-overlay text-fg",
            )}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
