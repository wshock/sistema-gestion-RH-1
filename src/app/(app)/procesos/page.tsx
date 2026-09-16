import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, BanknoteIcon, ArrowLeftRightIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSessionUser } from "@/lib/session";

export const metadata: Metadata = { title: "Procesos" };

export default async function ProcesosPage() {
  await requireSessionUser();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Procesos</h2>
        <p className="text-muted-foreground text-sm">
          Consultá las bitácoras de movimientos laborales.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/procesos/traslados" className="group">
          <Card className="group-hover:border-primary h-full transition-colors">
            <CardHeader>
              <ArrowLeftRightIcon className="text-primary size-6" />
              <CardTitle>Traslados de departamento</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-center justify-between text-sm">
              Asignaciones históricas y vigentes
              <ArrowRightIcon className="size-4" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/procesos/salarios" className="group">
          <Card className="group-hover:border-primary h-full transition-colors">
            <CardHeader>
              <BanknoteIcon className="text-muted-foreground size-6" />
              <CardTitle>Cambios salariales</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex items-center justify-between text-sm">
              Historial de tarifas y frecuencias
              <ArrowRightIcon className="size-4" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
