import { redirect } from "next/navigation";
import { Boxes, CircleDollarSign, PackageCheck, Store as StoreIcon, TriangleAlert } from "lucide-react";
import { MerchantOnboarding, CreateProductForm } from "@/components/merchant-tools";
import { OrderManager } from "@/components/order-manager";
import { privateApi, publicApi } from "@/lib/api";
import type { Category, Order, Product, Store, User } from "@/lib/types";
import { money, orderStatusLabel } from "@/lib/utils";

export default async function MerchantPage() {
  const user = await privateApi<User>("auth/me").catch(() => null);
  if (!user) redirect("/login?regreso=/comercio");
  if (user.role !== "MERCHANT") redirect(user.role === "ADMIN" || user.role === "SUPER_ADMIN" ? "/admin" : "/cuenta");
  const [stores, products, orders, categories] = await Promise.all([privateApi<Store[]>("stores/my"), privateApi<Product[]>("products/my"), privateApi<Order[]>("orders/manage"), publicApi<Category[]>("categories")]);
  if (!stores.length) return <MerchantOnboarding email={user.email} phone={user.phone} />;
  const sales = orders.filter((order) => order.payment?.status === "PAID").reduce((sum, order) => sum + Number(order.total), 0);
  const pending = orders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)).length;
  const lowStock = products.filter((product) => (product.variants[0]?.inventory?.[0]?.stock ?? 0) <= (product.variants[0]?.inventory?.[0]?.lowStockAlert ?? 0)).length;

  return <div className="space-y-12"><header><p className="eyebrow">Panel comercial</p><h1 className="mt-2 text-2xl font-extrabold md:text-3xl">Buenos días, {stores[0].name}</h1><p className="mt-2 text-sm text-muted">Este es el estado actual de tu operación.</p></header><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[CircleDollarSign, "Ventas confirmadas", money(sales), "bg-teal"], [PackageCheck, "Pedidos activos", String(pending), "bg-coral"], [Boxes, "Productos", String(products.length), "bg-ink"], [TriangleAlert, "Stock bajo", String(lowStock), "bg-gold"]].map(([Icon, label, value, color]) => { const IconComponent = Icon as typeof Boxes; return <article key={label as string} className="rounded-[8px] border border-line bg-white p-5"><span className={`grid size-10 place-items-center rounded-[6px] text-white ${color}`}><IconComponent size={19} /></span><p className="mt-5 text-xs font-bold text-muted">{label as string}</p><strong className="mt-1 block text-2xl">{value as string}</strong></article>; })}</section>
    <section id="productos"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Catálogo</p><h2 className="mt-2 text-xl font-extrabold">Productos</h2></div><CreateProductForm stores={stores} categories={categories} /></div><div className="mt-5 overflow-x-auto rounded-[8px] border border-line bg-white"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-[#f6f7f6] text-xs uppercase text-muted"><tr><th className="p-4">Producto</th><th className="p-4">Tienda</th><th className="p-4">Precio</th><th className="p-4">Stock</th><th className="p-4">Estado</th></tr></thead><tbody>{products.map((product) => <tr key={product.id} className="border-t border-line"><td className="p-4"><strong>{product.name}</strong><span className="mt-1 block text-xs text-muted">{product.category.name}</span></td><td className="p-4">{product.store.name}</td><td className="p-4 font-extrabold">{money(product.basePrice)}</td><td className="p-4">{product.variants[0]?.inventory?.[0]?.stock ?? 0}</td><td className="p-4"><span className="status-pill">{product.status === "ACTIVE" ? "Activo" : product.status}</span></td></tr>)}</tbody></table></div></section>
    <section id="pedidos"><div><p className="eyebrow">Operación</p><h2 className="mt-2 text-xl font-extrabold">Pedidos</h2><p className="mt-2 text-sm text-muted">Confirma pagos y avanza cada pedido hasta su entrega.</p></div><div className="mt-5"><OrderManager initialOrders={orders} /></div></section>
    <section id="tiendas"><div><p className="eyebrow">Presencia</p><h2 className="mt-2 text-xl font-extrabold">Mis tiendas</h2></div><div className="mt-5 grid gap-4 md:grid-cols-2">{stores.map((store) => <article key={store.id} className="rounded-[8px] border border-line bg-white p-5"><div className="flex items-start justify-between"><span className="grid size-10 place-items-center rounded-[6px] bg-ink text-white"><StoreIcon size={19} /></span><span className="status-pill">{orderStatusLabel(store.status)}</span></div><h3 className="mt-5 font-extrabold">{store.name}</h3><p className="mt-2 text-sm text-muted">{store.address?.street}, {store.address?.city}</p></article>)}</div></section>
  </div>;
}
