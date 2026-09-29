"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, type Path, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { registerSalaryChangeAction } from "@/features/empleados/actions/employee";
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
import {
  crearSalaryChangeSchema,
  type SalaryChangeInput,
} from "@/features/empleados/schemas";
import { formatPayRate, PAY_FREQUENCY_LABEL } from "@/features/empleados/format";
import type { PayFrequency } from "@/features/empleados/types";
import { redirectIfSessionExpired } from "@/lib/sessionExpired";

export type CurrentPayReference = {
  rate: number;
  payFrequency: PayFrequency;
  rateChangeDateLabel: string;
};

function hoyIso(): string {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

/**
 * Formulario de cambio salarial.
 *
 * Valida en el cliente con el mismo Zod que el servicio (HU-35). El salario
 * vigente es solo referencia: el envío inserta un registro nuevo. La
 * confirmación explícita evita registrar un cambio por un clic accidental.
 */
export function SalaryChangeForm({
  businessEntityId,
  hireDate,
  lastPayDate,
  currentPay,
}: {
  businessEntityId: number;
  hireDate: string;
  lastPayDate: string | null;
  currentPay: CurrentPayReference | null;
}) {
  const router = useRouter();
  const ficha = `/empleados/${businessEntityId}`;
  const [pendiente, setPendiente] = useState<SalaryChangeInput | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const schema = useMemo(
    () => crearSalaryChangeSchema({ hireDate, lastPayDate }),
    [hireDate, lastPayDate],
  );
  const form = useForm<SalaryChangeInput>({
    resolver: zodResolver(schema) as Resolver<SalaryChangeInput>,
    defaultValues: {
      businessEntityId,
      rate: undefined,
      payFrequency: undefined,
      rateChangeDate: hoyIso(),
    } as unknown as SalaryChangeInput,
  });

  const {
    formState: { errors, isSubmitting },
  } = form;

  const ocupado = isSubmitting || confirmando;

  function alValidar(valores: SalaryChangeInput) {
    setPendiente(valores);
  }

  async function confirmarCambio() {
    if (!pendiente) {
      return;
    }

    setConfirmando(true);

    try {
      const resultado = await registerSalaryChangeAction(pendiente);

      if (resultado.success) {
        setPendiente(null);
        toast.success("Cambio salarial registrado.");
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
          form.setError(campo as Path<SalaryChangeInput>, {
            message: mensajes[0],
          });
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
                Salario vigente
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                Referencia para el nuevo valor. Este registro no se modifica.
              </p>
            </div>

            {currentPay ? (
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Tarifa
                  </dt>
                  <dd className="text-sm">
                    {formatPayRate(currentPay.rate)}
                    <span className="text-muted-foreground"> / hora</span>
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Frecuencia
                  </dt>
                  <dd className="text-sm">
                    {PAY_FREQUENCY_LABEL[currentPay.payFrequency]}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Desde
                  </dt>
                  <dd className="text-sm">{currentPay.rateChangeDateLabel}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-muted-foreground text-sm">
                Este empleado todavía no tiene historial salarial. Este será el
                primer registro.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-xl">
          <CardContent className="space-y-4">
            <h3 className="font-heading text-sm font-semibold tracking-tight">
              Nuevo salario
            </h3>

            <input type="hidden" {...form.register("businessEntityId")} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    autoFocus
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

              <FormField
                id="rateChangeDate"
                label="Fecha de cambio"
                error={errors.rateChangeDate?.message}
              >
                {(props) => (
                  <Input
                    type="date"
                    {...props}
                    {...form.register("rateChangeDate")}
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
            <DialogTitle>Confirmar cambio salarial</DialogTitle>
            <DialogDescription>
              Se insertará un registro nuevo en el historial. El salario anterior
              no se modifica.
            </DialogDescription>
          </DialogHeader>

          {pendiente && (
            <dl className="grid gap-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Tarifa</dt>
                <dd className="font-medium tabular-nums">
                  {formatPayRate(pendiente.rate)} / hora
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Frecuencia</dt>
                <dd className="font-medium">
                  {PAY_FREQUENCY_LABEL[pendiente.payFrequency]}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Fecha</dt>
                <dd className="font-medium">{pendiente.rateChangeDate}</dd>
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
            <Button type="button" disabled={confirmando} onClick={confirmarCambio}>
              {confirmando && <LoaderCircleIcon className="animate-spin" />}
              {confirmando ? "Registrando…" : "Registrar cambio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
