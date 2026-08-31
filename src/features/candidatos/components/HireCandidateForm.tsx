"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { hireCandidateAction } from "@/features/candidatos/actions/hire";
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
  hireCandidateSchema,
  type HireCandidateInput,
} from "@/features/candidatos/schemas";

type DepartmentOption = { departmentId: number; name: string };
type ShiftOption = { shiftId: number; name: string };

const VALORES_INICIALES = {
  nationalIdNumber: "",
  jobTitle: "",
  birthDate: "",
  maritalStatus: undefined,
  gender: undefined,
  hireDate: "",
  departmentId: undefined,
  shiftId: undefined,
  rate: undefined,
  payFrequency: undefined,
} as unknown as HireCandidateInput;

/**
 * Formulario de condiciones de contratación.
 *
 * Valida en el cliente con el mismo esquema que la Server Action; la del
 * servidor es la que decide, porque esta se puede saltar. La ejecución real
 * —crear persona, empleado, asignación y salario— es HU-30: acá el envío ya
 * llama a la Server Action definitiva, que hoy responde que el proceso
 * todavía no está habilitado.
 */
export function HireCandidateForm({
  jobCandidateId,
  departamentos,
  turnos,
}: {
  jobCandidateId: number;
  departamentos: DepartmentOption[];
  turnos: ShiftOption[];
}) {
  const router = useRouter();
  const form = useForm<HireCandidateInput>({
    resolver: zodResolver(hireCandidateSchema) as Resolver<HireCandidateInput>,
    defaultValues: VALORES_INICIALES,
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  async function alEnviar(valores: HireCandidateInput) {
    const resultado = await hireCandidateAction(jobCandidateId, valores);

    if (resultado.success) {
      toast.success("Empleado contratado.");
      router.push(`/candidatos/${jobCandidateId}`);

      return;
    }

    const { error } = resultado;

    if (error.fieldErrors) {
      for (const [campo, mensajes] of Object.entries(error.fieldErrors)) {
        form.setError(campo as Path<HireCandidateInput>, { message: mensajes[0] });
      }
    }

    toast.error(error.message);
  }

  return (
    <form onSubmit={form.handleSubmit(alEnviar)} className="space-y-4">
      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Condiciones de contratación
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField
              id="nationalIdNumber"
              label="Documento"
              error={errors.nationalIdNumber?.message}
            >
              {(props) => (
                <Input autoFocus {...props} {...form.register("nationalIdNumber")} />
              )}
            </FormField>

            <FormField id="jobTitle" label="Cargo" error={errors.jobTitle?.message}>
              {(props) => <Input {...props} {...form.register("jobTitle")} />}
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

            <FormField
              id="hireDate"
              label="Fecha de contratación"
              error={errors.hireDate?.message}
            >
              {(props) => <Input type="date" {...props} {...form.register("hireDate")} />}
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/60 backdrop-blur-xl">
        <CardContent className="space-y-4">
          <h3 className="font-heading text-sm font-semibold tracking-tight">
            Asignación y salario
          </h3>

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
          onClick={() => router.push(`/candidatos/${jobCandidateId}`)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Procesando…" : "Contratar"}
        </Button>
      </div>
    </form>
  );
}
