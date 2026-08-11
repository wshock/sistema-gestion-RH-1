import { NextResponse, type NextRequest } from "next/server";

/**
 * Chequeo optimista de sesión previo a cada navegación.
 *
 * Solo mira si existe la cookie, sin verificar la firma ni tocar la base: el
 * proxy corre en cada request (incluidas las de prefetch) y encarecerlo
 * penaliza toda la aplicación. La verificación real vive en `lib/session.ts`,
 * junto al acceso a datos.
 */

/** Solo para quien no tiene sesión: si ya la tiene, no pinta nada volver aquí. */
const RUTAS_DE_ACCESO = ["/login"];

/** Accesibles siempre, con sesión o sin ella. Un 403 se le muestra a alguien
 *  que sí está autenticado, así que no puede exigir ausencia de sesión. */
const RUTAS_DE_ESTADO = ["/no-autorizado", "/prohibido", "/sesion-expirada"];

// Auth.js firma la cookie con prefijo `__Secure-` cuando la conexión es HTTPS.
const COOKIES_DE_SESION = ["authjs.session-token", "__Secure-authjs.session-token"];

function coincide(pathname: string, rutas: string[]): boolean {
  return rutas.some((ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`));
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const tieneSesion = COOKIES_DE_SESION.some((nombre) => request.cookies.has(nombre));

  if (coincide(pathname, RUTAS_DE_ESTADO)) {
    return NextResponse.next();
  }

  const esRutaDeAcceso = coincide(pathname, RUTAS_DE_ACCESO);

  if (!tieneSesion && !esRutaDeAcceso) {
    const destino = new URL("/login", request.nextUrl);
    // Preserva a dónde iba el usuario para devolverlo ahí tras autenticarse.
    destino.searchParams.set("redirectTo", `${pathname}${search}`);

    return NextResponse.redirect(destino);
  }

  if (tieneSesion && esRutaDeAcceso) {
    return NextResponse.redirect(new URL("/inicio", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
