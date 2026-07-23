"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Category, Product } from "@/lib/types";

export function CatalogBrowser({ products, categories, initialQuery = "", initialCategory = "" }: {
  products: Product[];
  categories: Category[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState("featured");

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesQuery = !normalized || [product.name, product.description, product.store.name, product.category.name]
        .some((value) => value?.toLowerCase().includes(normalized));
      return matchesQuery && (!category || product.category.slug === category);
    });
    return [...filtered].sort((a, b) => {
      if (sort === "price-asc") return Number(a.basePrice) - Number(b.basePrice);
      if (sort === "price-desc") return Number(b.basePrice) - Number(a.basePrice);
      if (sort === "name") return a.name.localeCompare(b.name, "es");
      return Number(b.isFeatured) - Number(a.isFeatured);
    });
  }, [category, products, query, sort]);

  return (
    <div className="container-page py-10 md:py-14">
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <aside className="h-fit border-b border-line pb-5 lg:sticky lg:top-24 lg:border-b-0 lg:border-r lg:pr-6" aria-label="Filtros">
          <div className="flex items-center gap-2 text-sm font-extrabold"><SlidersHorizontal size={18} /> Filtrar</div>
          <fieldset className="mt-6">
            <legend className="text-xs font-extrabold uppercase text-muted">Categorías</legend>
            <div className="mt-3 grid gap-1">
              <button type="button" className={`button-quiet justify-start ${!category ? "!bg-teal !text-white" : ""}`} onClick={() => setCategory("")}>Todas</button>
              {categories.map((item) => (
                <button key={item.id} type="button" className={`button-quiet justify-start ${category === item.slug ? "!bg-teal !text-white" : ""}`} onClick={() => setCategory(item.slug)}>
                  {item.name}
                </button>
              ))}
            </div>
          </fieldset>
        </aside>
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <span className="sr-only">Buscar en el catálogo</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input className="field !pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Producto, tienda o categoría" />
              {query && <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setQuery("")} aria-label="Limpiar búsqueda"><X size={17} /></button>}
            </label>
            <label>
              <span className="sr-only">Ordenar productos</span>
              <select className="field sm:w-48" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="featured">Destacados</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
                <option value="name">Nombre</option>
              </select>
            </label>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted"><strong className="text-ink">{visible.length}</strong> resultados</p>
            {(query || category) && <button type="button" className="text-xs font-extrabold text-teal" onClick={() => { setQuery(""); setCategory(""); }}>Limpiar filtros</button>}
          </div>
          {visible.length ? (
            <div className="mt-7 grid gap-x-5 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="empty-state mt-7"><div><Search className="mx-auto text-muted" size={30} /><h2 className="mt-4 text-lg font-extrabold">No encontramos coincidencias</h2><p className="mt-2 text-sm text-muted">Prueba otra palabra o elimina los filtros.</p></div></div>
          )}
        </div>
      </div>
    </div>
  );
}
