import { AlertCircleIcon, InboxIcon } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * Tabla de datos genérica.
 *
 * No conoce ninguna entidad del dominio: recibe las columnas y las filas, y
 * cada columna decide cómo pintar su celda. Los módulos de empleados,
 * candidatos y turnos se construyen sobre esta misma tabla.
 *
 * No lleva `"use client"` a propósito: sin hooks ni APIs de servidor, funciona
 * igual dentro de un Server Component (como el listado de departamentos, que
 * pagina en el servidor) que dentro de uno de cliente que maneje su propia
 * carga.
 */

export type DataTableColumn<T> = {
  /** Identifica la columna en el `key` de React. */
  id: string;
  header: React.ReactNode;
  cell: (fila: T) => React.ReactNode;
  /** Clases aplicadas a la celda y a su encabezado, p. ej. para ocultarla en móvil. */
  className?: string;
};

export function DataTable<T>({
  columnas,
  filas,
  idDeFila,
  cargando = false,
  error,
  vacio = "No hay registros para mostrar.",
  filasDeCarga = 5,
}: {
  columnas: DataTableColumn<T>[];
  filas: T[];
  idDeFila: (fila: T) => React.Key;
  /** Muestra filas de esqueleto en lugar de datos. */
  cargando?: boolean;
  /** Mensaje de fallo. Tiene prioridad sobre el resto de estados. */
  error?: string;
  /** Mensaje cuando la consulta no devolvió filas. */
  vacio?: React.ReactNode;
  filasDeCarga?: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columnas.map((columna) => (
            <TableHead key={columna.id} className={columna.className}>
              {columna.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        <DataTableBody
          columnas={columnas}
          filas={filas}
          idDeFila={idDeFila}
          cargando={cargando}
          error={error}
          vacio={vacio}
          filasDeCarga={filasDeCarga}
        />
      </TableBody>
    </Table>
  );
}

function DataTableBody<T>({
  columnas,
  filas,
  idDeFila,
  cargando,
  error,
  vacio,
  filasDeCarga,
}: {
  columnas: DataTableColumn<T>[];
  filas: T[];
  idDeFila: (fila: T) => React.Key;
  cargando: boolean;
  error?: string;
  vacio: React.ReactNode;
  filasDeCarga: number;
}) {
  // El orden importa: un fallo se comunica aunque queden datos viejos en
  // pantalla, y la carga gana al vacío para no anunciar "sin resultados"
  // mientras la consulta sigue en curso.
  if (error) {
    return (
      <MensajeDeEstado colSpan={columnas.length} tono="error">
        <AlertCircleIcon className="text-destructive size-4 shrink-0" />
        {error}
      </MensajeDeEstado>
    );
  }

  if (cargando) {
    return (
      <>
        {Array.from({ length: filasDeCarga }, (_, fila) => (
          <TableRow key={fila}>
            {columnas.map((columna) => (
              <TableCell key={columna.id} className={columna.className}>
                <span className="sr-only">Cargando…</span>
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </>
    );
  }

  if (filas.length === 0) {
    return (
      <MensajeDeEstado colSpan={columnas.length}>
        <InboxIcon className="size-4 shrink-0" />
        {vacio}
      </MensajeDeEstado>
    );
  }

  return (
    <>
      {filas.map((fila) => (
        <TableRow key={idDeFila(fila)}>
          {columnas.map((columna) => (
            <TableCell key={columna.id} className={columna.className}>
              {columna.cell(fila)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function MensajeDeEstado({
  colSpan,
  tono,
  children,
}: {
  colSpan: number;
  tono?: "error";
  children: React.ReactNode;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={colSpan}
        // `whitespace-normal` revierte el `nowrap` que TableCell aplica a los
        // datos: un mensaje largo tiene que poder partirse en móvil.
        className={cn(
          "text-muted-foreground py-10 text-center whitespace-normal",
          tono === "error" && "text-destructive",
        )}
      >
        <span className="flex items-center justify-center gap-2 text-sm">{children}</span>
      </TableCell>
    </TableRow>
  );
}
