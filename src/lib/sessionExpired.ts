import type { AppError } from "@/lib/result";

/**
 * Si una acción respondió que no hay sesión, manda al login avisando el motivo
 * y conservando la pantalla actual para volver tras autenticarse.
 * Devuelve `true` cuando redirigió, para que quien llama no muestre otro aviso.
 */
export function redirectIfSessionExpired(error: AppError): boolean {
  if (error.code !== "NO_AUTORIZADO") {
    return false;
  }

  const destino = new URLSearchParams({
    motivo: "sesion-expirada",
    redirectTo: `${window.location.pathname}${window.location.search}`,
  });

  // Navegación completa a propósito: descarta el estado de cliente armado con la sesión anterior.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`/login?${destino.toString()}`);

  return true;
}
