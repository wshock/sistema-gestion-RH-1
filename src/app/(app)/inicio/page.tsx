import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NAV_ITEMS } from "@/config/navigation";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Inicio" };

export default async function InicioPage() {
  const user = await requireSessionUser();
  const modulos = NAV_ITEMS.filter((item) => item.href !== "/inicio");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Hola, {user.name.split(" ")[0]}
        </h2>
        <p className="text-muted-foreground text-sm">
          Este es el panel de PeopleFlow. Elegí un módulo para empezar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {modulos.map(({ href, label, icon: Icon, disponible }) => {
          const contenido = (
            <Card
              className={
                disponible
                  ? "bg-card/60 hover:border-primary/30 h-full backdrop-blur-xl transition-colors"
                  : "bg-card/30 h-full opacity-60 backdrop-blur-xl"
              }
            >
              <CardHeader>
                <div className="flex items-center gap-2.5">
                  <span className="bg-primary/10 grid size-9 shrink-0 place-items-center rounded-lg">
                    <Icon className="size-4" />
                  </span>
                  <CardTitle className="text-base">{label}</CardTitle>
                  {!disponible && (
                    <Badge variant="secondary" className="ml-auto">
                      Pronto
                    </Badge>
                  )}
                  {disponible && (
                    <ArrowRightIcon className="text-muted-foreground ml-auto size-4" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  {disponible
                    ? `Gestioná la información de ${label.toLowerCase()}.`
                    : "Módulo previsto para una entrega posterior."}
                </CardDescription>
              </CardContent>
            </Card>
          );

          return disponible ? (
            <Link
              key={href}
              href={href}
              className="rounded-xl outline-none focus-visible:ring-3"
            >
              {contenido}
            </Link>
          ) : (
            <div key={href}>{contenido}</div>
          );
        })}
      </div>
    </div>
  );
}
