import { Label } from "@/components/ui/label";

/** Props de accesibilidad que el campo entrega al control. */
export type PropsDeControl = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

/**
 * Etiqueta, control y mensaje de error de un campo de formulario.
 *
 * El trío se repite en cada alta y edición del sistema; tenerlo en un solo
 * sitio evita que el error se pinte distinto en cada módulo.
 *
 * Además del estilo resuelve el cableado accesible, que es fácil de olvidar:
 * el control recibe `id`, `aria-invalid` y un `aria-describedby` que apunta al
 * mensaje, de modo que un lector de pantalla anuncie el error al enfocar el
 * campo y no solo cuando el usuario tropiece con el texto de abajo.
 *
 * El control llega como función y no como elemento porque no siempre es la
 * raíz de lo que se renderiza: a veces va envuelto para acomodar un icono o un
 * botón. Aplicar las props a mano deja explícito cuál es el control de verdad.
 */
export function FormField({
  id,
  label,
  error,
  ayuda,
  children,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  ayuda?: React.ReactNode;
  children: (props: PropsDeControl) => React.ReactNode;
}) {
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>

      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? idError : ayuda ? idAyuda : undefined,
      })}

      {ayuda && !error && (
        <p id={idAyuda} className="text-muted-foreground text-xs">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} role="alert" className="text-destructive text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
