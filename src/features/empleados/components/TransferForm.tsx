"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { transferEmployeeAction } from "@/features/empleados/actions/employee";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crearTransferSchema, type TransferInput } from "@/features/empleados/schemas";
import { formatCalendarDate } from "@/features/empleados/format";
import { redirectIfSessionExpired } from "@/lib/sessionExpired";

type DepartmentOption = { departmentId: number; name: string };
type ShiftOption = { shiftId: number; name: string };

export type CurrentAssignmentReference = {
  departmentId: number;
  departmentName: string;
  shiftId: number;
  shiftName: string;
  startDate: string;
};

function hoyIso(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

/**
 * Formulario de traslado. Valida en el cliente con el mismo Zod que el
 * servicio (HU-37). La asignación vigente es referencia, no se edita. La
 * confirmación explícita evita un traslado accidental que cierra historial.
 */
export function TransferForm({
  businessEntityId,
  hireDate,
  currentAssignment,
  departamentos,
  turnos,
}: {
  businessEntityId: number;
  hireDate: string;
  currentAssignment: CurrentAssignmentReference;
  departamentos: DepartmentOption[];
  turnos: ShiftOption[];
}) {
  const router = useRouter();
  const ficha = `/empleados/${businessEntityId}`;
  const [pendiente, setPendiente] = useState<TransferInput | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const schema = useMemo(
    () =>
      crearTransferSchema({
        hireDate,
        currentStartDate: currentAssignment.startDate,
        currentDepartmentId: currentAssignment.departmentId,
        currentShiftId: currentAssignment.shiftId,
      }),
    [hireDate, currentAssignment],
  );
  const form = useForm<TransferInput>({
    resolver: zodResolver(schema) as Resolver<TransferInput>,
    defaultValues: {
      businessEntityId,
      departmentId: undefined,
      shiftId: undefined,
      startDate: hoyIso(),
    } as unknown as TransferInput,
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  const ocupado = isSubmitting || confirmando;

  function nombreDepartamento(id: number): string {
    return (
      departamentos.find((departamento) => departamento.departmentId === id)?.name ??
      String(id)
    );
  }

  function nombreTurno(id: number): string {
    return turnos.find((turno) => turno.shiftId === id)?.name ?? String(id);
  }

  function alValidar(valores: TransferInput) {
    setPendiente(valores);
  }

  async function confirmarTraslado() {
    if (!pendiente) {
      return;
    }

    setConfirmando(true);

    try {
      const resultado = await transferEmployeeAction(pendiente);

      if (resultado.success) {
        setPendiente(null);
        toast.success("Traslado registrado.");
        router.push(ficha);
        router.refresh();

        return;
      }

      if (redirectIfSessionExpired(resultado.error)) {
        return;
      }

      const { error } = resultado;

      if (error.fieldErrors) {
        for (const [campo, mensajes] of Object.entries(error.fieldErrors)) {
          form.setError(campo as Path<TransferInput>, { message: mensajes[0] });
        }
      }

      setPendiente(null);
      toast.error(error.message);
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(alValidar)} className="space-y-4">
        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-heading text-sm font-semibold tracking-tight">
                Asignación vigente
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Referencia para el destino. Este registro se cierra, no se borra.
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Departamento
                </dt>
                <dd className="text-sm">{currentAssignment.departmentName}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Turno
                </dt>
                <dd className="text-sm">{currentAssignment.shiftName}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Desde
                </dt>
                <dd className="text-sm">
                  {formatCalendarDate(currentAssignment.startDate)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent className="space-y-4">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Nuevo destino
            </h3>

            <input type="hidden" {...form.register("businessEntityId")} />

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
                            <SelectItem
                              key={turno.shiftId}
                              value={String(turno.shiftId)}
                            >
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
                id="startDate"
                label="Fecha de traslado"
                error={errors.startDate?.message}
              >
                {(props) => (
                  <Input type="date" {...props} {...form.register("startDate")} />
                )}
              </FormField>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={ocupado}
            onClick={() => router.push(ficha)}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={ocupado}>
            Continuar
          </Button>
        </div>
      </form>

      <Dialog
        open={pendiente !== null}
        onOpenChange={(abierto) => {
          if (!confirmando && !abierto) {
            setPendiente(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar traslado</DialogTitle>
            <DialogDescription>
              Se cerrará la asignación vigente y se abrirá una nueva. El
              historial anterior se conserva.
            </DialogDescription>
          </DialogHeader>

          {pendiente && (
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Departamento</dt>
                <dd className="font-medium text-right">
                  {nombreDepartamento(pendiente.departmentId)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Turno</dt>
                <dd className="font-medium text-right">
                  {nombreTurno(pendiente.shiftId)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="font-medium">{pendiente.startDate}</dd>
              </div>
            </dl>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={confirmando}
              onClick={() => setPendiente(null)}
            >
              Volver
            </Button>
            <Button
              type="button"
              disabled={confirmando}
              onClick={confirmarTraslado}
            >
              {confirmando && <LoaderCircleIcon className="animate-spin" />}
              {confirmando ? "Registrando…" : "Registrar traslado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
