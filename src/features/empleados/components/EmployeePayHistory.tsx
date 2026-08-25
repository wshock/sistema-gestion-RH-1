import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
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
 * Cada fila es un cambio registrado: no se actualiza, se acumula. El servicio
 * entrega el arreglo ya ordenado de más reciente a más antiguo.
 */

export function EmployeePayHistory({ history }: { history: EmployeePayRecord[] }) {
  const columnas: DataTableColumn<EmployeePayRecord>[] = [
    {
      id: "rate",
      header: "Tarifa",
      cell: (registro) => (
        <span className="font-medium">
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
          vacio="Este empleado no tiene historial salarial."
        />
      </CardContent>
    </Card>
  );
}
