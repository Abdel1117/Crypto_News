import React from "react";

interface ProgresSaleProps {
  label: string;
  current: number;
  goal: number;
  unit: string;
}

export default function ProgresSale({
  label,
  current,
  goal,
  unit,
}: ProgresSaleProps) {
  const percent =
    goal > 0 ? Math.max(0, Math.min(100, (current / goal) * 100)) : 0;

  return (
    <div className="p-1 lg:p-4">
      <div className="mb-2 flex justify-between">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-sm text-foreground">
          {current} / {goal} {unit}
        </p>
      </div>

      {/* Track */}
      <div className="h-[15px] min-w-[100px] overflow-hidden rounded-2xl bg-white/10">
        {/* Fill */}
        <div
          className="h-full rounded-2xl bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={goal}
          aria-valuenow={Math.min(Math.max(current, 0), goal)}
        />
      </div>
    </div>
  );
}
