"use client";

import { useRouter } from "next/navigation";
import {
  Controller,
  useForm,
  type Control,
  type FieldErrors,
  type Path,
  type Resolver,
  type UseFormRegister,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { createEmployeeAction } from "@/features/empleados/actions/employee";
import { EmployeePersonJobFields } from "@/features/empleados/components/EmployeePersonJobFields";
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
  type EmployeeEditInput,
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

  // `EmployeeCreateInput` contiene los mismos campos que `EmployeeEditInput`
  // —y con los mismos tipos—, así que el cast es seguro: no hay forma de que
  // el subconjunto común se comporte distinto por venir del esquema más
  // grande. Ver el comentario de `EmployeePersonJobFields`.
  const camposComunes = {
    register: form.register as unknown as UseFormRegister<EmployeeEditInput>,
    control: form.control as unknown as Control<EmployeeEditInput>,
    errors: errors as FieldErrors<EmployeeEditInput>,
  };

  return (
    <form onSubmit={form.handleSubmit(alEnviar)} className="space-y-4">
      <EmployeePersonJobFields {...camposComunes} />

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
