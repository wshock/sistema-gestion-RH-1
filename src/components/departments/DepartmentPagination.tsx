import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Paginador sin JavaScript de cliente: son enlaces normales que cambian la
 * URL, y el servidor responde con la página pedida.
 */
export function DepartmentPagination({
  page,
  pageCount,
  total,
  q,
}: {
  page: number;
  pageCount: number;
  total: number;
  q: string;
}) {
  function enlaceA(pagina: number): string {
    const params = new URLSearchParams();

    if (q) {
      params.set("q", q);
    }

    if (pagina > 1) {
      params.set("page", String(pagina));
    }

    const consulta = params.toString();

    return consulta ? `/departamentos?${consulta}` : "/departamentos";
  }

  const hayAnterior = page > 1;
  const haySiguiente = page < pageCount;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-muted-foreground text-sm">
        {total === 0
          ? "Sin resultados"
          : `Página ${page} de ${pageCount} · ${total} ${total === 1 ? "departamento" : "departamentos"}`}
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
