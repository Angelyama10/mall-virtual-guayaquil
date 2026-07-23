import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import type { Product } from "@/lib/types";
import { money, productImage } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const stock = product.variants[0]?.inventory?.[0]?.stock ?? 0;
  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[8px] bg-white">
        <Image
          src={productImage(product)}
          alt={product.images[0]?.altText ?? product.name}
          fill
          loading="eager"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
        />
        {product.isFeatured && (
          <span className="absolute left-3 top-3 rounded-[4px] bg-gold px-2.5 py-1 text-[11px] font-extrabold text-ink">
            Destacado
          </span>
        )}
        <div className="absolute bottom-3 right-3 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <AddToCartButton productId={product.id} variantId={product.variants[0]?.id} compact />
        </div>
      </div>
      <div className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-teal">{product.store.name}</p>
            <h3 className="mt-1 text-base font-extrabold leading-6 text-ink">
              <Link href={`/producto/${product.slug}`} className="hover:text-teal">
                {product.name}
              </Link>
            </h3>
          </div>
          <Link className="grid size-11 shrink-0 place-items-center rounded-[6px] text-muted hover:bg-[#edf5f2] hover:text-teal" href={`/producto/${product.slug}`} aria-label={`Ver ${product.name}`}>
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="font-extrabold text-ink">{money(product.basePrice)}</p>
          <span className={`text-xs font-bold ${stock > 0 ? "text-muted" : "text-[var(--danger)]"}`}>
            {stock > 0 ? `${stock} disponibles` : "Agotado"}
          </span>
        </div>
      </div>
    </article>
  );
}
