import Image from "next/image";

export interface SymbolOption {
  id: string;
  image: string;
  symbol: string;
  name: string;
}

export interface SymbolDropdownProps {
  options: SymbolOption[];
  value: string | undefined; // id of selected symbol
  onChange: (id: string) => void;
  label?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function SymbolDropdown({
  options,
  value,
  onChange,
  label,
  disabled = false,
  placeholder = "Veuillez selectioner une crypto ...",
  className = "bg-card",
}: SymbolDropdownProps) {
  return (
    <div className={className}>
      {label && <label className="block mb-1 font-medium">{label}</label>}
      <select
        className="w-full md:px-3 py-2  rounded focus:outline-none focus:ring"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            <Image width={20} height={20} src={opt.image} alt={opt.symbol} />
            {opt.name} ({opt.symbol.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
}
