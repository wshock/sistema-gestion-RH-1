"use client";

import { useActionState, useState } from "react";
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  LockIcon,
  MailIcon,
} from "lucide-react";
import { z } from "zod";

import { login, type LoginFormState } from "@/actions/login";
import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { credentialsSchema } from "@/schemas/auth.schema";

const ESTADO_INICIAL: LoginFormState = undefined;

type ErroresDeCampo = { email?: string; password?: string };

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [estado, accion, enviando] = useActionState(login, ESTADO_INICIAL);
  const [errores, setErrores] = useState<ErroresDeCampo>({});
  const [verContrasena, setVerContrasena] = useState(false);

  /**
   * Valida antes de dejar salir el envío.
   *
   * Se ejecuta antes que la Server Action: si los datos no pasan, `preventDefault`
   * cancela el envío y no hay viaje al servidor. Usa el mismo esquema que la
   * acción, así que el criterio es idéntico a ambos lados; esta comprobación es
   * comodidad, la que manda sigue siendo la del servidor.
   */
  function validarAntesDeEnviar(evento: React.FormEvent<HTMLFormElement>) {
    const datos = new FormData(evento.currentTarget);
    const resultado = credentialsSchema.safeParse({
      email: datos.get("email"),
      password: datos.get("password"),
    });

    if (resultado.success) {
      setErrores({});

      return;
    }

    evento.preventDefault();

    const { fieldErrors } = z.flattenError(resultado.error);
    setErrores({
      email: fieldErrors.email?.[0],
      password: fieldErrors.password?.[0],
    });
  }

  return (
    // `noValidate` desactiva los avisos del navegador: llegan en su idioma, no
    // en el de la aplicación, y no se pueden peinar como el resto del formulario.
    <form
      action={accion}
      onSubmit={validarAntesDeEnviar}
      noValidate
      className="space-y-4"
    >
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <FormField id="email" label="Correo electrónico" error={errores.email}>
        {(props) => (
          <div className="relative">
            <MailIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              {...props}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="nombre@empresa.com"
              required
              disabled={enviando}
              className="pl-8"
            />
          </div>
        )}
      </FormField>

      <FormField id="password" label="Contraseña" error={errores.password}>
        {(props) => (
          <div className="relative">
            <LockIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              {...props}
              name="password"
              type={verContrasena ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              required
              disabled={enviando}
              className="px-8"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              // Fuera del recorrido de tabulación: es una ayuda visual y, en
              // medio del formulario, entorpecería llegar al botón de entrar.
              tabIndex={-1}
              aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
              onClick={() => setVerContrasena((visible) => !visible)}
              className="absolute top-1/2 right-1 -translate-y-1/2"
            >
              {verContrasena ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
        )}
      </FormField>

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
