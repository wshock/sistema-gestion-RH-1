import { cache } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Lee la sesión una sola vez por render.
 *
 * `cache` memoiza el resultado durante el pase de renderizado de React, así
 * que aunque varios componentes o consultas la pidan, se verifica una vez.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  const user = session?.user;

  if (!user?.id || !user.email) {
    return null;
  }

  return { id: user.id, name: user.name ?? user.email, email: user.email };
});

/**
 * Exige sesión activa y, si no la hay, manda al login.
 *
 * Pensada para páginas y Server Components. La comprobación de `proxy.ts` es
 * solo optimista: esta es la que realmente protege, porque corre pegada al
 * acceso a datos y no depende de que el layout se vuelva a renderizar.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
