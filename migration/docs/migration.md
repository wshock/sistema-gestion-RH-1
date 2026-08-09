# Migración de AdventureWorks (SQL Server → PostgreSQL)

Este documento describe cómo se migran los esquemas `HumanResources` y `Person`
de AdventureWorks desde SQL Server hacia la base PostgreSQL del proyecto
(Supabase). El proceso es reproducible desde cero con un solo comando.

## Alcance

Se migran 8 tablas:

- `HumanResources.Employee`
- `HumanResources.Department`
- `HumanResources.Shift`
- `HumanResources.JobCandidate`
- `HumanResources.EmployeeDepartmentHistory`
- `HumanResources.EmployeePayHistory`
- `Person.BusinessEntity`
- `Person.Person`

Los esquemas `Sales` y `Production` quedan explícitamente excluidos.

### Adaptaciones de tipos

| Campo original | Tipo SQL Server | Tipo destino | Motivo |
|---|---|---|---|
| `Employee.OrganizationNode` | `hierarchyid` | `text` | Sin equivalente en PostgreSQL. Se conserva el valor como texto, sin uso funcional (fuera de alcance del proyecto). |
| `JobCandidate.Resume` | `xml` | `text` | pgloader crea la columna como `xml` por defecto. Varios currículums en los datos de muestra traen XML mal formado, lo que hace que PostgreSQL rechace la fila al validar. Se fuerza `text` para evitar la validación. |

## Herramientas

- [Docker](https://www.docker.com/) (para correr `pgloader` y `psql` sin instalarlos localmente)
- Acceso de red desde el contenedor hacia la instancia de SQL Server de origen
- Credenciales de la base Supabase destino

No se requiere instalar `pgloader` ni el cliente de PostgreSQL en el equipo: ambos corren dentro de contenedores.

## Archivos

Todo vive en `migration/`:

```
migration/
├── adventureworks.load.template   # plantilla del script de pgloader (versionado)
├── adventureworks.load            # generado en cada corrida, con credenciales reales (ignorado por git)
├── post_migration_constraints.sql # crea las primary/foreign keys post-carga (versionado)
├── reset_sequences.sql            # ajusta y verifica las secuencias autoincrementales (versionado)
├── migrate.mjs                    # orquesta todo el proceso (versionado)
└── .gitignore                     # excluye adventureworks.load del repo
```

La cadena de conexión **nunca se versiona**: se inyecta en tiempo de ejecución
vía las variables de entorno `MSSQL_URI` y `PG_URI`, que sustituyen los
placeholders del `.template` mediante `envsubst`.

## Cómo ejecutar la migración

```bash
export MSSQL_URI="mssql://usuario:password@host:1433/AdventureWorks2022"
export PG_URI="postgresql://usuario:password@host:5432/postgres"

node migration/migrate.mjs
```

El script hace, en orden:

1. Genera `adventureworks.load` a partir del template, con las URIs reales.
2. Corre `pgloader` en un contenedor Docker, que crea las tablas, migra los
   datos (con los casts de tipos descritos arriba) y resetea las secuencias.
3. Corre `post_migration_constraints.sql` contra la base destino, en un
   contenedor con el cliente `psql`, para crear las primary keys y foreign
   keys.
4. Corre `reset_sequences.sql` contra la base destino, en un contenedor con
   el cliente `psql`, para ajustar las secuencias autoincrementales al
   máximo id migrado y verificar el ajuste con un insert/delete de prueba
   por tabla (ver [Ajuste de secuencias autoincrementales](#ajuste-de-secuencias-autoincrementales)).

Es seguro volver a correrlo: la carga (`include no drop`), el script de
constraints (chequeos `IF NOT EXISTS`) y el ajuste de secuencias son
idempotentes frente a una base ya migrada.

## Por qué las constraints se crean en un paso aparte

El driver de SQL Server de pgloader no siempre logra traducir correctamente
las primary keys clustered de origen, lo que impide crear automáticamente
las foreign keys dependientes (error `42830: there is no unique constraint
matching given keys`). Para no depender de ese comportamiento poco confiable,
la carga de datos y la creación de constraints se separan en dos pasos
explícitos y verificables.

> Nota: durante la carga pueden aparecer warnings de
> `Max connections reached, increase value of TDS_MAX_CONN` en la salida de
> pgloader. Son ruido del driver FreeTDS y no afectan el resultado —
> `fetch meta data` reporta 0 errores incluso cuando aparecen.

## Ajuste de secuencias autoincrementales

`pgloader` migra los datos con `reset sequences`, que en teoría deja cada
secuencia apuntando al máximo id migrado. En la práctica esto no es
confiable frente a los `CAST` de tipos usados en esta migración: si una
secuencia queda en su valor inicial (1), el primer `INSERT` real sobre esa
tabla falla con `duplicate key value violates unique constraint`.

De las 8 tablas migradas, solo 4 tienen un identificador autogenerado con
PK de una sola columna:

- `person.businessentity`
- `humanresources.department`
- `humanresources.shift`
- `humanresources.jobcandidate`

Las otras 4 quedan fuera: `person.person` y `humanresources.employee`
comparten `businessentityid` como PK/FK (no es autoincremental en esa
tabla), y `employeedepartmenthistory` / `employeepayhistory` tienen PK
compuesta.

`reset_sequences.sql` detecta automáticamente esas 4 tablas (cualquier
tabla de `humanresources`/`person` cuya PK sea una columna respaldada por
una secuencia, vía `pg_get_serial_sequence`), y para cada una:

1. Ajusta la secuencia a `MAX(id)` de los datos migrados con `setval`.
2. Inserta una fila de prueba (usando `DEFAULT` para el id y valores dummy
   para el resto de columnas `NOT NULL` sin default) para confirmar que la
   secuencia ya no colisiona con datos existentes.
3. Elimina inmediatamente la fila de prueba insertada.

Es idempotente: correrlo varias veces, con o sin datos reales adicionales
en las tablas, no tiene efectos secundarios.

Para verificar manualmente que las secuencias quedaron alineadas después de
una corrida:

```sql
SELECT
    'person.businessentity' AS tabla, max(businessentityid) AS max_id,
    currval(pg_get_serial_sequence('person.businessentity', 'businessentityid')) AS seq_actual
FROM person.businessentity
UNION ALL
SELECT 'humanresources.department', max(departmentid),
    currval(pg_get_serial_sequence('humanresources.department', 'departmentid'))
FROM humanresources.department
UNION ALL
SELECT 'humanresources.shift', max(shiftid),
    currval(pg_get_serial_sequence('humanresources.shift', 'shiftid'))
FROM humanresources.shift
UNION ALL
SELECT 'humanresources.jobcandidate', max(jobcandidateid),
    currval(pg_get_serial_sequence('humanresources.jobcandidate', 'jobcandidateid'))
FROM humanresources.jobcandidate;
```

`seq_actual` debe ser igual a `max_id` en las cuatro filas.

## Verificación post-migración

Confirmar que las 7 foreign keys quedaron creadas:

```sql
SELECT conname, conrelid::regclass AS tabla, confrelid::regclass AS referencia
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace IN ('humanresources'::regnamespace, 'person'::regnamespace)
ORDER BY conrelid::regclass::text;
```

Debe devolver 7 filas.

Confirmar que `Sales` y `Production` no existen en la base destino:

```sql
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN ('sales', 'production');
```

Debe devolver 0 filas.

Conteos esperados por tabla:

| Tabla | Filas |
|---|---|
| `humanresources.department` | 16 |
| `humanresources.employee` | 290 |
| `humanresources.employeedepartmenthistory` | 296 |
| `humanresources.employeepayhistory` | 316 |
| `humanresources.jobcandidate` | 13 |
| `humanresources.shift` | 3 |
| `person.businessentity` | 20 777 |
| `person.person` | 19 972 |