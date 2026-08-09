# Datos

Único punto de acceso a la base de datos. Aquí vive el cliente de Prisma (`prisma.ts`) y, si se necesitan, funciones de consulta reutilizables por tabla.

**Regla:** ninguna otra capa importa `@prisma/client` ni `@/generated/prisma` directamente. Todo pasa por aquí.
