# Acciones

> Desde la entrega 2 las Server Actions de cada dominio viven en `src/features/<módulo>/actions/`. Acá queda solo lo de autenticación, que no se migró a feature.

Server Actions (`"use server"`). Es el puente entre la presentación y los servicios.

**Responsabilidad de cada action:**

1. Recibir el input (típicamente `FormData` o un objeto tipado).
2. Validarlo contra el esquema de Zod correspondiente en `src/schemas`.
3. Delegar la lógica al servicio adecuado.
4. Traducir el resultado (o el error) a algo que la UI pueda consumir.

**Regla:** no contiene lógica de negocio ni llama a Prisma directamente.

## Autenticación

`login.ts` y `logout.ts` envuelven `signIn`/`signOut` de Auth.js, configurado en [`src/auth.ts`](../auth.ts).

Cómo se reparte la responsabilidad:

| Pieza                      | Responsabilidad                                                          |
| -------------------------- | ------------------------------------------------------------------------ |
| `actions/login.ts`         | Valida el formulario y traduce cualquier fallo al mismo mensaje genérico |
| `auth.ts` (proveedor)      | Expone las credenciales a Auth.js y establece la sesión                  |
| `services/auth.service.ts` | Busca el usuario y compara la contraseña contra el hash                  |
| `lib/password.ts`          | bcrypt: único lugar donde se hashea o compara una contraseña             |

Dos decisiones que conviene no revertir sin pensarlo:

- **Un solo mensaje de error.** Correo inexistente, contraseña incorrecta y entrada malformada devuelven idéntico texto y, en `verifyCredentials`, idéntico `null`. Además, cuando el correo no existe se compara contra un hash de descarte para que el tiempo de respuesta tampoco delate su existencia.
- **Sesión en JWT.** La exige el proveedor de credenciales de Auth.js. El cierre de sesión expira la cookie (`Max-Age=0`), que es lo que invalida la sesión; no hay tabla de sesiones que borrar. Un token ya emitido y capturado seguiría siendo válido hasta su vencimiento: si se necesitara revocación inmediata, habría que versionar los tokens contra un campo de `AppUser`.
