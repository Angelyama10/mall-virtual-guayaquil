import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Footprints,
  MapPin,
  Search,
  Shirt,
  Store as StoreIcon,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionReveal } from "@/components/section-reveal";
import { publicApi } from "@/lib/api";
import type { Category, Product, Store } from "@/lib/types";

export default async function HomePage() {
  const [products, stores, categories] = await Promise.all([
    publicApi<Product[]>("products"),
    publicApi<Store[]>("stores"),
    publicApi<Category[]>("categories"),
  ]);

  return (
    <main id="contenido-principal">
      <section className="relative min-h-[620px] overflow-hidden bg-ink md:min-h-[660px]">
        <Image
          src="/images/hero-guayaquil-marketplace.png"
          alt="Distrito comercial contemporáneo inspirado en Guayaquil"
          fill
          priority
          className="object-cover object-[67%_center] opacity-80"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0c2221b8]" />
        <div className="container-page relative flex min-h-[620px] items-center py-16 md:min-h-[660px]">
          <div className="max-w-[650px] text-white">
            <p className="mb-5 text-xs font-extrabold uppercase text-[#f1c25a]">El comercio de Guayaquil, en un solo lugar</p>
            <h1 className="display-title text-[55px] sm:text-[68px] md:text-[82px]">
              Compra cerca.<br />Descubre mejor.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/82 md:text-lg md:leading-8">
              Productos de comercios locales, atención directa y entregas coordinadas sin perder la cercanía de siempre.
            </p>
            <form action="/explorar" className="mt-9 flex max-w-xl gap-2 rounded-[8px] bg-white p-2 shadow-2xl">
              <label className="sr-only" htmlFor="hero-search">Buscar productos o tiendas</label>
              <Search className="ml-2 self-center text-muted" size={20} aria-hidden="true" />
              <input
                id="hero-search"
                name="q"
                className="min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-ink outline-none"
                placeholder="¿Qué estás buscando hoy?"
              />
              <button className="button-primary shrink-0" type="submit">Buscar</button>
            </form>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-white/72">
              <span className="inline-flex items-center gap-2"><BadgeCheck size={16} /> Comercios verificados</span>
              <span className="inline-flex items-center gap-2"><MapPin size={16} /> Compra local</span>
              <span className="inline-flex items-center gap-2"><Truck size={16} /> Entrega coordinada</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-paper py-8">
        <div className="container-page grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-line bg-line md:grid-cols-4">
          {[
            [String(products.length), "productos activos"],
            [String(stores.length), "tiendas locales"],
            [String(categories.length), "categorías"],
            ["24/7", "vitrina disponible"],
          ].map(([value, label]) => (
            <div key={label} className="bg-paper px-5 py-5 text-center">
              <strong className="font-display text-3xl text-teal">{value}</strong>
              <span className="ml-2 text-xs font-bold text-muted md:block md:mt-1">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <SectionReveal className="container-page">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Explora por categoría</p>
              <h2 className="display-title mt-3 text-[44px] md:text-[56px]">Encuentra tu próximo favorito</h2>
            </div>
            <Link className="button-secondary hidden sm:inline-flex" href="/explorar">
              Ver todo <ArrowRight size={17} />
            </Link>
          </div>
          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => {
              const Icon = category.slug.includes("calzado") ? Footprints : Shirt;
              return (
                <Link
                  key={category.id}
                  href={`/explorar?categoria=${category.slug}`}
                  className={`flex min-h-32 items-end justify-between rounded-[8px] p-5 text-white transition-transform hover:-translate-y-1 ${
                    index % 3 === 0 ? "bg-teal" : index % 3 === 1 ? "bg-coral" : "bg-ink"
                  }`}
                >
                  <div>
                    <Icon size={24} aria-hidden="true" />
                    <h3 className="mt-5 text-lg font-extrabold">{category.name}</h3>
                  </div>
                  <ArrowRight size={20} aria-hidden="true" />
                </Link>
              );
            })}
            <Link href="/explorar" className="flex min-h-32 items-end justify-between rounded-[8px] bg-gold p-5 text-ink transition-transform hover:-translate-y-1">
              <div><StoreIcon size={24} /><h3 className="mt-5 text-lg font-extrabold">Todo el mall</h3></div>
              <ArrowRight size={20} />
            </Link>
          </div>
        </SectionReveal>
      </section>

      <section className="bg-paper py-20">
        <SectionReveal className="container-page">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Selección local</p>
              <h2 className="display-title mt-3 text-[44px] md:text-[56px]">Productos para descubrir</h2>
            </div>
            <Link className="button-secondary hidden sm:inline-flex" href="/explorar">Explorar <ArrowRight size={17} /></Link>
          </div>
          <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {products.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        </SectionReveal>
      </section>

      <section id="tiendas" className="py-20">
        <SectionReveal className="container-page">
          <p className="eyebrow">Tiendas del mall</p>
          <div className="mt-3 grid gap-10 lg:grid-cols-[0.8fr_1.4fr] lg:items-end">
            <h2 className="display-title text-[44px] md:text-[56px]">Negocios que hacen ciudad</h2>
            <p className="max-w-2xl text-sm leading-7 text-muted">
              Cada vitrina conecta a clientes con comercios reales de Guayaquil, su dirección, catálogo y atención directa.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {stores.map((store, index) => (
              <Link key={store.id} href={`/tienda/${store.slug}`} className="group surface flex min-h-44 items-start justify-between gap-6 p-6 transition-transform hover:-translate-y-1">
                <div>
                  <span className={`grid size-11 place-items-center rounded-[6px] text-white ${index % 2 ? "bg-coral" : "bg-teal"}`}>
                    <StoreIcon size={21} />
                  </span>
                  <h3 className="mt-5 text-xl font-extrabold">{store.name}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted"><MapPin size={15} /> {store.address?.street ?? "Guayaquil"}</p>
                </div>
                <ArrowRight className="mt-2 transition-transform group-hover:translate-x-1" size={20} />
              </Link>
            ))}
          </div>
        </SectionReveal>
      </section>

      <section id="como-funciona" className="bg-teal py-20 text-white">
        <SectionReveal className="container-page">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.4fr]">
            <div>
              <p className="text-xs font-extrabold uppercase text-[#f1c25a]">Así de cercano</p>
              <h2 className="display-title mt-3 text-[44px] md:text-[56px]">Tu compra, sin vueltas</h2>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-[8px] bg-white/20 md:grid-cols-3">
              {[
                ["01", "Explora", "Encuentra productos y tiendas locales."],
                ["02", "Elige", "Arma tu carrito con stock disponible."],
                ["03", "Coordina", "Confirma por WhatsApp y recibe tu pedido."],
              ].map(([number, title, copy]) => (
                <li key={number} className="bg-teal px-6 py-8">
                  <span className="font-display text-3xl text-[#f1c25a]">{number}</span>
                  <h3 className="mt-8 text-lg font-extrabold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/70">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </SectionReveal>
      </section>

      <section className="container-page py-20">
        <SectionReveal className="relative overflow-hidden rounded-[8px] bg-coral px-6 py-14 text-white md:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase text-white/70">Para comercios</p>
            <h2 className="display-title mt-3 text-[44px] md:text-[56px]">Tu negocio también merece una gran vitrina</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/82">Administra productos, pedidos y ventas desde un espacio construido para el comercio local.</p>
            <Link className="button-primary mt-7 !bg-ink !border-ink" href="/registro?rol=MERCHANT">Quiero vender <ArrowRight size={17} /></Link>
          </div>
        </SectionReveal>
      </section>
    </main>
  );
}
