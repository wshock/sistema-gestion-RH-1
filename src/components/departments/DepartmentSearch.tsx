"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircleIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

const RETARDO_MS = 300;

/**
 * Buscador de departamentos.
 *
 * El término vive en la URL, no en estado de React: así el filtro se puede
 * compartir por enlace, sobrevive al botón atrás y el filtrado real ocurre en
 * el servidor. El estado local existe solo para que el input responda mientras
 * se espera el retardo.
 */
export function DepartmentSearch({ valorInicial }: { valorInicial: string }) {
  const [texto, setTexto] = useState(valorInicial);
  const [pendiente, iniciarTransicion] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (texto === valorInicial) {
      return;
    }

    const temporizador = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (texto) {
        params.set("q", texto);
      } else {
        params.delete("q");
      }

      // Cambiar el filtro invalida la página actual: la nueva búsqueda puede
      // tener menos resultados que páginas había.
      params.delete("page");

      iniciarTransicion(() => router.replace(`${pathname}?${params.toString()}`));
    }, RETARDO_MS);

    return () => clearTimeout(temporizador);
  }, [texto, valorInicial, pathname, router, searchParams]);

  return (
    <div className="relative w-full sm:max-w-xs">
      <SearchIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="search"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        placeholder="Buscar por nombre…"
        aria-label="Buscar departamentos por nombre"
        className="pl-8"
      />
      {pendiente && (
        <LoaderCircleIcon className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
      )}
    </div>
  );
}
