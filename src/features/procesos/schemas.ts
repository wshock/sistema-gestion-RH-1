import { z } from "zod";

import { fechaSchema, idSchema } from "@/lib/employmentSchemas";

export const TAMANO_PAGINA = 20;

const fechaOpcional = (campo: string) =>
  z.preprocess(
    (valor) => (valor === "" ? undefined : valor),
    fechaSchema(campo).optional(),
  );

export const transferLogQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).catch(1),
    departmentId: idSchema("el departamento").optional().catch(undefined),
    shiftId: idSchema("el turno").optional().catch(undefined),
    from: fechaOpcional("inicio").catch(undefined),
    to: fechaOpcional("fin").catch(undefined),
  })
  .catch({ page: 1 });

export type TransferLogQuery = z.infer<typeof transferLogQuerySchema>;

export const salaryLogQuerySchema = z
  .object({
    q: z.string().trim().catch(""),
    page: z.coerce.number().int().min(1).catch(1),
    from: fechaOpcional("inicio").catch(undefined),
    to: fechaOpcional("fin").catch(undefined),
  })
  .catch({ q: "", page: 1 });

export type SalaryLogQuery = z.infer<typeof salaryLogQuerySchema>;
