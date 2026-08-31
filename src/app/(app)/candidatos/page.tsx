import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { CandidateFormDialog } from "@/features/candidatos/components/CandidateFormDialog";
import { CandidateStatusFilter } from "@/features/candidatos/components/CandidateStatusFilter";
import { DeleteCandidateDialog } from "@/features/candidatos/components/DeleteCandidateDialog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Pagination } from "@/components/shared/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { CandidateListItem } from "@/features/candidatos/types";
import { requireSessionUser } from "@/lib/session";
import { candidateQuerySchema } from "@/features/candidatos/schemas";
import { getCandidatePage } from "@/features/candidatos/services/read.service";

export const metadata: Metadata = { title: "Candidatos" };

export default async function CandidatosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; estado?: string }>;
}) {
  // El proxy ya filtró, pero esta es la comprobación que de verdad protege:
  // corre en el servidor, pegada a la lectura de datos.
  await requireSessionUser();

  const params = await searchParams;
  const query = candidateQuerySchema.parse(params);
  const resultado = await getCandidatePage(query);

  // El fallo se pinta dentro de la propia tabla, no en lugar de la página: la
  // cabecera y el filtro siguen ahí para poder reintentar.
  const { items, total, page, pageCount } = resultado.success
    ? resultado.data
    : { items: [], total: 0, page: 1, pageCount: 1 };

  const columnas: DataTableColumn<CandidateListItem>[] = [
    {
      id: "nombre",
      header: "Candidato",
      cell: (candidato) => (
        <Link
          href={`/candidatos/${candidato.jobCandidateId}`}
          className="font-medium hover:underline"
        >
          {candidato.name ?? `Candidato #${candidato.jobCandidateId}`}
        </Link>
      ),
    },
    {
      id: "estado",
      header: "Estado",
      cell: (candidato) => (
        <Badge variant={candidato.status === "contratado" ? "secondary" : "outline"}>
          {candidato.status === "contratado" ? "Contratado" : "Pendiente"}
        </Badge>
      ),
    },
    {
      id: "acciones",
      header: "Acciones",
      className: "w-0 text-right",
      cell: (candidato) => (
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/candidatos/${candidato.jobCandidateId}`}
            className="text-muted-foreground hover:text-foreground text-sm whitespace-nowrap"
          >
            Ver currículum
          </Link>

          {/* Un candidato contratado no inicia el proceso de nuevo, ni se
              edita ni se elimina: rompería la trazabilidad de su
              contratación. */}
          {candidato.status === "pendiente" && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Contratar a ${candidato.name ?? `candidato #${candidato.jobCandidateId}`}`}
                render={
                  <Link href={`/candidatos/${candidato.jobCandidateId}/contratar`} />
                }
              >
                <BriefcaseIcon />
              </Button>

              <DeleteCandidateDialog
                jobCandidateId={candidato.jobCandidateId}
                nombre={candidato.name ?? `Candidato #${candidato.jobCandidateId}`}
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Eliminar ${candidato.name ?? `candidato #${candidato.jobCandidateId}`}`}
                  >
                    <Trash2Icon />
                  </Button>
                }
              />
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-semibold tracking-tight">
            Candidatos
          </h2>
          <p className="text-muted-foreground text-sm">
            Aspirantes registrados y su currículum, migrados desde AdventureWorks.
          </p>
        </div>

        <CandidateFormDialog
          trigger={
            <Button>
              <PlusIcon />
              Nuevo candidato
            </Button>
          }
        />
      </div>

      <CandidateStatusFilter estado={query.estado} />

      <Card className="bg-card/60 overflow-hidden backdrop-blur-xl">
        <CardContent className="p-0">
          <DataTable
            columnas={columnas}
            filas={items}
            idDeFila={(candidato) => candidato.jobCandidateId}
            error={resultado.success ? undefined : resultado.error.message}
            vacio={
              query.estado === "todos"
                ? "Todavía no hay candidatos registrados."
                : "Ningún candidato coincide con el filtro aplicado."
            }
          />
        </CardContent>
      </Card>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        basePath="/candidatos"
        params={{ estado: query.estado !== "todos" ? query.estado : undefined }}
        singular="candidato"
        plural="candidatos"
      />
    </div>
  );
}
