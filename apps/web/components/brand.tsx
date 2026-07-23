import Link from "next/link";
import { Store } from "lucide-react";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${inverse ? "text-white" : "text-ink"}`}
      aria-label="Mall GYE, ir al inicio"
    >
      <span
        className={`grid size-10 place-items-center rounded-[6px] ${
          inverse ? "bg-white text-teal" : "bg-teal text-white"
        }`}
      >
        <Store aria-hidden="true" size={22} strokeWidth={2.1} />
      </span>
      <span className="leading-none">
        <span className="block font-display text-[25px] font-bold">Mall GYE</span>
        <span className="mt-1 block text-[9px] font-extrabold uppercase text-current opacity-70">
          Guayaquil compra local
        </span>
      </span>
    </Link>
  );
}
