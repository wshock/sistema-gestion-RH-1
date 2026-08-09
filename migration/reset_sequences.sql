-- =====================================================================
-- reset_sequences.sql
--
-- Se ejecuta DESPUÉS de la carga de datos con pgloader y de aplicar las
-- constraints (post_migration_constraints.sql).
--
-- pgloader (opción `reset sequences`) debería dejar las secuencias de las
-- columnas autoincrementales apuntando al máximo id migrado, pero esto no
-- es completamente confiable frente a los `CAST` de tipos usados en esta
-- migración. Si la secuencia queda en su valor inicial, el primer INSERT
-- real sobre esa tabla falla con "duplicate key value violates unique
-- constraint".
--
-- Este script:
--   1. Detecta automáticamente todas las tablas de los esquemas
--      `humanresources` y `person` cuya primary key es una sola columna
--      respaldada por una secuencia (es decir, columnas autogeneradas:
--      businessentity, department, shift, jobcandidate).
--   2. Ajusta cada secuencia a MAX(id) de los datos migrados (o la deja en
--      su valor inicial si la tabla está vacía).
--   3. Verifica el ajuste con un INSERT de prueba por tabla (usando
--      DEFAULT para la columna autogenerada y valores dummy para el resto
--      de columnas NOT NULL sin default, según su tipo de dato).
--   4. Elimina cada registro de prueba insertado, sin dejar rastro.
--
-- Es idempotente: se puede ejecutar tantas veces como sea necesario, antes
-- o después de tener datos reales en las tablas.
-- =====================================================================

DO $$
DECLARE
    tbl RECORD;
    seq_name text;
    max_id bigint;
    other_col RECORD;
    insert_cols text;
    insert_vals text;
    dummy_val text;
    new_id bigint;
    tablas_procesadas int := 0;
BEGIN
    FOR tbl IN
        SELECT
            n.nspname AS schema_name,
            c.relname AS table_name,
            a.attname AS pk_column
        FROM pg_constraint con
        JOIN pg_class c ON c.oid = con.conrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_attribute a
            ON a.attrelid = c.oid AND a.attnum = con.conkey[1]
        WHERE con.contype = 'p'
          AND array_length(con.conkey, 1) = 1
          AND n.nspname IN ('humanresources', 'person')
          AND pg_get_serial_sequence(
                  n.nspname || '.' || c.relname, a.attname
              ) IS NOT NULL
        ORDER BY n.nspname, c.relname
    LOOP
        BEGIN
            seq_name := pg_get_serial_sequence(
                tbl.schema_name || '.' || tbl.table_name, tbl.pk_column
            );

            -- 1. Ajustar la secuencia al máximo id existente
            EXECUTE format(
                'SELECT max(%I) FROM %I.%I',
                tbl.pk_column, tbl.schema_name, tbl.table_name
            ) INTO max_id;

            IF max_id IS NULL THEN
                PERFORM setval(seq_name, 1, false);
            ELSE
                PERFORM setval(seq_name, max_id, true);
            END IF;

            RAISE NOTICE 'Secuencia % ajustada (max id = %)',
                seq_name, COALESCE(max_id, 0);

            -- 2. Armar un INSERT de prueba: DEFAULT en la columna
            --    autogenerada + valores dummy en columnas NOT NULL sin
            --    default, según su tipo de dato.
            insert_cols := '';
            insert_vals := '';

            FOR other_col IN
                SELECT
                    a.attname AS column_name,
                    format_type(a.atttypid, a.atttypmod) AS data_type
                FROM pg_attribute a
                JOIN pg_class c ON c.oid = a.attrelid
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = tbl.schema_name
                  AND c.relname = tbl.table_name
                  AND a.attnum > 0
                  AND NOT a.attisdropped
                  AND a.attname <> tbl.pk_column
                  AND a.attnotnull
                  AND NOT EXISTS (
                      SELECT 1 FROM pg_attrdef d
                      WHERE d.adrelid = a.attrelid AND d.adnum = a.attnum
                  )
            LOOP
                dummy_val := CASE
                    WHEN other_col.data_type ILIKE 'character varying%'
                      OR other_col.data_type ILIKE 'character(%'
                      OR other_col.data_type = 'text'
                        THEN quote_literal('seq_test')
                    WHEN other_col.data_type ILIKE 'numeric%'
                      OR other_col.data_type IN
                          ('integer', 'smallint', 'bigint', 'real',
                           'double precision', 'money')
                        THEN '0'
                    WHEN other_col.data_type = 'boolean'
                        THEN 'false'
                    WHEN other_col.data_type ILIKE 'timestamp%'
                      OR other_col.data_type = 'date'
                        THEN 'now()'
                    WHEN other_col.data_type ILIKE 'time%'
                        THEN quote_literal('00:00:00')
                    WHEN other_col.data_type = 'uuid'
                        THEN 'gen_random_uuid()'
                    ELSE 'NULL'
                END;

                insert_cols := insert_cols || quote_ident(other_col.column_name) || ', ';
                insert_vals := insert_vals || dummy_val || ', ';
            END LOOP;

            IF insert_cols <> '' THEN
                insert_cols := left(insert_cols, length(insert_cols) - 2);
                insert_vals := left(insert_vals, length(insert_vals) - 2);
            END IF;

            -- 3. Insertar el registro de prueba
            IF insert_cols = '' THEN
                EXECUTE format(
                    'INSERT INTO %I.%I DEFAULT VALUES RETURNING %I',
                    tbl.schema_name, tbl.table_name, tbl.pk_column
                ) INTO new_id;
            ELSE
                EXECUTE format(
                    'INSERT INTO %I.%I (%s) VALUES (%s) RETURNING %I',
                    tbl.schema_name, tbl.table_name,
                    insert_cols, insert_vals, tbl.pk_column
                ) INTO new_id;
            END IF;

            RAISE NOTICE 'Inserción de prueba en %.% exitosa (id = %)',
                tbl.schema_name, tbl.table_name, new_id;

            -- 4. Eliminar el registro de prueba
            EXECUTE format(
                'DELETE FROM %I.%I WHERE %I = %L',
                tbl.schema_name, tbl.table_name, tbl.pk_column, new_id
            );

            RAISE NOTICE 'Registro de prueba eliminado de %.%',
                tbl.schema_name, tbl.table_name;

            tablas_procesadas := tablas_procesadas + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Falló el ajuste/verificación de %.%: %',
                tbl.schema_name, tbl.table_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Ajuste de secuencias completo. Tablas procesadas: %',
        tablas_procesadas;
END $$;
