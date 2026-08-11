"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

/**
 * Alterna entre claro y oscuro.
 *
 * Qué icono se ve lo decide CSS a través de la clase `dark` que next-themes
 * escribe en el `<html>`, no el estado de React. Así se evita el desajuste de
 * hidratación sin recurrir a la típica bandera `mounted`, que obligaría a
 * llamar a setState dentro de un efecto y provocaría un render en cascada.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar entre modo claro y oscuro"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  );
}
