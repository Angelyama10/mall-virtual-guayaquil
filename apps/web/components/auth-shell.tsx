import Image from "next/image";
import { BadgeCheck, MapPin, Store } from "lucide-react";

export function AuthShell({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <main id="contenido-principal" className="container-page py-10 md:py-16">
      <div className="surface grid min-h-[690px] overflow-hidden lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center bg-paper p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-md">
            <p className="eyebrow">{eyebrow}</p>
            <h1 className="display-title mt-3 text-[48px] md:text-[58px]">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-muted">{description}</p>
            {children}
          </div>
        </section>
        <section className="relative hidden min-h-[690px] lg:block">
          <Image src="/images/hero-guayaquil-marketplace.png" alt="Comercio local en Guayaquil" fill loading="eager" className="object-cover object-[70%_center]" sizes="50vw" />
          <div className="absolute inset-0 bg-[#102e2cbf]" />
          <div className="absolute inset-x-10 bottom-10 text-white">
            <p className="font-display text-4xl font-semibold leading-tight">Todo el comercio local, más cerca.</p>
            <div className="mt-7 grid gap-3 text-sm text-white/80">
              <span className="flex items-center gap-2"><Store size={17} /> Comercios reales</span>
              <span className="flex items-center gap-2"><MapPin size={17} /> Atención en Guayaquil</span>
              <span className="flex items-center gap-2"><BadgeCheck size={17} /> Operaciones protegidas</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
