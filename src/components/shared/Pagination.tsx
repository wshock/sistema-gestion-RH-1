import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Paginador sin JavaScript de cliente: son enlaces normales que cambian la
 * URL, y el servidor responde con la página pedida.
 *
 * Recibe la ruta y los parámetros a conservar en lugar de conocerlos, de modo
 * que sirve igual para cualquier listado.
 */
export function Pagination({
  page,
  pageCount,
  total,
  basePath,
  params = {},
  singular,
  plural,
}: {
  page: number;
  pageCount: number;
  total: number;
  /** Ruta del listado, p. ej. "/turnos". */
  basePath: string;
  /** Parámetros que deben sobrevivir al cambio de página; los vacíos se omiten. */
  params?: Record<string, string | undefined>;
  singular: string;
  plural: string;
}) {
  function enlaceA(pagina: number): string {
    const busqueda = new URLSearchParams();

    for (const [clave, valor] of Object.entries(params)) {
      if (valor) {
        busqueda.set(clave, valor);
      }
    }

    // La página 1 se omite para que la URL canónica del listado sea la ruta
    // limpia, sin `?page=1`.
    if (pagina > 1) {
      busqueda.set("page", String(pagina));
    }

    const consulta = busqueda.toString();

    return consulta ? `${basePath}?${consulta}` : basePath;
  }

  const hayAnterior = page > 1;
  const haySiguiente = page < pageCount;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        {total === 0
          ? "Sin resultados"
          : `Página ${page} de ${pageCount} · ${total} ${total === 1 ? singular : plural}`}
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={!hayAnterior}
          render={hayAnterior ? <Link href={enlaceA(page - 1)} /> : <span />}
        >
          <ChevronLeftIcon />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!haySiguiente}
          render={haySiguiente ? <Link href={enlaceA(page + 1)} /> : <span />}
        >
          Siguiente
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
