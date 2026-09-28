/**
 * Tipos del módulo de reportes.
 *
 * Los importes llegan ya convertidos a `number` desde la capa de datos: el
 * `Decimal` de Prisma no sobrevive el cruce a Client Components.
 */

/**
 * Fila del reporte de salario promedio por departamento.
 *
 * `averageRate` / `minRate` / `maxRate` son `null` cuando el departamento no
 * tiene empleados activos con historial salarial (incluye el caso de cero
 * empleados activos).
 */
export type AverageSalaryByDepartmentRow = {
  departmentId: number;
  name: string;
  groupName: string;
  /** Empleados activos con asignación vigente en este departamento. */
  employeeCount: number;
  /**
   * Empleados activos del departamento sin ninguna fila en
   * `EmployeePayHistory`. No entran en promedio, mínimo ni máximo.
   */
  withoutPayCount: number;
  /** Promedio de la tarifa horaria vigente; `null` si nadie aporta salario. */
  averageRate: number | null;
  minRate: number | null;
  maxRate: number | null;
};

/**
 * Identificador estable de un tramo de antigüedad.
 *
 * Los límites son años cumplidos a la fecha actual. Las contrataciones
 * antiguas de AdventureWorks caen sobre todo en los tramos altos: es el
 * comportamiento esperado.
 */
export type SeniorityBracketId =
  | "lt5"
  | "y5to9"
  | "y10to14"
  | "y15to19"
  | "y20plus";

/** Resumen de cuántos empleados activos caen en un tramo. */
export type SeniorityBracketRow = {
  bracketId: SeniorityBracketId;
  label: string;
  employeeCount: number;
};

/** Fila del detalle de antigüedad. */
export type SeniorityEmployeeRow = {
  businessEntityId: number;
  firstName: string;
  lastName: string;
  jobTitle: string;
  /** `"AAAA-MM-DD"`. */
  hireDate: string;
  /** Años cumplidos desde `hireDate` hasta hoy. */
  yearsOfService: number;
};
