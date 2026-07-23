"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Phone } from "lucide-react";
import { FormEvent, useState } from "react";
import { clientApi } from "@/lib/client-api";
import type { User } from "@/lib/types";
import { roleHome } from "@/lib/utils";

function PasswordField({ name, label = "Contraseña", autoComplete }: { name: string; label?: string; autoComplete: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <span className="relative">
        <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} />
        <input className="field !pl-10 !pr-11" name={name} type={visible ? "text" : "password"} minLength={8} autoComplete={autoComplete} required />
        <button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-muted" aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await clientApi<{ user: User }>("/api/session/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const requested = searchParams.get("regreso");
      router.push(requested?.startsWith("/") ? requested : roleHome(response.user.role));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={submit} noValidate>
      <label className="grid gap-2 text-sm font-bold">Correo electrónico<span className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="field !pl-10" name="email" type="email" autoComplete="email" required placeholder="nombre@correo.com" /></span></label>
      <PasswordField name="password" autoComplete="current-password" />
      {error && <p className="rounded-[6px] border border-[#dfb5b1] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}
      <button className="button-primary mt-1 w-full" type="submit" disabled={loading}>{loading && <LoaderCircle className="animate-spin" size={18} />} Ingresar</button>
      <p className="text-center text-sm text-muted">¿Aún no tienes cuenta? <Link className="font-extrabold text-teal" href="/registro">Regístrate</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("rol") === "MERCHANT" ? "MERCHANT" : "CUSTOMER";
  const [role, setRole] = useState<"CUSTOMER" | "MERCHANT">(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("plainPassword"));
    if (password !== form.get("confirmPassword")) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    try {
      const response = await clientApi<{ user: User }>("/api/session/register", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), phone: form.get("phone") || undefined, plainPassword: password, role }),
      });
      router.push(roleHome(response.user.role));
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No pudimos crear tu cuenta.");
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 grid gap-5" onSubmit={submit} noValidate>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Quiero usar Mall GYE para</legend>
        <div className="grid grid-cols-2 rounded-[7px] border border-line bg-white p-1">
          <button type="button" className={`min-h-10 rounded-[5px] text-sm font-extrabold ${role === "CUSTOMER" ? "bg-teal text-white" : "text-muted"}`} onClick={() => setRole("CUSTOMER")}>Comprar</button>
          <button type="button" className={`min-h-10 rounded-[5px] text-sm font-extrabold ${role === "MERCHANT" ? "bg-teal text-white" : "text-muted"}`} onClick={() => setRole("MERCHANT")}>Vender</button>
        </div>
      </fieldset>
      <label className="grid gap-2 text-sm font-bold">Correo electrónico<span className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="field !pl-10" name="email" type="email" autoComplete="email" required placeholder="nombre@correo.com" /></span></label>
      <label className="grid gap-2 text-sm font-bold">Teléfono <span className="font-normal text-muted">(opcional)</span><span className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={17} /><input className="field !pl-10" name="phone" type="tel" autoComplete="tel" placeholder="+593 99 000 0000" /></span></label>
      <PasswordField name="plainPassword" autoComplete="new-password" />
      <PasswordField name="confirmPassword" label="Confirmar contraseña" autoComplete="new-password" />
      <p className="text-xs leading-5 text-muted">Al registrarte aceptas el uso de tus datos para gestionar tu cuenta y pedidos.</p>
      {error && <p className="rounded-[6px] border border-[#dfb5b1] bg-[#fff5f3] p-3 text-sm text-[var(--danger)]" role="alert">{error}</p>}
      <button className="button-primary w-full" type="submit" disabled={loading}>{loading && <LoaderCircle className="animate-spin" size={18} />} Crear mi cuenta</button>
      <p className="text-center text-sm text-muted">¿Ya tienes cuenta? <Link className="font-extrabold text-teal" href="/login">Ingresa</Link></p>
    </form>
  );
}
