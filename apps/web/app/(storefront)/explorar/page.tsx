import type { Metadata } from "next";
import { CatalogBrowser } from "@/components/catalog-browser";
import { publicApi } from "@/lib/api";
import type { Category, Product } from "@/lib/types";

export const metadata: Metadata = { title: "Explorar" };

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string; categoria?: string }> }) {
  const [params, products, categories] = await Promise.all([
    searchParams,
    publicApi<Product[]>("products"),
    publicApi<Category[]>("categories"),
  ]);
  return (
    <main id="contenido-principal">
      <header className="border-b border-line bg-paper py-12 md:py-16">
        <div className="container-page"><p className="eyebrow">Catálogo local</p><h1 className="display-title mt-3 text-[48px] md:text-[64px]">Explora el mall</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-muted">Productos disponibles de comercios reales de Guayaquil.</p></div>
      </header>
      <CatalogBrowser products={products} categories={categories} initialQuery={params.q} initialCategory={params.categoria} />
    </main>
  );
}
