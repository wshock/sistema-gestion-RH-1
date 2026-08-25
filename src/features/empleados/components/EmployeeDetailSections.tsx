import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import type {
  EmployeeDetail,
  Gender,
  MaritalStatus,
  PayFrequency,
} from "@/features/empleados/types";

/**
 * Tres bloques de la ficha: personales, laborales y situación vigente.
 *
 * Los historiales completos (HU de F05 posterior) no viven acá: esta vista
 * solo muestra el departamento, el turno y el salario que cuentan hoy.
 */

const ESTADO_CIVIL: Record<MaritalStatus, string> = {
  S: "Soltero/a",
  M: "Casado/a",
};

const GENERO: Record<Gender, string> = {
  F: "Femenino",
  M: "Masculino",
};

const FRECUENCIA: Record<PayFrequency, string> = {
  1: "Mensual",
  2: "Quincenal",
};

const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const formatoSalario = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Fecha de calendario `"AAAA-MM-DD"` → texto, sin correr el día por el huso. */
function fechaDeCalendario(iso: string): string {
  const [anio, mes, dia] = iso.split("-").map(Number);

  return formatoFecha.format(new Date(Date.UTC(anio, mes - 1, dia)));
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {etiqueta}
      </dt>
      <dd className="text-sm wrap-break-word">{valor}</dd>
    </div>
  );
}

export function EmployeeDetailSections({ empleado }: { empleado: EmployeeDetail }) {
  const nombre = [
    empleado.title,
    empleado.firstName,
    empleado.middleName,
    empleado.lastName,
  ]
    .filter(Boolean)
    .join(" ");
  const nombreConSufijo = empleado.suffix ? `${nombre} ${empleado.suffix}` : nombre;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-card/60 backdrop-blur-xl md:col-span-2">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Datos personales
          </h3>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Campo etiqueta="Nombre" valor={nombreConSufijo} />
            <Campo etiqueta="Documento" valor={empleado.nationalIdNumber} />
            <Campo
              etiqueta="Fecha de nacimiento"
              valor={fechaDeCalendario(empleado.birthDate)}
            />
            <Campo etiqueta="Estado civil" valor={ESTADO_CIVIL[empleado.maritalStatus]} />
            <Campo etiqueta="Género" valor={GENERO[empleado.gender]} />
          </dl>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Datos laborales
          </h3>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo etiqueta="Cargo" valor={empleado.jobTitle} />
            <Campo
              etiqueta="Fecha de contratación"
              valor={fechaDeCalendario(empleado.hireDate)}
            />
            <Campo
              etiqueta="Tipo de remuneración"
              valor={empleado.salariedFlag ? "Asalariado" : "Por horas"}
            />
            <Campo etiqueta="Horas de vacaciones" valor={empleado.vacationHours} />
            <Campo etiqueta="Horas de licencia" valor={empleado.sickLeaveHours} />
            <Campo
              etiqueta="Estado"
              valor={empleado.currentFlag ? "Activo" : "Inactivo"}
            />
            <Campo etiqueta="Usuario de red" valor={empleado.loginId} />
          </dl>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Situación vigente
          </h3>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo
              etiqueta="Departamento"
              valor={
                empleado.currentAssignment?.departmentName ?? (
                  <span className="text-muted-foreground">Sin asignación vigente</span>
                )
              }
            />
            <Campo
              etiqueta="Turno"
              valor={
                empleado.currentAssignment?.shiftName ?? (
                  <span className="text-muted-foreground">Sin asignación vigente</span>
                )
              }
            />
            <Campo
              etiqueta="Salario actual"
              valor={
                empleado.currentPay ? (
                  <span>
                    {formatoSalario.format(empleado.currentPay.rate)} / hora
                    <span className="text-muted-foreground">
                      {" "}
                      · {FRECUENCIA[empleado.currentPay.payFrequency]}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Sin historial salarial</span>
                )
              }
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
