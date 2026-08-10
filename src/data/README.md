# Datos

Único punto de acceso a la base de datos. Aquí vive el cliente de Prisma (`prisma.ts`) y, si se necesitan, funciones de consulta reutilizables por tabla.

**Regla:** ninguna otra capa importa `@prisma/client` ni `@/generated/prisma` directamente. Todo pasa por aquí.

## Origen del esquema (`prisma/schema.prisma`)

Las 8 tablas de `HumanResources`/`Person` no se definen a mano: se obtienen por introspección de la base ya migrada (ver [`migration/docs/migration.md`](../../migration/docs/migration.md)).

```bash
npx prisma db pull --schemas=humanresources,person
```

Los nombres reales (`humanresources.employeepayhistory`, `businessentityid`, etc.) siguen la convención de AdventureWorks, distinta a la del ecosistema JS. Cada modelo y campo tiene `@@map`/`@map` a un nombre legible en PascalCase/camelCase (`EmployeePayHistory`, `businessEntityId`); volver a correr `db pull` conserva esos mapeos automáticamente en vez de sobrescribirlos.

Tras cualquier `db pull`, regenerar el cliente:

```bash
npx prisma generate
```
