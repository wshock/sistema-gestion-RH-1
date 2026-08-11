/**
 * Resultado estructurado de las operaciones que cruzan de la capa de
 * aplicación a la presentación.
 *
 * La UI nunca debe recibir una excepción de Prisma ni un mensaje de la base:
 * filtrarlo todo por este tipo obliga a traducir cada fallo a un código de
 * negocio conocido o, si es inesperado, a un mensaje genérico seguro.
 *
 * Son objetos planos a propósito: el valor de retorno de una Server Action
 * cruza la frontera de serialización de RSC y una instancia de `Error` no
 * sobrevive el viaje.
 */

export type AppErrorCode =
  /** La entrada no pasó la validación de Zod. */
  | "VALIDACION"
  /** El registro solicitado no existe. */
  | "NO_ENCONTRADO"
  /** Choca con una restricción de unicidad. */
  | "DUPLICADO"
  /** La operación es válida pero el estado del dominio no la permite. */
  | "CONFLICTO"
  /** No hay sesión activa o no alcanza para esta operación. */
  | "NO_AUTORIZADO"
  /** Cualquier fallo no previsto. Nunca expone el detalle original. */
  | "INESPERADO";

export type AppError = {
  code: AppErrorCode;
  message: string;
  /** Errores por campo, para pintarlos junto al input que los originó. */
  fieldErrors?: Record<string, string[]>;
};

export type Result<T> = { success: true; data: T } | { success: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function fail(
  code: AppErrorCode,
  message: string,
  fieldErrors?: Record<string, string[]>,
): Result<never> {
  return {
    success: false,
    error: fieldErrors ? { code, message, fieldErrors } : { code, message },
  };
}

const MENSAJE_GENERICO =
  "Ocurrió un error inesperado. Intentá de nuevo en unos momentos.";

/**
 * Traduce una excepción no prevista a un error seguro para el usuario.
 *
 * El detalle real se registra en el servidor —donde sirve para depurar— y
 * jamás viaja al cliente, que solo ve un mensaje genérico.
 */
export function unexpected(context: string, error: unknown): Result<never> {
  console.error(`[${context}]`, error);
  return fail("INESPERADO", MENSAJE_GENERICO);
}
