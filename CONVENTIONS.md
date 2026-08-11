# Convenciones del proyecto

Acordadas por el equipo para mantener el código consistente durante las cuatro entregas. Ver [README.md](./README.md) para el contexto funcional y la arquitectura en capas.

---

## Estructura de carpetas

```
src/
  app/          Presentación — rutas del App Router (páginas, layouts)
  components/   Presentación — componentes de React (ui/ = shadcn, resto = propios)
  actions/      Acciones — Server Actions
  services/     Servicios — lógica de negocio y transacciones
  data/         Datos — cliente de Prisma, único punto de acceso a la BD
  schemas/      Esquemas de Zod compartidos entre cliente y servidor
  lib/          Utilidades transversales sin capa propia
  config/       Constantes de configuración (navegación, límites)
  proxy.ts      Chequeo optimista de sesión previo a cada navegación
prisma/         Schema y migraciones de Prisma
```

Cada carpeta de capa tiene su propio `README.md` con las reglas específicas que debe cumplir su código.

> **Evolución prevista.** A partir de la entrega 2 la estructura pasa a ser
> **feature-based con capas ligeras**: `src/features/<módulo>/{components,actions,services,data,schemas}`,
> creando dentro de cada módulo solo las capas que necesite. Las cuatro capas y
> sus reglas no cambian; cambia el criterio de agrupación, de tipo de archivo a
> módulo de dominio. Se pospuso para no refactorizar en vísperas de la entrega 1.

---

## Nomenclatura de archivos y carpetas

| Elemento                             | Convención                                  | Ejemplo                                |
| ------------------------------------ | ------------------------------------------- | -------------------------------------- |
| Carpetas                             | `kebab-case`                                | `job-candidates/`                      |
| Componentes React (archivo y export) | `PascalCase`                                | `EmployeeTable.tsx`                    |
| Server Actions                       | `camelCase`, verbo + entidad                | `createEmployee.ts`, `changeSalary.ts` |
| Servicios                            | `camelCase`, sufijo `.service.ts`           | `employee.service.ts`                  |
| Esquemas de Zod                      | `camelCase`, sufijo `.schema.ts`            | `employee.schema.ts`                   |
| Rutas del App Router                 | minúsculas, siguiendo convención de Next.js | `app/empleados/[id]/page.tsx`          |
| Resto de archivos TS (hooks, utils)  | `camelCase`                                 | `formatCurrency.ts`                    |

## Nomenclatura en el código

| Elemento                                     | Convención                    | Ejemplo                             |
| -------------------------------------------- | ----------------------------- | ----------------------------------- |
| Variables y funciones                        | `camelCase`                   | `getActiveEmployees`                |
| Componentes, tipos, interfaces               | `PascalCase`                  | `type EmployeeFormValues`           |
| Constantes globales / enums de valores fijos | `UPPER_SNAKE_CASE`            | `MAX_PAGE_SIZE`                     |
| Esquemas de Zod (variable exportada)         | `camelCase` + sufijo `Schema` | `employeeSchema`                    |
| Server Actions (función exportada)           | verbo en infinitivo + entidad | `hireCandidate`, `transferEmployee` |

**Idioma:** nombres de variables, funciones y componentes en inglés; texto visible para el usuario (labels, mensajes, contenido) en español, igual que el dominio de negocio.

---

## Git: ramas y pull requests

- La rama `main` está protegida: no se aceptan pushes directos, todo cambio entra por pull request con al menos 1 aprobación.
- Ramas de feature con el patrón `tipo/descripcion-corta`:
  - `feature/alta-empleado`
  - `fix/validacion-salario`
  - `docs/actualizar-readme`
  - `chore/config-eslint`
- Una rama por historia de usuario o bugfix. Se elimina al mergear el PR.

La protección de `main` se configura en GitHub (Settings → Branches → Branch protection rules / Rulesets), no en el repositorio:

- Require a pull request before merging (mínimo 1 aprobación).
- Require status checks to pass before merging, una vez exista CI.
- No permitir bypass a administradores para push directo o force-push.
- Bloquear el borrado de la rama.

## Commits

Formato [Conventional Commits](https://www.conventionalcommits.org/):

```
tipo(alcance opcional): descripción breve en imperativo

feat(empleados): agregar formulario de alta
fix(traslado): cerrar EndDate de la asignación anterior
docs: documentar variables de entorno
refactor(servicios): extraer validación de rango salarial
```

Tipos usados: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.

---

## Formato y linting

- **Prettier** formatea todo el código (`npm run format`). No se discuten estilos de formato en code review, se corrigen con el comando.
- **ESLint** (`npm run lint`) valida reglas de Next.js/React y buenas prácticas de TypeScript. Un PR no se mergea con errores de lint.
- Antes de abrir un PR: `npm run lint && npm run typecheck && npm run format:check`.

---

## Reglas de arquitectura (resumen)

Ver el diagrama completo en el [README](./README.md#arquitectura).

- Ninguna capa fuera de `data/` invoca Prisma directamente.
- Toda escritura multi-tabla va dentro de una transacción (`prisma.$transaction`).
- Los esquemas de Zod se definen una vez en `src/schemas` y se comparten entre cliente y servidor.
- La validación de servidor en las Server Actions es obligatoria, independiente de la del cliente.
- Los registros de historial (`EmployeePayHistory`, `EmployeeDepartmentHistory`) se insertan, nunca se actualizan ni se borran.
- Todo lo que cruza de servicios a presentación viaja como `Result<T>` (`src/lib/result.ts`): la UI nunca recibe una excepción de Prisma. Los fallos previstos llevan código de negocio; los inesperados se registran en el servidor y llegan al usuario como mensaje genérico.
- Cada Server Action y cada página comprueban la sesión por su cuenta. `proxy.ts` solo hace un chequeo optimista de la cookie y los layouts no se re-renderizan al navegar, así que ninguno de los dos sirve como control de acceso.
- Filtros, paginación y orden viven en la URL (`searchParams`), no en estado de cliente: así el listado se puede compartir por enlace y el filtrado ocurre en el servidor.
