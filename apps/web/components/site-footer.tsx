import Link from "next/link";
import { Camera, MapPin, MessageCircle } from "lucide-react";
import { Brand } from "@/components/brand";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Brand inverse />
          <p className="mt-5 max-w-sm text-sm leading-7 text-white/70">
            La vitrina digital de los comercios de Guayaquil. Compra cerca, descubre mejor.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-extrabold">Mall</h2>
          <div className="mt-4 grid gap-3 text-sm text-white/70">
            <Link className="flex min-h-11 items-center" href="/explorar">Explorar productos</Link>
            <Link className="flex min-h-11 items-center" href="/registro?rol=MERCHANT">Vender en Mall GYE</Link>
            <Link className="flex min-h-11 items-center" href="/login">Mi cuenta</Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-extrabold">Guayaquil, Ecuador</h2>
          <div className="mt-4 flex gap-2">
            <span className="grid size-10 place-items-center rounded-[6px] border border-white/20" title="Ubicación">
              <MapPin size={18} />
            </span>
            <span className="grid size-10 place-items-center rounded-[6px] border border-white/20" title="WhatsApp">
              <MessageCircle size={18} />
            </span>
            <span className="grid size-10 place-items-center rounded-[6px] border border-white/20" title="Instagram">
              <Camera size={18} />
            </span>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/55">
        © {new Date().getFullYear()} Mall Virtual Guayaquil
      </div>
    </footer>
  );
}
