"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createEmployeeAction } from "@/features/empleados/actions/employee";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  employeeCreateSchema,
  type EmployeeCreateInput,
} from "@/features/empleados/schemas";

type DepartmentOption = { departmentId: number; name: string };
type ShiftOption = { shiftId: number; name: string };

const VALORES_INICIALES = {
  title: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  nationalIdNumber: "",
  loginId: "",
  jobTitle: "",
  birthDate: "",
  maritalStatus: undefined,
  gender: undefined,
  hireDate: "",
  salariedFlag: true,
  vacationHours: 0,
  sickLeaveHours: 0,
  departmentId: undefined,
  shiftId: undefined,
  rate: undefined,
  payFrequency: undefined,
} as unknown as EmployeeCreateInput;

/**
 * Formulario de alta de empleado.
 *
 * Valida en el cliente con el mismo Zod que la Server Action. La del servidor
 * es la que decide: esta se puede saltar. Departamento, turno y salario
 * iniciales se piden acá porque el alta abre historial; no se vuelven a
 * editar en HU-27.
 */
export function EmployeeForm({
  departamentos,
  turnos,
}: {
  departamentos: DepartmentOption[];
  turnos: ShiftOption[];
}) {
  const router = useRouter();
  const form = useForm<EmployeeCreateInput>({
    resolver: zodResolver(employeeCreateSchema) as Resolver<EmployeeCreateInput>,
    defaultValues: VALORES_INICIALES,
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  async function alEnviar(valores: EmployeeCreateInput) {
    const resultado = await createEmployeeAction(valores);

    if (resultado.success) {
      toast.success("Empleado creado.");
      router.push(`/empleados/${resultado.data.businessEntityId}`);

      return;
    }

    const { error } = resultado;

    if (error.fieldErrors) {
      for (const [campo, mensajes] of Object.entries(error.fieldErrors)) {
        form.setError(campo as Path<EmployeeCreateInput>, { message: mensajes[0] });
      }
    }

    toast.error(error.message);
  }

  return (
    <form onSubmit={form.handleSubmit(alEnviar)} className="space-y-4">
      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Datos personales
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField id="firstName" label="Nombre" error={errors.firstName?.message}>
              {(props) => <Input autoFocus {...props} {...form.register("firstName")} />}
            </FormField>

            <FormField
              id="middleName"
              label="Segundo nombre"
              error={errors.middleName?.message}
            >
              {(props) => <Input {...props} {...form.register("middleName")} />}
            </FormField>

            <FormField id="lastName" label="Apellido" error={errors.lastName?.message}>
              {(props) => <Input {...props} {...form.register("lastName")} />}
            </FormField>

            <FormField id="title" label="Tratamiento" error={errors.title?.message}>
              {(props) => (
                <Input {...props} {...form.register("title")} placeholder="Sr., Sra.…" />
              )}
            </FormField>

            <FormField id="suffix" label="Sufijo" error={errors.suffix?.message}>
              {(props) => (
                <Input {...props} {...form.register("suffix")} placeholder="Jr., III…" />
              )}
            </FormField>

            <FormField
              id="nationalIdNumber"
              label="Documento"
              error={errors.nationalIdNumber?.message}
            >
              {(props) => <Input {...props} {...form.register("nationalIdNumber")} />}
            </FormField>

            <FormField
              id="birthDate"
              label="Fecha de nacimiento"
              error={errors.birthDate?.message}
            >
              {(props) => (
                <Input type="date" {...props} {...form.register("birthDate")} />
              )}
            </FormField>

            <FormField
              id="maritalStatus"
              label="Estado civil"
              error={errors.maritalStatus?.message}
            >
              {(props) => (
                <Controller
                  name="maritalStatus"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(valor) => field.onChange(valor)}
                    >
                      <SelectTrigger {...props} className="w-full">
                        <SelectValue placeholder="Seleccioná el estado civil" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S">Soltero/a</SelectItem>
                        <SelectItem value="M">Casado/a</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField id="gender" label="Género" error={errors.gender?.message}>
              {(props) => (
                <Controller
                  name="gender"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(valor) => field.onChange(valor)}
                    >
                      <SelectTrigger {...props} className="w-full">
                        <SelectValue placeholder="Seleccioná el género" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="M">Masculino</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Datos laborales
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField id="jobTitle" label="Cargo" error={errors.jobTitle?.message}>
              {(props) => <Input {...props} {...form.register("jobTitle")} />}
            </FormField>

            <FormField
              id="loginId"
              label="Usuario de red"
              error={errors.loginId?.message}
            >
              {(props) => <Input {...props} {...form.register("loginId")} />}
            </FormField>

            <FormField
              id="hireDate"
              label="Fecha de contratación"
              error={errors.hireDate?.message}
            >
              {(props) => <Input type="date" {...props} {...form.register("hireDate")} />}
            </FormField>

            <FormField
              id="salariedFlag"
              label="Tipo de remuneración"
              error={errors.salariedFlag?.message}
            >
              {(props) => (
                <Controller
                  name="salariedFlag"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? "true" : "false"}
                      onValueChange={(valor) => field.onChange(valor === "true")}
                    >
                      <SelectTrigger {...props} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Asalariado</SelectItem>
                        <SelectItem value="false">Por horas</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField
              id="vacationHours"
              label="Horas de vacaciones"
              error={errors.vacationHours?.message}
            >
              {(props) => (
                <Input
                  type="number"
                  min={0}
                  {...props}
                  {...form.register("vacationHours", { valueAsNumber: true })}
                />
              )}
            </FormField>

            <FormField
              id="sickLeaveHours"
              label="Horas de licencia"
              error={errors.sickLeaveHours?.message}
            >
              {(props) => (
                <Input
                  type="number"
                  min={0}
                  {...props}
                  {...form.register("sickLeaveHours", { valueAsNumber: true })}
                />
              )}
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Asignación y salario iniciales
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Abren el historial del empleado. Los cambios posteriores se registran con
              traslado y cambio salarial, no editando esta ficha.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="departmentId"
              label="Departamento"
              error={errors.departmentId?.message}
            >
              {(props) => (
                <Controller
                  name="departmentId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(valor) => field.onChange(Number(valor))}
                    >
                      <SelectTrigger {...props} className="w-full">
                        <SelectValue placeholder="Seleccioná un departamento" />
                      </SelectTrigger>
                      <SelectContent>
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
                  )}
                />
              )}
            </FormField>

            <FormField id="shiftId" label="Turno" error={errors.shiftId?.message}>
              {(props) => (
                <Controller
                  name="shiftId"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(valor) => field.onChange(Number(valor))}
                    >
                      <SelectTrigger {...props} className="w-full">
                        <SelectValue placeholder="Seleccioná un turno" />
                      </SelectTrigger>
                      <SelectContent>
                        {turnos.map((turno) => (
                          <SelectItem key={turno.shiftId} value={String(turno.shiftId)}>
                            {turno.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>

            <FormField
              id="rate"
              label="Salario por hora (USD)"
              error={errors.rate?.message}
            >
              {(props) => (
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  {...props}
                  {...form.register("rate", { valueAsNumber: true })}
                />
              )}
            </FormField>

            <FormField
              id="payFrequency"
              label="Frecuencia de pago"
              error={errors.payFrequency?.message}
            >
              {(props) => (
                <Controller
                  name="payFrequency"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : undefined}
                      onValueChange={(valor) => field.onChange(Number(valor))}
                    >
                      <SelectTrigger {...props} className="w-full">
                        <SelectValue placeholder="Seleccioná la frecuencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Mensual</SelectItem>
                        <SelectItem value="2">Quincenal</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </FormField>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => router.push("/empleados")}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creando…" : "Crear empleado"}
        </Button>
      </div>
    </form>
  );
}
