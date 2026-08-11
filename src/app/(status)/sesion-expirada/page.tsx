import type { Metadata } from "next";

import { StatusPage } from "@/components/shared/StatusPage";

export const metadata: Metadata = { title: "Sesión expirada" };

export default function SesionExpiradaPage() {
  return (
    <StatusPage
      codigo="440"
      titulo="Tu sesión expiró"
      descripcion="Por seguridad cerramos las sesiones tras un período de inactividad. Iniciá sesión de nuevo para continuar."
      accion={{ href: "/login", label: "Iniciar sesión" }}
    />
  );
}
