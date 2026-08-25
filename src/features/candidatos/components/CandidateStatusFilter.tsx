"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CandidateQuery } from "@/features/candidatos/schemas";

const TODOS = "todos";

/**
 * Filtro por estado del listado de candidatos. Único filtro del módulo, así
 * que no hace falta el componente combinado de `empleados`.
 */
export function CandidateStatusFilter({ estado }: { estado: CandidateQuery["estado"] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, iniciarTransicion] = useTransition();

  function actualizar(valor: string) {
    const params = new URLSearchParams(searchParams);

    if (valor === TODOS) {
      params.delete("estado");
    } else {
      params.set("estado", valor);
    }

    params.delete("page");

    iniciarTransicion(() => router.replace(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={estado} onValueChange={(valor) => actualizar(valor as string)}>
        <SelectTrigger aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los estados</SelectItem>
          <SelectItem value="pendientes">Pendientes</SelectItem>
          <SelectItem value="contratados">Contratados</SelectItem>
        </SelectContent>
      </Select>

      {estado !== TODOS && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => iniciarTransicion(() => router.replace(pathname))}
        >
          <XIcon />
          Limpiar filtro
        </Button>
      )}
    </div>
  );
}
