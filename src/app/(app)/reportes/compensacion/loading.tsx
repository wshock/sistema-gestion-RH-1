import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Esqueleto de carga del reporte de compensación.
 *
 * Next.js lo muestra mientras la página servidor resuelve la consulta.
 */

const COLUMNAS = ["Departamento", "Grupo", "Activos", "Promedio", "Mínimo", "Máximo"];

export default function CompensacionLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="bg-muted h-8 w-72 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNAS.map((titulo) => (
                  <TableHead key={titulo}>{titulo}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }, (_, fila) => (
                <TableRow key={fila}>
                  {COLUMNAS.map((titulo) => (
                    <TableCell key={titulo}>
                      <span className="sr-only">Cargando…</span>
                      <div className="bg-muted h-4 w-full animate-pulse rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
