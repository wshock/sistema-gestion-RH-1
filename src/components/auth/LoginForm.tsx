"use client";

import { useActionState } from "react";
import { AlertCircleIcon, LoaderCircleIcon } from "lucide-react";

import { login, type LoginFormState } from "@/actions/login";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ESTADO_INICIAL: LoginFormState = undefined;

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [estado, accion, enviando] = useActionState(login, ESTADO_INICIAL);

  return (
    <form action={accion} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo electrónico</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          required
          disabled={enviando}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={enviando}
        />
      </div>

      {/* Un único mensaje para cualquier fallo: no revela si el correo existe. */}
      {estado?.error && (
        <p
          role="alert"
          className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
        >
          <AlertCircleIcon className="size-4 shrink-0" />
          {estado.error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={enviando}>
        {enviando && <LoaderCircleIcon className="animate-spin" />}
        {enviando ? "Verificando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}
