/**
 * Utilidades para el currículum de un candidato.
 *
 * `JobCandidate.resume` tiene dos orígenes distintos con el mismo campo de
 * texto:
 *
 * 1. **Migrado desde AdventureWorks**: un XML de SQL Server que pgloader
 *    forzó a `text` (ver `migration/docs/migration.md`) porque varios
 *    currículums de los datos de muestra vienen mal formados —`xml` los
 *    habría rechazado al validar—. Comprobado contra los 13 candidatos
 *    migrados: ninguno trae `</ns:Resume>` de cierre, así que el documento
 *    completo nunca es válido.
 * 2. **Cargado desde el formulario de este sprint**: texto plano, sin ninguna
 *    etiqueta, que el administrador escribe directamente.
 *
 * Por eso nada acá usa un parser de XML: todo es expresiones regulares
 * tolerantes sobre el texto, y todo lo que no encuentra una etiqueta conocida
 * cae a mostrar el texto tal cual. Un documento migrado sin cerrar no rompe
 * la vista, y un currículum nuevo en texto plano no pierde ni una línea.
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

/** Colapsa saltos de línea repetidos y recorta cada línea, sin tocar el resto. */
function normalizarLineas(texto: string): string {
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Contenido crudo de la primera `<ns:etiqueta>...</ns:etiqueta>` que
 * aparezca, sin decodificar ni limpiar. `null` si la etiqueta no está
 * —también cuando el documento se cortó antes de cerrarla—.
 */
function contenidoDeEtiqueta(xml: string, etiqueta: string): string | null {
  const nombre = escaparRegex(etiqueta);
  const patron = new RegExp(`<ns:${nombre}>([\\s\\S]*?)<\\/ns:${nombre}>`);
  const coincidencia = xml.match(patron);

  return coincidencia ? coincidencia[1] : null;
}

/** Campo de una sola línea (nombre, fecha, organización): sin etiquetas anidadas ni saltos de línea internos. */
function extraerCampoCorto(xml: string, etiqueta: string): string | null {
  const contenido = contenidoDeEtiqueta(xml, etiqueta);

  if (contenido === null) {
    return null;
  }

  const limpio = decodificarEntidades(contenido)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return limpio || null;
}

/** Campo de texto libre (habilidades, responsabilidades): conserva los saltos de línea del original. */
function extraerCampoLargo(xml: string, etiqueta: string): string | null {
  const contenido = contenidoDeEtiqueta(xml, etiqueta);

  if (contenido === null) {
    return null;
  }

  const limpio = normalizarLineas(
    decodificarEntidades(contenido).replace(/<[^>]*>/g, "\n"),
  );

  return limpio || null;
}

/** "AAAA-MM-DDZ" (como lo trae AdventureWorks) → "AAAA-MM-DD". Deja cualquier otra cosa como está. */
function limpiarFecha(fecha: string | null): string | null {
  return fecha ? fecha.replace(/Z$/, "").trim() || null : null;
}

export type ExperienciaLaboral = {
  cargo: string | null;
  empresa: string | null;
  inicio: string | null;
  fin: string | null;
  ubicacion: string | null;
  responsabilidades: string | null;
};

export type Educacion = {
  titulo: string | null;
  institucion: string | null;
  inicio: string | null;
  fin: string | null;
};

export type CurriculumParseado =
  | {
      tipo: "estructurado";
      habilidades: string | null;
      experiencia: ExperienciaLaboral[];
      educacion: Educacion[];
    }
  | { tipo: "texto"; contenido: string };

const ETIQUETAS_DE_BLOQUE = ["Employment", "Education"] as const;

/**
 * Divide el XML en los bloques repetidos que trae (`ns:Employment`,
 * `ns:Education`), delimitados por el siguiente bloque o por el final del
 * texto —nunca por su propio cierre—. Así un bloque cortado a la mitad por el
 * truncamiento igual entrega los campos que sí llegaron a tiempo, en lugar de
 * perderse entero por no encontrar `</ns:Employment>`.
 */
function extraerBloques(
  xml: string,
): { tipo: "Employment" | "Education"; contenido: string }[] {
  const patron = new RegExp(`<ns:(${ETIQUETAS_DE_BLOQUE.join("|")})>`, "g");
  const posiciones: { tipo: "Employment" | "Education"; inicio: number }[] = [];

  for (const coincidencia of xml.matchAll(patron)) {
    posiciones.push({
      tipo: coincidencia[1] as "Employment" | "Education",
      inicio: coincidencia.index,
    });
  }

  return posiciones.map(({ tipo, inicio }, indice) => ({
    tipo,
    contenido: xml.slice(inicio, posiciones[indice + 1]?.inicio ?? xml.length),
  }));
}

function ubicacionDe(bloque: string): string | null {
  const partes = [
    extraerCampoCorto(bloque, "Loc.City"),
    extraerCampoCorto(bloque, "Loc.State"),
    extraerCampoCorto(bloque, "Loc.CountryRegion"),
  ].filter((parte): parte is string => Boolean(parte));

  return partes.length > 0 ? partes.join(", ") : null;
}

/**
 * Interpreta el currículum para mostrarlo de forma organizada.
 *
 * Si encuentra al menos una etiqueta conocida (`ns:Skills`, `ns:Employment`,
 * `ns:Education`), lo trata como el XML migrado y devuelve sus secciones ya
 * separadas. Si no encuentra ninguna —el caso de un currículum cargado como
 * texto plano desde este sprint—, lo devuelve tal cual, solo con los saltos
 * de línea normalizados: no hay nada que estructurar.
 */
export function parsearCurriculum(resume: string): CurriculumParseado {
  const habilidades = extraerCampoLargo(resume, "Skills");

  const bloques = extraerBloques(resume);

  const experiencia: ExperienciaLaboral[] = bloques
    .filter((bloque) => bloque.tipo === "Employment")
    .map((bloque) => ({
      cargo: extraerCampoCorto(bloque.contenido, "Emp.JobTitle"),
      empresa: extraerCampoCorto(bloque.contenido, "Emp.OrgName"),
      inicio: limpiarFecha(extraerCampoCorto(bloque.contenido, "Emp.StartDate")),
      fin: limpiarFecha(extraerCampoCorto(bloque.contenido, "Emp.EndDate")),
      ubicacion: ubicacionDe(bloque.contenido),
      responsabilidades: extraerCampoLargo(bloque.contenido, "Emp.Responsibility"),
    }))
    // Un bloque que abrió justo antes del corte no aporta ningún campo: no
    // tiene sentido mostrar una tarjeta vacía.
    .filter((item) => item.cargo || item.empresa || item.responsabilidades);

  const educacion: Educacion[] = bloques
    .filter((bloque) => bloque.tipo === "Education")
    .map((bloque) => ({
      titulo: extraerCampoCorto(bloque.contenido, "Edu.Degree"),
      institucion: extraerCampoCorto(bloque.contenido, "Edu.School"),
      inicio: limpiarFecha(extraerCampoCorto(bloque.contenido, "Edu.StartDate")),
      fin: limpiarFecha(extraerCampoCorto(bloque.contenido, "Edu.EndDate")),
    }))
    .filter((item) => item.titulo || item.institucion);

  if (!habilidades && experiencia.length === 0 && educacion.length === 0) {
    return { tipo: "texto", contenido: formatearCurriculumComoTexto(resume) };
  }

  return { tipo: "estructurado", habilidades, experiencia, educacion };
}

/**
 * Reduce el currículum a texto plano legible, sin ninguna etiqueta.
 *
 * Se usa para precargar el campo de edición —nunca se le muestra al
 * administrador el XML crudo, ni siquiera del que se migró— y como respaldo
 * de `parsearCurriculum` cuando no hay ninguna sección reconocible. Con un
 * currículum nuevo, en texto plano, el resultado es prácticamente el mismo
 * texto de entrada: no hay etiquetas que quitar.
 */
export function formatearCurriculumComoTexto(resume: string): string {
  const sinEtiquetas = decodificarEntidades(
    resume
      .replace(/<[^>]*>/g, "\n")
      // Etiqueta cortada al final del texto, sin `>` de cierre.
      .replace(/<[^>]*$/, ""),
  );

  return normalizarLineas(sinEtiquetas);
}
