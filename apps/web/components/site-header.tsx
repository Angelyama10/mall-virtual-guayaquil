"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "@/components/brand";
import { clientApi } from "@/lib/client-api";
import type { User } from "@/lib/types";
import { roleHome } from "@/lib/utils";

const links = [
  { href: "/explorar", label: "Explorar" },
  { href: "/#tiendas", label: "Tiendas" },
  { href: "/#como-funciona", label: "Cómo funciona" },
];

export function SiteHeader({ user }: { user?: User | null }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await clientApi("/api/session/logout", { method: "POST" });
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/15 bg-[#f7f5efeb] backdrop-blur-md">
      <div className="container-page flex h-[76px] items-center justify-between gap-5">
        <Brand />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegación principal">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-bold transition-colors hover:text-teal ${
                pathname === link.href ? "text-teal" : "text-ink-soft"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-1 sm:flex">
          <Link className="button-quiet !size-11 !p-0" href="/explorar" aria-label="Buscar productos">
            <Search size={20} aria-hidden="true" />
          </Link>
          <Link className="button-quiet !size-11 !p-0" href="/carrito" aria-label="Ver carrito">
            <ShoppingBag size={20} aria-hidden="true" />
          </Link>
          {user ? (
            <Link className="button-secondary ml-2" href={roleHome(user.role)}>
              <UserRound size={17} aria-hidden="true" />
              Mi espacio
            </Link>
          ) : (
            <>
              <Link className="button-quiet ml-1" href="/login">Ingresar</Link>
              <Link className="button-primary" href="/registro">Crear cuenta</Link>
            </>
          )}
        </div>
        <button
          type="button"
          className="button-quiet !size-11 !p-0 sm:!hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="menu-movil"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav id="menu-movil" className="border-t border-line bg-ivory px-4 py-4 sm:hidden">
          <div className="mx-auto grid max-w-lg gap-1">
            {links.map((link) => (
              <Link key={link.href} className="button-quiet justify-start" href={link.href} onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link className="button-quiet justify-start" href="/carrito" onClick={() => setOpen(false)}>
              <ShoppingBag size={18} /> Carrito
            </Link>
            {user ? (
              <>
                <Link className="button-primary mt-2" href={roleHome(user.role)} onClick={() => setOpen(false)}>
                  Mi espacio
                </Link>
                <button className="button-quiet" type="button" onClick={logout}>Cerrar sesión</button>
              </>
            ) : (
              <>
                <Link className="button-secondary mt-2" href="/login" onClick={() => setOpen(false)}>Ingresar</Link>
                <Link className="button-primary" href="/registro" onClick={() => setOpen(false)}>Crear cuenta</Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
