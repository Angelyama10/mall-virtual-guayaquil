import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, PackageCheck, ShieldCheck, Store as StoreIcon, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { publicApi } from "@/lib/api";
import type { Product } from "@/lib/types";
import { money, productImage } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await publicApi<Product>(`products/${slug}`).catch(() => null);
  return { title: product?.name ?? "Producto", description: product?.description ?? undefined };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await publicApi<Product>(`products/${slug}`).catch(() => null);
  if (!product) notFound();
  const variant = product.variants[0];
  const stock = variant?.inventory?.[0]?.stock ?? 0;

  return (
    <main id="contenido-principal" className="container-page py-8 md:py-12">
      <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted" aria-label="Migas de pan">
        <Link href="/">Inicio</Link><ChevronRight size={14} /><Link href="/explorar">Explorar</Link><ChevronRight size={14} /><span className="text-ink">{product.name}</span>
      </nav>
      <div className="mt-7 grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-white">
          <Image src={productImage(product)} alt={product.images[0]?.altText ?? product.name} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
        </div>
        <div className="lg:py-6">
          <Link className="inline-flex items-center gap-2 text-xs font-extrabold text-teal" href={`/tienda/${product.store.slug}`}><StoreIcon size={16} /> {product.store.name}</Link>
          <p className="mt-6 text-xs font-extrabold uppercase text-muted">{product.category.name}</p>
          <h1 className="display-title mt-2 text-[48px] md:text-[62px]">{product.name}</h1>
          <div className="mt-5 flex items-baseline gap-3"><strong className="text-2xl font-extrabold">{money(product.basePrice)}</strong>{product.compareAtPrice && <span className="text-sm text-muted line-through">{money(product.compareAtPrice)}</span>}</div>
          <p className="mt-7 text-sm leading-7 text-muted">{product.description ?? "Un producto seleccionado de nuestro comercio local."}</p>
          <div className="mt-7 flex items-center gap-2 text-sm font-bold"><PackageCheck size={18} className={stock ? "text-[var(--success)]" : "text-[var(--danger)]"} />{stock ? `${stock} unidades disponibles` : "Sin stock disponible"}</div>
          <div className="mt-8 max-w-md"><AddToCartButton productId={product.id} variantId={variant?.id} /></div>
          <div className="mt-9 grid gap-px overflow-hidden rounded-[8px] border border-line bg-line sm:grid-cols-3">
            {[[ShieldCheck, "Compra protegida"], [Truck, "Entrega local"], [MapPin, "Comercio real"]].map(([Icon, label]) => {
              const IconComponent = Icon as typeof ShieldCheck;
              return <div key={label as string} className="bg-paper p-4 text-center"><IconComponent className="mx-auto text-teal" size={21} /><p className="mt-2 text-xs font-extrabold">{label as string}</p></div>;
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
