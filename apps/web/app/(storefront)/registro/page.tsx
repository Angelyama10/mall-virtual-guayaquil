import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return <AuthShell eyebrow="Únete a Mall GYE" title="Tu cuenta empieza aquí" description="Compra en comercios locales o crea la vitrina digital de tu negocio."><Suspense><RegisterForm /></Suspense></AuthShell>;
}
