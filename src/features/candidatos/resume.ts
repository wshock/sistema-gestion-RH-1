/**
 * Utilidades para el currículum de un candidato.
 *
 * `JobCandidate.resume` se migró desde un XML de SQL Server como texto plano
 * (ver `migration/docs/migration.md`): pgloader lo forzó a `text` porque
 * varios currículums de los datos de muestra traen XML mal formado, que
 * `xml` habría rechazado al validar. Comprobado contra los 13 candidatos
 * migrados: ninguno trae `</ns:Resume>` de cierre, así que el documento
 * completo nunca es válido.
 *
 * Por eso nada acá usa un parser de XML: todo es expresiones regulares
 * tolerantes sobre el texto. Una etiqueta que no cierra —lo esperable en este
 * dataset— simplemente no aporta ese fragmento, no rompe la vista.
 */

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Contenido de la primera `<ns:etiqueta>...</ns:etiqueta>` que aparezca, sin
 * las etiquetas anidadas que pudiera traer adentro. `null` si la etiqueta no
 * está —también cuando el documento se cortó antes de cerrarla.
 */
function extraerEtiqueta(xml: string, etiqueta: string): string | null {
  const nombre = escaparRegex(etiqueta);
  const patron = new RegExp(`<ns:${nombre}>([\\s\\S]*?)<\\/ns:${nombre}>`);
  const coincidencia = xml.match(patron);

  if (!coincidencia) {
    return null;
  }

  const contenido = decodificarEntidades(coincidencia[1])
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return contenido || null;
}

/**
 * "Apellido, Nombre" a partir de `ns:Name.First`/`ns:Name.Last`. `null` si
 * ninguno de los dos aparece en el currículum.
 */
export function extraerNombreDeCurriculum(resume: string | null): string | null {
  if (!resume) {
    return null;
  }

  const nombre = extraerEtiqueta(resume, "Name.First");
  const apellido = extraerEtiqueta(resume, "Name.Last");

  if (!nombre && !apellido) {
    return null;
  }

  return [apellido, nombre].filter(Boolean).join(", ");
}

/** Etiquetas de sección que se pueden rotular sin necesitar el documento entero. */
const SECCIONES: [RegExp, string][] = [
  [/<ns:Skills>/g, "\n\nHABILIDADES\n"],
  [/<ns:Employment>/g, "\n\nEXPERIENCIA LABORAL\n"],
  [/<ns:Education>/g, "\n\nEDUCACIÓN\n"],
];

/**
 * Convierte el XML migrado en texto legible para mostrar al usuario.
 *
 * No reconstruye la estructura completa del currículum —el documento no
 * siempre la tiene—: rotula las secciones conocidas, convierte cualquier otra
 * etiqueta (abierta, cerrada, o cortada al final por el truncamiento) en un
 * salto de línea, y decodifica entidades. La garantía que sí sostiene es la
 * que pide la historia: ningún `<...>` llega a pantalla.
 */
export function formatearCurriculum(resume: string): string {
  let texto = resume;

  for (const [patron, encabezado] of SECCIONES) {
    texto = texto.replace(patron, encabezado);
  }

  texto = texto
    .replace(/<[^>]*>/g, "\n")
    // Etiqueta cortada al final del texto, sin `>` de cierre.
    .replace(/<[^>]*$/, "");

  texto = decodificarEntidades(texto);

  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
