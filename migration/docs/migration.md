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
├── migrate.sh                     # orquesta todo el proceso (versionado)
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

Es seguro volver a correrlo: tanto la carga (`include no drop`) como el
script de constraints (chequeos `IF NOT EXISTS`) son idempotentes frente a
una base ya migrada.

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