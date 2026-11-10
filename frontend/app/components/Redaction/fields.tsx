/** Small pieces shared by the editor's fields. */

export function Counter({ value, max }: Readonly<{ value: string; max: number }>) {
  return (
    <span
      className={`text-xs n-tnum ${value.length > max ? "text-(--n-down)" : "text-(--n-neutral-500)"}`}
    >
      {value.length} / {max}
    </span>
  );
}

export function FieldError({ id, message }: Readonly<{ id: string; message?: string }>) {
  if (!message) return null;
  return (
    <p id={id} className="n-field-error">
      {message}
    </p>
  );
}
