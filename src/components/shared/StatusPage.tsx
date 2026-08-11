import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Página de estado (401, 403, sesión expirada). Vive en `shared` porque no
 * pertenece a ningún módulo de negocio y no es un primitivo del design system.
 */
export function StatusPage({
  codigo,
  titulo,
  descripcion,
  accion,
}: {
  codigo: string;
  titulo: string;
  descripcion: string;
  accion: { href: string; label: string };
}) {
  return (
    <div className="bg-background relative grid min-h-dvh place-items-center p-4 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45rem_30rem_at_50%_-10%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />

      <div className="relative max-w-md space-y-3">
        <p className="text-muted-foreground font-mono text-sm">{codigo}</p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="text-muted-foreground text-sm">{descripcion}</p>
        <Button render={<Link href={accion.href} />} size="lg" className="mt-2">
          {accion.label}
        </Button>
      </div>
    </div>
  );
}
