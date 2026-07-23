import { redirect } from "next/navigation";
import { Boxes, PackageCheck, Store as StoreIcon, Users } from "lucide-react";
import { CategoryManager, StoreReview } from "@/components/admin-tools";
import { OrderManager } from "@/components/order-manager";
import { privateApi } from "@/lib/api";
import type { Category, Order, Store, User } from "@/lib/types";
import { shortDate } from "@/lib/utils";

export default async function AdminPage() {
  const currentUser = await privateApi<User>("auth/me").catch(() => null);
  if (!currentUser) redirect("/login?regreso=/admin");
  if (currentUser.role !== "ADMIN" && currentUser.role !== "SUPER_ADMIN") redirect(currentUser.role === "MERCHANT" ? "/comercio" : "/cuenta");
  const [stores, pendingStores, categories, users, orders] = await Promise.all([privateApi<Store[]>("stores/admin"), privateApi<Store[]>("stores/admin/pending"), privateApi<Category[]>("categories/admin"), privateApi<User[]>("users"), privateApi<Order[]>("orders/manage")]);
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status)).length;

  return <div className="space-y-12"><header><p className="eyebrow">Administración</p><h1 className="mt-2 text-2xl font-extrabold md:text-3xl">Control del Mall GYE</h1><p className="mt-2 text-sm text-muted">Revisión comercial, catálogo, usuarios y operación global.</p></header><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[[StoreIcon, "Tiendas activas", stores.filter((store) => store.status === "ACTIVE").length, "bg-teal"], [StoreIcon, "Por revisar", pendingStores.length, "bg-coral"], [Users, "Usuarios", users.length, "bg-ink"], [PackageCheck, "Pedidos activos", activeOrders, "bg-gold"]].map(([Icon, label, value, color]) => { const IconComponent = Icon as typeof Boxes; return <article key={label as string} className="rounded-[8px] border border-line bg-white p-5"><span className={`grid size-10 place-items-center rounded-[6px] text-white ${color}`}><IconComponent size={19} /></span><p className="mt-5 text-xs font-bold text-muted">{label as string}</p><strong className="mt-1 block text-2xl">{String(value)}</strong></article>; })}</section>
    <section id="tiendas"><div><p className="eyebrow">Validación comercial</p><h2 className="mt-2 text-xl font-extrabold">Tiendas</h2><p className="mt-2 text-sm text-muted">Las nuevas solicitudes deben ser aprobadas antes de publicarse.</p></div><div className="mt-5"><StoreReview initialStores={stores} /></div></section>
    <section id="categorias"><div className="flex items-end justify-between"><div><p className="eyebrow">Catálogo</p><h2 className="mt-2 text-xl font-extrabold">Categorías</h2></div></div><div className="mt-5"><CategoryManager initialCategories={categories} /></div></section>
    <section id="usuarios"><div><p className="eyebrow">Accesos</p><h2 className="mt-2 text-xl font-extrabold">Usuarios</h2></div><div className="mt-5 overflow-x-auto rounded-[8px] border border-line bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-[#f6f7f6] text-xs uppercase text-muted"><tr><th className="p-4">Usuario</th><th className="p-4">Rol</th><th className="p-4">Registro</th><th className="p-4">Estado</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-line"><td className="p-4"><strong>{user.email}</strong><span className="mt-1 block text-xs text-muted">{user.phone ?? "Sin teléfono"}</span></td><td className="p-4">{user.role}</td><td className="p-4">{user.createdAt ? shortDate(user.createdAt) : "-"}</td><td className="p-4"><span className={`status-pill ${user.isSuspended ? "!bg-[#fff5f3] !text-[var(--danger)]" : ""}`}>{user.isSuspended ? "Suspendido" : "Activo"}</span></td></tr>)}</tbody></table></div></section>
    <section id="pedidos"><div><p className="eyebrow">Operación global</p><h2 className="mt-2 text-xl font-extrabold">Pedidos</h2></div><div className="mt-5"><OrderManager initialOrders={orders} /></div></section>
  </div>;
}
