import type { Metadata } from "next";

import { StatusPage } from "@/components/shared/StatusPage";

export const metadata: Metadata = { title: "Acceso denegado" };

export default function ProhibidoPage() {
  return (
    <StatusPage
      codigo="403"
      titulo="Acceso denegado"
      descripcion="Tu cuenta no tiene permisos para acceder a esta sección. Consultá con un administrador si creés que es un error."
      accion={{ href: "/inicio", label: "Volver al inicio" }}
    />
  );
}
