import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return <AuthShell eyebrow="Bienvenido de vuelta" title="Ingresa a tu espacio" description="Consulta tus compras, administra tu tienda o continúa donde quedaste."><Suspense><LoginForm /></Suspense></AuthShell>;
}
