import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Esqueleto de carga del reporte de antigüedad.
 */

function TablaEsqueleto({
  columnas,
  filas,
}: {
  columnas: string[];
  filas: number;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columnas.map((titulo) => (
            <TableHead key={titulo}>{titulo}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: filas }, (_, fila) => (
          <TableRow key={fila}>
            {columnas.map((titulo) => (
              <TableCell key={titulo}>
                <span className="sr-only">Cargando…</span>
                <div className="bg-muted h-4 w-full animate-pulse rounded" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AntiguedadLoading() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="bg-muted h-8 w-64 max-w-full animate-pulse rounded" />
        <div className="bg-muted h-4 w-full max-w-xl animate-pulse rounded" />
      </div>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="bg-muted h-5 w-48 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-0">
          <TablaEsqueleto columnas={["Tramo", "Empleados"]} filas={5} />
        </CardContent>
      </Card>

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardHeader className="border-border/60 border-b pb-3">
          <div className="bg-muted h-5 w-40 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="p-0">
          <TablaEsqueleto
            columnas={["Empleado", "Cargo", "Contratación", "Antigüedad"]}
            filas={8}
          />
        </CardContent>
      </Card>
    </div>
  );
}
