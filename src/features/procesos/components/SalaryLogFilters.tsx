"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/SearchInput";
import type { SalaryLogQuery } from "@/features/procesos/schemas";

export function SalaryLogFilters({ query }: { query: SalaryLogQuery }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const activos = Boolean(query.q || query.from || query.to);

  function actualizarFecha(clave: "from" | "to", valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor) params.set(clave, valor);
    else params.delete(clave);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function limpiar() {
    startTransition(() => router.replace(pathname));
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <SearchInput
        key={query.q}
        valorInicial={query.q}
        placeholder="Buscar empleado…"
        etiqueta="Filtrar cambios salariales por empleado"
      />
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">
        Desde
        <input
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          type="date"
          value={query.from ?? ""}
          onChange={(event) => actualizarFecha("from", event.target.value)}
        />
      </label>
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">
        Hasta
        <input
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          type="date"
          value={query.to ?? ""}
          onChange={(event) => actualizarFecha("to", event.target.value)}
        />
      </label>
      {activos && (
        <Button variant="ghost" size="sm" onClick={limpiar}>
          <XIcon />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
