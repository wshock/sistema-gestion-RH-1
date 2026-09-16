"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
import type { TransferLogQuery } from "@/features/procesos/schemas";

const TODOS = "todos";

export function TransferLogFilters({
  departamentos,
  turnos,
  query,
}: {
  departamentos: DepartmentOption[];
  turnos: ShiftOption[];
  query: TransferLogQuery;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function actualizar(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor === TODOS) params.delete(clave);
    else params.set(clave, valor);
    params.delete("page");
    startTransition(() => router.replace(`${pathname}?${params.toString()}`));
  }

  function limpiar() {
    startTransition(() => router.replace(pathname));
  }

  const activos =
    query.departmentId !== undefined ||
    query.shiftId !== undefined ||
    query.from ||
    query.to;

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select
        value={query.departmentId ? String(query.departmentId) : TODOS}
        onValueChange={(value) => actualizar("departmentId", value as string)}
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
        onValueChange={(value) => actualizar("shiftId", value as string)}
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
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">
        Desde
        <input
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          type="date"
          value={query.from ?? ""}
          onChange={(event) => actualizar("from", event.target.value)}
        />
      </label>
      <label className="text-muted-foreground flex flex-col gap-1 text-xs">
        Hasta
        <input
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
          type="date"
          value={query.to ?? ""}
          onChange={(event) => actualizar("to", event.target.value)}
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
