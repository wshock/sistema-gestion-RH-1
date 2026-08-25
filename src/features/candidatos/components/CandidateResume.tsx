import {
  parsearCurriculum,
  type Educacion,
  type ExperienciaLaboral,
} from "@/features/candidatos/resume";

/**
 * Currículum de un candidato, ya organizado en secciones.
 *
 * `parsearCurriculum` decide si hay algo que estructurar (currículum
 * migrado, con XML reconocible) o si el texto va tal cual (currículum
 * cargado en este sprint, sin etiquetas). Acá solo se pinta el resultado.
 */
export function CandidateResume({ resume }: { resume: string | null }) {
  if (!resume) {
    return (
      <p className="text-muted-foreground text-sm">
        Este candidato no tiene un currículum registrado.
      </p>
    );
  }

  const curriculum = parsearCurriculum(resume);

  if (curriculum.tipo === "texto") {
    return (
      <p className="text-foreground text-sm wrap-break-word whitespace-pre-line">
        {curriculum.contenido}
      </p>
    );
  }

  const { habilidades, experiencia, educacion } = curriculum;

  if (!habilidades && experiencia.length === 0 && educacion.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        El currículum de este candidato no se pudo interpretar.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {habilidades && (
        <Seccion titulo="Habilidades">
          <p className="text-foreground text-sm wrap-break-word whitespace-pre-line">
            {habilidades}
          </p>
        </Seccion>
      )}

      {experiencia.length > 0 && (
        <Seccion titulo="Experiencia laboral">
          <div className="space-y-4">
            {experiencia.map((item, indice) => (
              <ItemExperiencia key={indice} item={item} />
            ))}
          </div>
        </Seccion>
      )}

      {educacion.length > 0 && (
        <Seccion titulo="Educación">
          <div className="space-y-4">
            {educacion.map((item, indice) => (
              <ItemEducacion key={indice} item={item} />
            ))}
          </div>
        </Seccion>
      )}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {titulo}
      </h4>
      {children}
    </section>
  );
}

function Periodo({ inicio, fin }: { inicio: string | null; fin: string | null }) {
  if (!inicio && !fin) {
    return null;
  }

  return (
    <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
      {inicio ?? "?"} – {fin ?? "presente"}
    </span>
  );
}

function ItemExperiencia({ item }: { item: ExperienciaLaboral }) {
  return (
    <div className="border-border space-y-1 border-l-2 pl-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-foreground text-sm font-medium">
          {item.cargo ?? "Cargo no especificado"}
        </p>
        <Periodo inicio={item.inicio} fin={item.fin} />
      </div>

      {(item.empresa || item.ubicacion) && (
        <p className="text-muted-foreground text-sm">
          {[item.empresa, item.ubicacion].filter(Boolean).join(" · ")}
        </p>
      )}

      {item.responsabilidades && (
        <p className="text-foreground text-sm wrap-break-word whitespace-pre-line">
          {item.responsabilidades}
        </p>
      )}
    </div>
  );
}

function ItemEducacion({ item }: { item: Educacion }) {
  return (
    <div className="border-border space-y-1 border-l-2 pl-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <p className="text-foreground text-sm font-medium">
          {item.titulo ?? "Título no especificado"}
        </p>
        <Periodo inicio={item.inicio} fin={item.fin} />
      </div>

      {item.institucion && (
        <p className="text-muted-foreground text-sm">{item.institucion}</p>
      )}
    </div>
  );
}
