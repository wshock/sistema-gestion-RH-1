import { AppShell } from "@/components/layout/AppShell";
import { requireSessionUser } from "@/lib/session";

/**
 * Layout de la zona autenticada.
 *
 * Aquí se resuelve el usuario para pintarlo en la barra lateral, pero este
 * chequeo no es la protección real: los layouts no se vuelven a renderizar al
 * navegar entre rutas hermanas. Cada página vuelve a exigir sesión por su
 * cuenta, y las Server Actions también.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSessionUser();

  return <AppShell user={user}>{children}</AppShell>;
}
