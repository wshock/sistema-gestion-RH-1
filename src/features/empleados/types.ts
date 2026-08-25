/**
 * Tipos compartidos del módulo de empleados.
 *
 * Este archivo es el contrato entre la feature de lectura (listado y ficha) y
 * la de escritura (alta, edición y baja). No pertenece a ninguna de las dos:
 * cambiarlo afecta a ambas, así que se modifica de común acuerdo y no dentro
 * de una rama de feature.
 *
 * Ver `docs/acuerdo-empleados.md` para el reparto de archivos y los puntos de
 * montaje entre features.
 *
 * ---
 *
 * Dos conversiones que estos tipos dan por hechas, y que la capa de datos es
 * la responsable de aplicar:
 *
 * 1. **Fechas sin hora como texto.** Las columnas `date` —`birthDate`,
 *    `hireDate`, `startDate`, `endDate`— viajan como `"AAAA-MM-DD"`, no como
 *    `Date`. El driver devuelve un `Date` situado a medianoche UTC, así que
 *    `getDate()` en Bogotá da el día anterior: el empleado 1 nació el
 *    `1969-01-29` y se leería como `1969-01-28`. Ya nos pasó con las horas de
 *    los turnos (ver `src/features/turnos/data/shift.ts`); acá se corta igual,
 *    en SQL, con `to_char(columna, 'YYYY-MM-DD')`.
 *
 * 2. **Importes como número.** `rate` es `Decimal` en Prisma: llega como
 *    objeto de decimal.js —comprobado— y no sobrevive el paso de Server a
 *    Client Component. Se convierte a `number` en la capa de datos. Cualquier
 *    aritmética con salarios se hace antes de esa conversión, no en la
 *    presentación.
 *
 * Los `timestamptz` —`modifiedDate`, `rateChangeDate`— sí son instantes
 * reales y se mantienen como `Date`.
 */

/** Estado civil. Valores heredados de AdventureWorks: soltero / casado. */
export type MaritalStatus = "S" | "M";

/** Género tal como lo almacena AdventureWorks. */
export type Gender = "M" | "F";

/** Frecuencia de pago: 1 = mensual, 2 = quincenal. */
export type PayFrequency = 1 | 2;

/**
 * Fila del listado.
 *
 * Deliberadamente plana y sin historiales: es lo que se pinta en una tabla de
 * muchas filas. El departamento y el turno son los de la asignación vigente y
 * llegan ya resueltos a nombre, para no obligar a la vista a cruzar catálogos.
 */
export type EmployeeListItem = {
  businessEntityId: number;
  firstName: string;
  lastName: string;
  nationalIdNumber: string;
  jobTitle: string;
  /** `"AAAA-MM-DD"`. */
  hireDate: string;
  /** `false` = dado de baja lógicamente. */
  currentFlag: boolean;
  /** Nombre del departamento vigente; `null` si no tiene asignación abierta. */
  departmentName: string | null;
  /** Nombre del turno vigente; `null` si no tiene asignación abierta. */
  shiftName: string | null;
};

/**
 * Una asignación a departamento y turno.
 *
 * Sirve tanto para la vigente como para cada fila del historial: la única
 * diferencia es `endDate`, que es `null` mientras la asignación sigue abierta.
 */
export type EmployeeAssignment = {
  departmentId: number;
  departmentName: string;
  shiftId: number;
  shiftName: string;
  /** `"AAAA-MM-DD"`. */
  startDate: string;
  /** `"AAAA-MM-DD"`, o `null` si es la asignación vigente. */
  endDate: string | null;
};

/** Una fila del historial salarial. El vigente es el de fecha más reciente. */
export type EmployeePayRecord = {
  /** Instante del cambio; forma parte de la clave primaria. */
  rateChangeDate: Date;
  /** Importe por hora, ya convertido desde `Decimal`. */
  rate: number;
  payFrequency: PayFrequency;
};

/**
 * Ficha de detalle.
 *
 * Reúne los datos propios del empleado, los de su persona y lo derivado de
 * los históricos. `currentAssignment` y `currentPay` se exponen aparte de los
 * historiales aunque salgan de ellos: son lo que la ficha muestra arriba, y
 * calcularlos en la vista invitaría a que cada pantalla lo hiciera distinto.
 */
export type EmployeeDetail = {
  businessEntityId: number;

  // Persona
  title: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  suffix: string | null;

  // Empleado
  nationalIdNumber: string;
  loginId: string;
  jobTitle: string;
  /** `"AAAA-MM-DD"`. */
  birthDate: string;
  maritalStatus: MaritalStatus;
  gender: Gender;
  /** `"AAAA-MM-DD"`. */
  hireDate: string;
  /** `true` = asalariado, `false` = por horas. */
  salariedFlag: boolean;
  vacationHours: number;
  sickLeaveHours: number;
  /** `false` = dado de baja lógicamente. */
  currentFlag: boolean;
  modifiedDate: Date;

  // Derivados de los históricos
  currentAssignment: EmployeeAssignment | null;
  currentPay: EmployeePayRecord | null;
  assignmentHistory: EmployeeAssignment[];
  payHistory: EmployeePayRecord[];
};
