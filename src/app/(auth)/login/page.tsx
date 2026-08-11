import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="bg-background relative grid min-h-dvh place-items-center p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45rem_30rem_at_50%_-10%,color-mix(in_oklch,var(--primary),transparent_85%),transparent)]"
      />

      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="bg-card/70 relative w-full max-w-sm backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            People<span className="text-muted-foreground">Flow</span>
          </CardTitle>
          <CardDescription>
            Ingresá tus credenciales para acceder al sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={redirectTo ?? "/inicio"} />
        </CardContent>
      </Card>
    </div>
  );
}
