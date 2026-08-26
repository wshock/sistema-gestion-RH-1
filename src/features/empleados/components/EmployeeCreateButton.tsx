import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Punto de montaje: acción de alta en la cabecera del listado.
 *
 * Navega a `/empleados/nuevo`. El formulario vive en esa pantalla porque
 * pide muchos campos (persona, laboral, asignación y salario iniciales);
 * un diálogo no alcanzaría en móvil.
 *
 * Ver `docs/acuerdo-empleados.md`.
 */
export function EmployeeCreateButton() {
  return (
    <Button render={<Link href="/empleados/nuevo" />}>
      <PlusIcon />
      Nuevo empleado
    </Button>
  );
}
