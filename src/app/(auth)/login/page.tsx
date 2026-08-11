import type { Metadata } from "next";
import { Building2, ShieldCheckIcon, UsersIcon, Workflow } from "lucide-react";

import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Iniciar sesión" };

/** Lo que el sistema hace, para que la pantalla de entrada lo comunique. */
const CAPACIDADES = [
  {
    icon: Building2,
    titulo: "Catálogos al día",
    detalle: "Departamentos y turnos administrados desde la aplicación.",
  },
  {
    icon: UsersIcon,
    titulo: "Legajo completo",
    detalle: "Datos, asignación vigente y salario de cada empleado.",
  },
  {
    icon: Workflow,
    titulo: "Procesos con historial",
    detalle: "Contratación, cambios salariales y traslados sin perder trazabilidad.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="bg-background relative min-h-dvh lg:grid lg:grid-cols-2">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Panel de marca. Se oculta en móvil: ahí el espacio es para el
          formulario, que es a lo que se viene. */}
      <aside className="border-border/60 bg-card/40 relative hidden flex-col justify-between overflow-hidden border-r p-10 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_30rem_at_20%_0%,color-mix(in_oklch,var(--primary),transparent_80%),transparent)]"
        />

        <p className="font-heading relative text-lg font-semibold tracking-tight">
          People<span className="text-muted-foreground">Flow</span>
        </p>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance">
              La gestión de personal de AdventureWorks, en un solo lugar.
            </h2>
            <p className="text-muted-foreground max-w-md text-sm">
              Sistema interno de Recursos Humanos. El acceso está restringido al personal
              autorizado.
            </p>
          </div>

          <ul className="space-y-4">
            {CAPACIDADES.map(({ icon: Icon, titulo, detalle }) => (
              <li key={titulo} className="flex gap-3">
                <span className="bg-primary/10 mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg">
                  <Icon className="size-4" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{titulo}</p>
                  <p className="text-muted-foreground max-w-sm text-sm">{detalle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted-foreground relative text-xs">
          Proyecto académico · Datos reales de AdventureWorks
        </p>
      </aside>

      <main className="relative grid min-h-dvh place-items-center p-4 lg:min-h-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(45rem_30rem_at_50%_-10%,color-mix(in_oklch,var(--primary),transparent_85%),transparent)] lg:hidden"
        />

        <div className="relative w-full max-w-sm space-y-6">
          {/* En móvil no hay panel de marca, así que el nombre va acá. */}
          <p className="font-heading text-center text-lg font-semibold tracking-tight lg:hidden">
            People<span className="text-muted-foreground">Flow</span>
          </p>

          <Card className="bg-card/70 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="font-heading text-xl">Iniciar sesión</CardTitle>
              <CardDescription>
                Ingresá tus credenciales para acceder al sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm redirectTo={redirectTo ?? "/inicio"} />
            </CardContent>
          </Card>

          <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
            <ShieldCheckIcon className="size-3.5 shrink-0" />
            Tu sesión viaja cifrada y expira automáticamente.
          </p>
        </div>
      </main>
    </div>
  );
}
