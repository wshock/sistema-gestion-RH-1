import {
  Building2,
  CalendarClock,
  FileBarChart,
  LayoutDashboard,
  UserRoundSearch,
  Users,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Los módulos aún no implementados se muestran, pero no se pueden abrir. */
  disponible: boolean;
};

/**
 * Navegación principal.
 *
 * Refleja el alcance acordado del proyecto y nada más: los módulos pendientes
 * aparecen atenuados en lugar de ocultos —comunican hacia dónde va el sistema
 * sin ofrecer enlaces rotos—, pero listar aquí funciones que quedaron fuera de
 * alcance (nómina, ausencias, permisos) prometería al evaluador algo que nunca
 * va a llegar.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard, disponible: true },
  { href: "/departamentos", label: "Departamentos", icon: Building2, disponible: true },
  { href: "/turnos", label: "Turnos", icon: CalendarClock, disponible: false },
  { href: "/empleados", label: "Empleados", icon: Users, disponible: false },
  { href: "/candidatos", label: "Candidatos", icon: UserRoundSearch, disponible: false },
  { href: "/procesos", label: "Procesos", icon: Workflow, disponible: false },
  { href: "/reportes", label: "Reportes", icon: FileBarChart, disponible: false },
];
