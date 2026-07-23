import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Camera, ChevronRight, Clock3, MapPin, MessageCircle, Store as StoreIcon } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { publicApi } from "@/lib/api";
import type { Product, Store } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const store = await publicApi<Store>(`stores/${slug}`).catch(() => null);
  return { title: store?.name ?? "Tienda" };
}

export default async function StorePage({ params }: Props) {
  const { slug } = await params;
  const [store, products] = await Promise.all([
    publicApi<Store>(`stores/${slug}`).catch(() => null),
    publicApi<Product[]>("products"),
  ]);
  if (!store) notFound();
  const storeProducts = products.filter((product) => product.storeId === store.id);

  return (
    <main id="contenido-principal">
      <section className="bg-ink py-10 text-white md:py-14">
        <div className="container-page">
          <nav className="flex items-center gap-2 text-xs text-white/60" aria-label="Migas de pan"><Link href="/">Inicio</Link><ChevronRight size={14} /><span>{store.name}</span></nav>
          <div className="mt-8 grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-end">
            <span className="grid size-20 place-items-center rounded-[8px] bg-coral"><StoreIcon size={35} /></span>
            <div><span className="status-pill !bg-white/10 !text-white">Tienda activa</span><h1 className="display-title mt-3 text-[48px] md:text-[64px]">{store.name}</h1><p className="mt-3 text-sm text-white/65">{store.company?.name}</p></div>
            <div className="grid gap-2 text-sm text-white/75"><span className="flex items-center gap-2"><MapPin size={17} /> {store.address?.street}, {store.address?.city}</span><span className="flex items-center gap-2"><Clock3 size={17} /> Atención según horario del local</span></div>
          </div>
        </div>
      </section>
      <section className="container-page py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
          <div><p className="eyebrow">Catálogo de la tienda</p><h2 className="display-title mt-3 text-[42px]">Productos disponibles</h2><div className="mt-9 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">{storeProducts.map((product) => <ProductCard key={product.id} product={product} />)}</div></div>
          <aside className="surface h-fit p-5"><h2 className="text-sm font-extrabold">Atención y pagos</h2><div className="mt-5 grid gap-4 text-sm text-muted">{store.settings?.whatsappNumber && <span className="flex items-start gap-3"><MessageCircle className="text-teal" size={18} /> WhatsApp {store.settings.whatsappNumber}</span>}{store.settings?.instagramUrl && <a className="flex items-start gap-3 hover:text-teal" href={store.settings.instagramUrl} target="_blank" rel="noreferrer"><Camera className="text-teal" size={18} /> Instagram</a>}<p>{store.settings?.acceptsCash ? "Acepta efectivo" : "Consulta métodos de pago"}</p><p>{store.address?.reference}</p></div></aside>
        </div>
      </section>
    </main>
  );
}
