import {
  Building2,
  CalendarClock,
  ClipboardList,
  FileBarChart,
  LayoutDashboard,
  Settings,
  UserRoundSearch,
  Users,
  Wallet,
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
 * Navegación principal. Los módulos pendientes aparecen atenuados en lugar de
 * ocultos: comunican el alcance del sistema sin ofrecer enlaces rotos.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard, disponible: true },
  { href: "/departamentos", label: "Departamentos", icon: Building2, disponible: true },
  { href: "/empleados", label: "Empleados", icon: Users, disponible: false },
  { href: "/turnos", label: "Turnos", icon: CalendarClock, disponible: false },
  { href: "/nomina", label: "Nómina", icon: Wallet, disponible: false },
  { href: "/candidatos", label: "Candidatos", icon: UserRoundSearch, disponible: false },
  { href: "/ausencias", label: "Ausencias", icon: ClipboardList, disponible: false },
  { href: "/reportes", label: "Reportes", icon: FileBarChart, disponible: false },
  { href: "/ajustes", label: "Ajustes", icon: Settings, disponible: false },
];
