"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOutIcon, MenuIcon, XIcon } from "lucide-react";

import { logout } from "@/actions/logout";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/config/navigation";
import type { SessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";

/**
 * Armazón de la aplicación autenticada.
 *
 * Es cliente únicamente por el cajón lateral en móvil y por resaltar la ruta
 * activa. El contenido llega como `children` ya renderizado en el servidor,
 * así que las páginas siguen siendo Server Components.
 */
export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [cajonAbierto, setCajonAbierto] = useState(false);
  const pathname = usePathname();

  const tituloActual =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.label ?? "PeopleFlow";

  return (
    <div className="bg-background relative flex min-h-dvh">
      {/* Halo de color que da profundidad al fondo sin recurrir a imágenes. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60rem_40rem_at_15%_-10%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
      />

      {cajonAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setCajonAbierto(false)}
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={cn(
          "border-border/60 bg-card/60 fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r backdrop-blur-xl transition-transform duration-200 lg:translate-x-0",
          cajonAbierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <Link
            href="/inicio"
            className="font-heading text-base font-semibold tracking-tight"
          >
            People<span className="text-muted-foreground">Flow</span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cerrar menú"
            className="lg:hidden"
            onClick={() => setCajonAbierto(false)}
          >
            <XIcon />
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon, disponible }) => {
            const activo = pathname === href || pathname.startsWith(`${href}/`);

            if (!disponible) {
              return (
                <span
                  key={href}
                  aria-disabled
                  title="Módulo aún no disponible"
                  className="text-muted-foreground/50 flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm"
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </span>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                onClick={() => setCajonAbierto(false)}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  activo
                    ? "bg-primary/10 text-foreground ring-primary/15 font-medium ring-1"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-border/60 space-y-2 border-t p-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-primary/10 text-foreground grid size-8 shrink-0 place-items-center rounded-full text-xs font-medium">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="text-muted-foreground truncate text-xs">{user.email}</p>
            </div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              <LogOutIcon />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="border-border/60 bg-background/70 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-xl">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Abrir menú"
            className="lg:hidden"
            onClick={() => setCajonAbierto(true)}
          >
            <MenuIcon />
          </Button>
          <h1 className="font-heading truncate text-sm font-medium">{tituloActual}</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        <main className="relative min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
