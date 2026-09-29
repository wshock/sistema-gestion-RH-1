import type { Metadata } from "next";

import { StatusPage } from "@/components/shared/StatusPage";

export const metadata: Metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <StatusPage
      codigo="404"
      titulo="No encontramos lo que buscás"
      descripcion="La página o el registro no existe, o fue eliminado. Revisá el enlace o volvé al inicio."
      accion={{ href: "/inicio", label: "Ir al inicio" }}
    />
  );
}
