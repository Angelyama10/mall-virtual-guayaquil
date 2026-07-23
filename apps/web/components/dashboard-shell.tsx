"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Boxes, ChevronLeft, LayoutDashboard, LogOut, Menu, PackageCheck, Settings, ShieldCheck, Store, Users, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { clientApi } from "@/lib/client-api";
import type { User } from "@/lib/types";

export function DashboardShell({ user, children }: { user: User; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const admin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const base = admin ? "/admin" : "/comercio";
  const links = admin
    ? [[base, "Resumen", LayoutDashboard], [`${base}#tiendas`, "Tiendas", Store], [`${base}#categorias`, "Categorías", Boxes], [`${base}#usuarios`, "Usuarios", Users], [`${base}#pedidos`, "Pedidos", PackageCheck]]
    : [[base, "Resumen", LayoutDashboard], [`${base}#productos`, "Productos", Boxes], [`${base}#pedidos`, "Pedidos", PackageCheck], [`${base}#tiendas`, "Mi tienda", Store], [`${base}#analitica`, "Analítica", BarChart3]];

  async function logout() { await clientApi("/api/session/logout", { method: "POST" }); router.push("/"); router.refresh(); }

  return (
    <div className="min-h-screen bg-[#f1f3f1] lg:grid lg:grid-cols-[250px_1fr]">
      <aside className={`fixed inset-y-0 left-0 z-50 w-[280px] bg-ink text-white transition-transform lg:sticky lg:top-0 lg:w-auto lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-5"><Brand inverse /><button className="grid size-10 place-items-center lg:hidden" type="button" onClick={() => setOpen(false)} aria-label="Cerrar navegación"><X size={20} /></button></div>
          <div className="border-b border-white/10 px-5 py-5"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-[6px] bg-coral">{admin ? <ShieldCheck size={18} /> : <Store size={18} />}</span><div className="min-w-0"><p className="truncate text-xs font-extrabold">{user.email}</p><p className="mt-1 text-[10px] uppercase text-white/50">{admin ? "Administración" : "Comercio"}</p></div></div></div>
          <nav className="grid gap-1 p-3" aria-label="Panel principal">{links.map(([href, label, Icon]) => { const IconComponent = Icon as typeof LayoutDashboard; const active = pathname === href; return <Link key={href as string} href={href as string} onClick={() => setOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-[6px] px-3 text-sm font-bold transition-colors ${active ? "bg-white text-ink" : "text-white/68 hover:bg-white/8 hover:text-white"}`}><IconComponent size={18} />{label as string}</Link>; })}</nav>
          <div className="mt-auto grid gap-1 border-t border-white/10 p-3"><Link className="flex min-h-11 items-center gap-3 rounded-[6px] px-3 text-sm font-bold text-white/68 hover:bg-white/8 hover:text-white" href="/"><ChevronLeft size={18} /> Ver el mall</Link><button type="button" className="flex min-h-11 items-center gap-3 rounded-[6px] px-3 text-sm font-bold text-white/68 hover:bg-white/8 hover:text-white" onClick={logout}><LogOut size={18} /> Cerrar sesión</button></div>
        </div>
      </aside>
      <div className="min-w-0"><header className="sticky top-0 z-40 flex h-[64px] items-center justify-between border-b border-line bg-white px-4 md:px-7"><button className="grid size-10 place-items-center rounded-[6px] border border-line lg:hidden" type="button" onClick={() => setOpen(true)} aria-label="Abrir navegación"><Menu size={20} /></button><p className="hidden text-sm font-extrabold sm:block">{admin ? "Control del mall" : "Centro de operaciones"}</p><button className="button-quiet !size-10 !p-0" type="button" title="Configuración"><Settings size={19} /></button></header><main id="contenido-principal" className="p-4 md:p-7 lg:p-9">{children}</main></div>
      {open && <button className="fixed inset-0 z-40 bg-ink/40 lg:hidden" type="button" aria-label="Cerrar navegación" onClick={() => setOpen(false)} />}
    </div>
  );
}
