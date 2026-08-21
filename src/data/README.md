# Datos

> Desde la entrega 2 las consultas de cada dominio viven en `src/features/<módulo>/data/`. Acá queda el cliente de Prisma —infraestructura compartida— y lo de autenticación.

Único punto de acceso a la base de datos. Aquí vive el cliente de Prisma (`prisma.ts`) y, si se necesitan, funciones de consulta reutilizables por tabla.

**Regla:** ninguna otra capa importa `@prisma/client` ni `@/generated/prisma` directamente. Todo pasa por aquí.

## Dos orígenes en un mismo esquema

`prisma/schema.prisma` describe dos grupos de tablas con procedencias distintas:

| Esquema en la BD           | Tablas                            | Quién las crea              | ¿Prisma Migrate las gestiona? |
| -------------------------- | --------------------------------- | --------------------------- | ----------------------------- |
| `humanresources`, `person` | Las 8 heredadas de AdventureWorks | pgloader (ver `migration/`) | No, son tablas externas       |
| `app`                      | `AppUser`                         | Migración de Prisma         | Sí                            |

Las heredadas están declaradas en `tables.external` de [`prisma.config.ts`](../../prisma.config.ts): siguen apareciendo en el cliente tipado, pero Prisma Migrate no las crea, altera ni borra. Así las migraciones del repositorio describen solo lo que el equipo añadió, y aplicarlas nunca puede dañar los datos migrados.

### Tablas heredadas: introspección

No se definen a mano, se obtienen por introspección de la base ya migrada (ver [`migration/docs/migration.md`](../../migration/docs/migration.md)):

```bash
npx prisma db pull   # usa los esquemas declarados en el datasource
```

Los nombres reales (`humanresources.employeepayhistory`, `businessentityid`, etc.) siguen la convención de AdventureWorks, distinta a la del ecosistema JS. Cada modelo y campo tiene `@@map`/`@map` a un nombre legible en PascalCase/camelCase (`EmployeePayHistory`, `businessEntityId`); volver a correr `db pull` conserva esos mapeos automáticamente en vez de sobrescribirlos.

> No pasar `--schemas`: sobrescribe la lista del datasource y borraría `AppUser` del esquema.

### Tabla propia: migraciones versionadas

Los cambios sobre el esquema `app` se generan como migración y se aplican con `deploy`. Tras editar el modelo en `prisma/schema.prisma`:

```bash
# 1. Generar el SQL comparando la base actual con el esquema editado
CARPETA="prisma/migrations/$(date -u +%Y%m%d%H%M%S)_descripcion_corta"
mkdir -p "$CARPETA"
npx prisma migrate diff --from-config-datasource \
  --to-schema prisma/schema.prisma --script -o "$CARPETA/migration.sql"

# 2. Aplicarla y registrarla en el historial (_prisma_migrations)
npx prisma migrate deploy
```

Dos advertencias sobre este flujo:

- Usar `migrate deploy`, no `migrate dev`: este último necesita una shadow database que Supabase no permite crear.
- `migrate diff` con `externalTables` activo **no emite `CREATE SCHEMA`**. Al introducir un esquema nuevo hay que agregar el `CREATE SCHEMA IF NOT EXISTS` a mano al inicio del `migration.sql`, o la migración fallará sobre una base limpia.

Tras cualquier cambio de esquema, regenerar el cliente:

```bash
npx prisma generate
```
