import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatInstantDate,
  formatPayRate,
  PAY_FREQUENCY_LABEL,
} from "@/features/empleados/format";
import type { EmployeePayRecord } from "@/features/empleados/types";

/**
 * Historial salarial completo.
 *
 * Cada fila es un cambio registrado: no se actualiza, se acumula. El vigente
 * es el de fecha más reciente (`currentPay`); se etiqueta igual que la
 * asignación abierta para poder comprobar un cambio recién registrado.
 * El orden descendente lo resuelve el servicio.
 */

function esVigente(
  registro: EmployeePayRecord,
  vigente: EmployeePayRecord | null,
): boolean {
  return (
    vigente !== null &&
    registro.rateChangeDate.getTime() === vigente.rateChangeDate.getTime()
  );
}

export function EmployeePayHistory({
  history,
  vigente,
}: {
  history: EmployeePayRecord[];
  vigente: EmployeePayRecord | null;
}) {
  const columnas: DataTableColumn<EmployeePayRecord>[] = [
    {
      id: "rate",
      header: "Tarifa",
      cell: (registro) => (
        <span className={esVigente(registro, vigente) ? "font-medium" : undefined}>
          {formatPayRate(registro.rate)}
          <span className="text-muted-foreground font-normal"> / hora</span>
        </span>
      ),
    },
    {
      id: "payFrequency",
      header: "Frecuencia",
      className: "text-muted-foreground",
      cell: (registro) => PAY_FREQUENCY_LABEL[registro.payFrequency],
    },
    {
      id: "rateChangeDate",
      header: "Fecha de cambio",
      className: "text-muted-foreground",
      cell: (registro) => formatInstantDate(registro.rateChangeDate),
    },
    {
      id: "estado",
      header: "Estado",
      cell: (registro) =>
        esVigente(registro, vigente) ? (
          <Badge variant="secondary">Vigente</Badge>
        ) : (
          <Badge variant="outline">Anterior</Badge>
        ),
    },
  ];

  return (
    <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
      <CardContent className="space-y-3">
        <h3 className="font-heading text-sm font-semibold tracking-tight">
          Historial salarial
        </h3>
      </CardContent>
      <CardContent className="p-0">
        <DataTable
          columnas={columnas}
          filas={history}
          idDeFila={(registro) => registro.rateChangeDate.toISOString()}
          claseDeFila={(registro) =>
            esVigente(registro, vigente) ? undefined : "text-muted-foreground"
          }
          vacio="Este empleado no tiene historial salarial."
        />
      </CardContent>
    </Card>
  );
}
