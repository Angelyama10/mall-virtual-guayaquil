import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return <main id="contenido-principal" className="container-page grid min-h-[65vh] place-items-center py-16 text-center"><div><SearchX className="mx-auto text-coral" size={40} /><p className="eyebrow mt-5">404</p><h1 className="display-title mt-3 text-[52px]">No encontramos esta página</h1><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted">Puede que el producto o la tienda ya no estén disponibles.</p><Link className="button-primary mt-7" href="/explorar">Volver a explorar</Link></div></main>;
}
