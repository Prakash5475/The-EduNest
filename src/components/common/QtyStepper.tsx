import { Minus, Plus } from "lucide-react";

interface QtyStepperProps {
  qty: number;
  min?: number;
  onChange: (qty: number) => void;
  size?: "sm" | "default";
}

export function QtyStepper({ qty, min = 1, onChange, size = "default" }: QtyStepperProps) {
  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(Math.max(min, qty - 1))}
        disabled={qty <= min}
        className={`flex ${dim} items-center justify-center rounded-lg border border-border hover:bg-muted disabled:pointer-events-none disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-medium">{qty}</span>
      <button
        onClick={() => onChange(qty + 1)}
        className={`flex ${dim} items-center justify-center rounded-lg border border-border hover:bg-muted`}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
