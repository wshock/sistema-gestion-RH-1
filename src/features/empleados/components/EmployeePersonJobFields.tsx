import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";

import { FormField } from "@/components/shared/FormField";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { EmployeeEditInput } from "@/features/empleados/schemas";

/**
 * Datos de persona y de empleado, compartidos por el alta y la edición.
 *
 * Tipado contra `EmployeeEditInput` —el subconjunto de campos común a las
 * dos— porque `EmployeeCreateInput` lo contiene entero con los mismos
 * nombres y tipos (ambos se construyen a partir de `camposDeEmpleado` en
 * `schemas.ts`). El alta pasa su `register`/`control`/`errors` con un cast
 * seguro; ver `EmployeeForm.tsx`.
 *
 * No incluye departamento, turno ni salario: esos solo los pide el alta,
 * porque abren historial. La edición no los toca.
 */
export function EmployeePersonJobFields({
  register,
  control,
  errors,
}: {
  register: UseFormRegister<EmployeeEditInput>;
  control: Control<EmployeeEditInput>;
  errors: FieldErrors<EmployeeEditInput>;
}) {
  return (
    <>
      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Datos personales
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField id="firstName" label="Nombre" error={errors.firstName?.message}>
              {(props) => <Input autoFocus {...props} {...register("firstName")} />}
            </FormField>

            <FormField
              id="middleName"
              label="Segundo nombre"
              error={errors.middleName?.message}
            >
              {(props) => <Input {...props} {...register("middleName")} />}
            </FormField>

            <FormField id="lastName" label="Apellido" error={errors.lastName?.message}>
              {(props) => <Input {...props} {...register("lastName")} />}
            </FormField>

            <FormField id="title" label="Tratamiento" error={errors.title?.message}>
              {(props) => (
                <Input {...props} {...register("title")} placeholder="Sr., Sra.…" />
              )}
            </FormField>

            <FormField id="suffix" label="Sufijo" error={errors.suffix?.message}>
              {(props) => (
                <Input {...props} {...register("suffix")} placeholder="Jr., III…" />
              )}
            </FormField>

            <FormField
              id="nationalIdNumber"
              label="Documento"
              error={errors.nationalIdNumber?.message}
            >
              {(props) => <Input {...props} {...register("nationalIdNumber")} />}
            </FormField>

            <FormField
              id="birthDate"
              label="Fecha de nacimiento"
              error={errors.birthDate?.message}
            >
              {(props) => <Input type="date" {...props} {...register("birthDate")} />}
            </FormField>

            <FormField
              id="maritalStatus"
              label="Estado civil"
              error={errors.maritalStatus?.message}
            >
              {(props) => (
                <Controller
                  name="maritalStatus"
                  control={control}
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
                  control={control}
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
              {(props) => <Input {...props} {...register("jobTitle")} />}
            </FormField>

            <FormField
              id="loginId"
              label="Usuario de red"
              error={errors.loginId?.message}
            >
              {(props) => <Input {...props} {...register("loginId")} />}
            </FormField>

            <FormField
              id="hireDate"
              label="Fecha de contratación"
              error={errors.hireDate?.message}
            >
              {(props) => <Input type="date" {...props} {...register("hireDate")} />}
            </FormField>

            <FormField
              id="salariedFlag"
              label="Tipo de remuneración"
              error={errors.salariedFlag?.message}
            >
              {(props) => (
                <Controller
                  name="salariedFlag"
                  control={control}
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
                  {...register("vacationHours", { valueAsNumber: true })}
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
                  {...register("sickLeaveHours", { valueAsNumber: true })}
                />
              )}
            </FormField>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
