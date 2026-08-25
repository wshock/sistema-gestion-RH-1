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
import type { DepartmentOption } from "@/features/departamentos/data/department";
import type { ShiftOption } from "@/features/turnos/data/shift";
import type { EmployeeQuery } from "@/features/empleados/schemas";

const TODOS = "todos";

/**
 * Filtros del listado: departamento, turno y estado, más la acción de
 * limpiarlos junto con la búsqueda.
 *
 * Cada select escribe directamente en la URL —sin retardo, a diferencia de
 * `SearchInput`— porque elegir una opción ya es una decisión tomada, no texto
 * a medio escribir.
 */
export function EmployeeFilters({
  departamentos,
  turnos,
  query,
}: {
  departamentos: DepartmentOption[];
  turnos: ShiftOption[];
  query: EmployeeQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, iniciarTransicion] = useTransition();

  function actualizar(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams);

    if (valor === TODOS) {
      params.delete(clave);
    } else {
      params.set(clave, valor);
    }

    // Cambiar un filtro invalida la página actual: el conjunto filtrado
    // puede tener menos páginas que la que se estaba mirando.
    params.delete("page");

    iniciarTransicion(() => router.replace(`${pathname}?${params.toString()}`));
  }

  const hayFiltrosActivos =
    Boolean(query.q) ||
    query.departmentId !== undefined ||
    query.shiftId !== undefined ||
    query.estado !== "todos";

  function limpiar() {
    iniciarTransicion(() => router.replace(pathname));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={query.departmentId ? String(query.departmentId) : TODOS}
        onValueChange={(valor) => actualizar("departmentId", valor as string)}
      >
        <SelectTrigger aria-label="Filtrar por departamento">
          <SelectValue placeholder="Departamento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los departamentos</SelectItem>
          {departamentos.map((departamento) => (
            <SelectItem
              key={departamento.departmentId}
              value={String(departamento.departmentId)}
            >
              {departamento.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={query.shiftId ? String(query.shiftId) : TODOS}
        onValueChange={(valor) => actualizar("shiftId", valor as string)}
      >
        <SelectTrigger aria-label="Filtrar por turno">
          <SelectValue placeholder="Turno" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los turnos</SelectItem>
          {turnos.map((turno) => (
            <SelectItem key={turno.shiftId} value={String(turno.shiftId)}>
              {turno.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={query.estado}
        onValueChange={(valor) => actualizar("estado", valor as string)}
      >
        <SelectTrigger aria-label="Filtrar por estado">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={TODOS}>Todos los estados</SelectItem>
          <SelectItem value="activos">Activos</SelectItem>
          <SelectItem value="inactivos">Inactivos</SelectItem>
        </SelectContent>
      </Select>

      {hayFiltrosActivos && (
        <Button variant="ghost" size="sm" onClick={limpiar}>
          <XIcon />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
