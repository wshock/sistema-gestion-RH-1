import * as headcountData from "@/features/reportes/data/headcount";
import type { GroupCounts } from "@/features/reportes/data/headcount";
import type {
  HeadcountByDepartmentRow,
  HeadcountByShiftRow,
  HeadcountReport,
} from "@/features/reportes/types";
import { ok, unexpected, type Result } from "@/lib/result";

function porcentaje(parte: number, total: number): number {
  return total > 0 ? (parte / total) * 100 : 0;
}

/** El total sale de la misma consulta que las filas, así siempre cuadra. */
function armarReporte<Row extends { employeeCount: number }>({
  rows,
  unassignedCount,
}: GroupCounts<Row>): HeadcountReport<Row & { percentage: number }> {
  const total = rows.reduce((suma, fila) => suma + fila.employeeCount, unassignedCount);

  return {
    rows: rows.map((fila) => ({
      ...fila,
      percentage: porcentaje(fila.employeeCount, total),
    })),
    unassigned: {
      employeeCount: unassignedCount,
      percentage: porcentaje(unassignedCount, total),
    },
    total,
  };
}

export async function getHeadcountByDepartment(): Promise<
  Result<HeadcountReport<HeadcountByDepartmentRow>>
> {
  try {
    return ok(armarReporte(await headcountData.countActiveEmployeesByDepartment()));
  } catch (error) {
    return unexpected("getHeadcountByDepartment", error);
  }
}

export async function getHeadcountByShift(): Promise<
  Result<HeadcountReport<HeadcountByShiftRow>>
> {
  try {
    return ok(armarReporte(await headcountData.countActiveEmployeesByShift()));
  } catch (error) {
    return unexpected("getHeadcountByShift", error);
  }
}
