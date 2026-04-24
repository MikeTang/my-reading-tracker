"use client";

interface Props {
  value: number; // 0–5
  onChange?: (rating: number) => void;
  size?: "sm" | "lg";
  readonly?: boolean;
}

export default function StarRating({
  value,
  onChange,
  size = "lg",
  readonly = false,
}: Props) {
  const sizeClass = size === "lg" ? "text-2xl" : "text-sm";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${sizeClass} transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } ${star <= value ? "text-amber-400" : "text-slate-200"}`}
          aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
