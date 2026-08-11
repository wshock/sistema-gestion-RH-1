import type { Metadata } from "next";

import { StatusPage } from "@/components/shared/StatusPage";

export const metadata: Metadata = { title: "No autorizado" };

export default function NoAutorizadoPage() {
  return (
    <StatusPage
      codigo="401"
      titulo="No autorizado"
      descripcion="Necesitás iniciar sesión para ver esta página."
      accion={{ href: "/login", label: "Ir al inicio de sesión" }}
    />
  );
}
