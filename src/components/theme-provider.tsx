"use client";

import type * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Envoltorio de `next-themes`. Es cliente por necesidad: lee la preferencia
 * del sistema y escribe la clase `dark` en el `<html>` antes de pintar, que es
 * lo que evita el parpadeo blanco al cargar en modo oscuro.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
