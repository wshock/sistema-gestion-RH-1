-- =====================================================================
-- add_jobcandidate_name_columns.sql
--
-- Agrega nombre y apellido como campos propios del candidato, en lugar de
-- depender de que su currículum los traiga como XML libre. Antes de esto,
-- el nombre se extraía con expresiones regulares sobre `resume`: funcionaba
-- para los 13 candidatos migrados (todos con `ns:Name.First`/`ns:Name.Last`
-- en su currículum), pero un candidato cargado con currículum en texto
-- plano —sin ninguna etiqueta— no tenía de dónde sacarlo, y la contratación
-- (HU-30) lo rechazaba sin una manera clara de corregirlo.
--
-- Se ejecuta manualmente porque `humanresources.jobcandidate` es una tabla
-- externa a Prisma Migrate (ver `tables.external` en `prisma.config.ts`):
-- la carga pgloader, no las migraciones de Prisma. Nullable, no `NOT NULL`:
-- igual que el resto de lo migrado desde AdventureWorks, la barrera real es
-- la validación de Zod (`candidateInputSchema`), no una restricción de la
-- base — así un candidato migrado antes de este cambio no rompe.
--
-- Idempotente: se puede ejecutar varias veces sin error.
-- =====================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'humanresources'
          AND table_name = 'jobcandidate'
          AND column_name = 'firstname'
    ) THEN
        ALTER TABLE humanresources.jobcandidate ADD COLUMN firstname text;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'humanresources'
          AND table_name = 'jobcandidate'
          AND column_name = 'lastname'
    ) THEN
        ALTER TABLE humanresources.jobcandidate ADD COLUMN lastname text;
    END IF;
END $$;
