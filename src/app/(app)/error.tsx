"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircleIcon, RotateCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Fallo no previsto al renderizar una pantalla: mensaje de negocio, nunca el detalle técnico. */
export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Card className="bg-card/60 mx-auto max-w-lg backdrop-blur-xl">
      <CardContent className="space-y-4 py-2 text-center">
        <AlertCircleIcon className="text-destructive mx-auto size-8" />
        <div className="space-y-1">
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            No pudimos cargar esta pantalla
          </h2>
          <p className="text-muted-foreground text-sm">
            Ocurrió un problema al obtener la información. Intentá de nuevo en unos
            momentos; si persiste, volvé al inicio.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>
            <RotateCwIcon />
            Reintentar
          </Button>
          <Button variant="outline" render={<Link href="/inicio" />}>
            Ir al inicio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
