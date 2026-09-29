# Documentación técnica

Justificación de la arquitectura y de las decisiones de diseño del Sistema de Gestión de Recursos Humanos (PeopleFlow) sobre AdventureWorks. El código es la fuente de detalle; este documento explica **por qué** está hecho así.

Público: docente evaluador o desarrollador ajeno al equipo.

---

## 1. Arquitectura en capas

```
Presentación     app/, components/          UI, formularios, rutas
     ↓
Acciones         features/*/actions/        Session, Zod, revalidatePath
     ↓
Servicios        features/*/services/       Reglas de negocio, Result
     ↓
Datos            features/*/data/, data/    Prisma y SQL; nadie más toca la BD
```

| Capa | Responsabilidad | No hace |
| --- | --- | --- |
| **Presentación** | Renderizar, recoger input, mostrar toasts/errores de campo | Invocar Prisma ni armar reglas de negocio |
| **Acciones** | Comprobar sesión, validar otra vez, delegar, revalidar caché | Lógica de dominio ni transacciones |
| **Servicios** | Orquestar reglas, traducir fallos a `Result`, decidir cuándo abortar | Hablar con el driver de BD directamente |
| **Datos** | Consultas y escrituras (incluidas `$transaction`) | Decidir mensajes de UI ni validar formularios |

Desde la entrega 2 el código se agrupa por **feature** (`empleados`, `candidatos`, `reportes`, …). Las cuatro capas siguen siendo las mismas; solo cambia dónde viven los archivos. Un módulo no importa de otro: lo compartido sube a `src/lib/` o `src/components/shared/`.

El chequeo de sesión en `proxy.ts` es **optimista** (solo mira la cookie). La protección real está en cada página (`requireSessionUser`) y en cada Server Action (`getSessionUser` → `NO_AUTORIZADO`).

Todo lo que cruza de servicios a UI viaja como `Result<T>` (`src/lib/result.ts`): la presentación nunca recibe una excepción de Prisma.

---

## 2. Modelo de datos y adaptaciones sobre AdventureWorks

### 2.1 Origen

Los datos de RH no se inventan: se migran desde SQL Server (AdventureWorks) a PostgreSQL. Ver [`migration/docs/migration.md`](../migration/docs/migration.md).

Tablas migradas (`humanresources` / `person`):

| Tabla | Rol |
| --- | --- |
| `Employee` | Entidad laboral |
| `Department`, `Shift` | Catálogos |
| `JobCandidate` | Aspirantes |
| `EmployeeDepartmentHistory` | Asignaciones (historial) |
| `EmployeePayHistory` | Salarios (historial) |
| `BusinessEntity`, `Person` | Identidad y nombre |

Tabla propia del producto (`app`):

| Tabla | Rol |
| --- | --- |
| `AppUser` | Credenciales del administrador |

### 2.2 Adaptaciones deliberadas

| Original | En PostgreSQL / app | Motivo |
| --- | --- | --- |
| `OrganizationNode` (`hierarchyid`) | Texto; no se usa en la UI | Sin equivalente nativo útil; fuera de alcance |
| `JobCandidate.Resume` (XML) | Texto plano | Lectura humana en la ficha |
| Nombres del candidato | Columnas `firstname`/`lastname` en `jobcandidate` | El currículum libre no garantiza parseo fiable |
| Usuarios del sistema | Esquema `app`, no `person` | Separar autenticación del modelo de muestra |

Prisma declara las tablas heredadas como **externas** (`tables.external` en `prisma.config.ts`): `migrate deploy` no las crea ni las altera. Solo versiona el esquema `app`. Así un despliegue de migraciones no puede pisar los datos migrados.

### 2.3 Fechas e importes

- Columnas `date` se leen/escriben como `"AAAA-MM-DD"` (vía `to_char` / medianoche UTC) para no correr el día en husos como Bogotá.
- `rate` (`Decimal`) se convierte a `number` en la capa de datos antes de cruzar a Client Components.

---

## 3. Decisiones de diseño (y por qué)

### 3.1 El historial se preserva por inserción, no por update

`EmployeePayHistory` y `EmployeeDepartmentHistory` están pensadas para **acumular** filas. Un `UPDATE` del salario vigente borraría la trayectoria.

**Regla de la app:** cambio salarial = `INSERT` de una fila nueva. Traslado = cerrar la asignación abierta (`EndDate`) e `INSERT` de otra. Nunca se borra historial desde la UI.

El salario / departamento “actuales” son **derivados** (fecha más reciente / `EndDate` nulo), no columnas denormalizadas.

### 3.2 La edición de empleado excluye salario y departamento

Si el formulario de edición pudiera cambiar esos campos, sería trivial sobrescribir el vigente sin dejar rastro. Por eso `employeeEditSchema` no los declara: el compilador impide registrarlos ahí. Solo se cambian por los procesos dedicados (cambio salarial, traslado), que dejan historial.

### 3.3 La baja es lógica (`currentFlag`), no física

Borrar un empleado rompería FKs de historiales y candidatos contratados, y borraría evidencia. `currentFlag = false` lo saca de la plantilla activa; la ficha y los historiales siguen consultables (y se puede seguir registrando cambios si hace falta corregir trayectoria).

### 3.4 `AppUser` vive fuera de AdventureWorks

AdventureWorks no modela login de RRHH. Meter usuarios en `person` mezclaría credenciales con datos de muestra y complicaría migraciones. El esquema `app` es propiedad del producto y se versiona con Prisma Migrate.

### 3.5 Operaciones multi-tabla son transaccionales

Contratar escribe en cinco tablas; un alta de empleado abre persona + empleado + historiales; un traslado cierra y abre asignaciones. Si algo falla a mitad, la base quedaría inconsistente.

**Regla:** esas escrituras van en `prisma.$transaction`. O pasan todas o ninguna.

### 3.6 Un solo rol de administrador

Fuera de alcance: portal del empleado, permisos granulares, flujos de aprobación. Un rol simplifica Auth.js (credenciales) y el modelo mental del evaluador.

### 3.7 Feature-based sin imports cruzados

Evita acoplar módulos (“empleados importa departamentos”). Catálogos compartidos para selects se exponen como funciones de datos del propio módulo o se suben a `lib` cuando hay regla transversal (p. ej. bloqueo por integridad referencial).

---

## 4. Patrón de preservación de historial

| Tabla | Qué cuenta como vigente | Cómo cambia |
| --- | --- | --- |
| `EmployeePayHistory` | Fila con `rateChangeDate` más reciente | Solo `INSERT` |
| `EmployeeDepartmentHistory` | Fila con `endDate IS NULL` (si hay varias, la de `startDate` más reciente) | Cerrar abierta + `INSERT` |

Funciones puras de vigencia en lectura: `src/features/empleados/vigencia.ts`. Los reportes de compensación y plantilla resuelven la misma regla **en SQL** (`DISTINCT ON` / filtros de asignación abierta) para no traer historiales completos a memoria.

---

## 5. Transacciones en procesos de negocio

| Proceso | Tablas (orden resumido) | Archivo de datos |
| --- | --- | --- |
| Alta de empleado | `BusinessEntity` → `Person` → `Employee` → historiales iniciales | `empleados/data/write.ts` |
| Contratación | Igual + vínculo `JobCandidate.businessEntityId` | `candidatos/data/hire.ts` |
| Traslado | `UPDATE` asignaciones abiertas + `INSERT` nueva | `empleados/data/write.ts` |
| Cambio salarial | `INSERT` en `EmployeePayHistory` (una tabla; sin transacción multi-paso) | `empleados/data/write.ts` |

Las validaciones de negocio (documento duplicado, departamento inexistente, fechas) se hacen en el **servicio** antes o alrededor de la escritura; la transacción garantiza atomicidad, no sustituye esas reglas.

---

## 6. Convenciones de código

La referencia normativa es [`CONVENTIONS.md`](../CONVENTIONS.md). Resumen:

- Nombres de código en inglés; textos de UI en español.
- Conventional Commits; ramas `feature/…`, `fix/…`.
- Zod una sola vez por feature (`schemas.ts`), compartido cliente/servidor; validación de servidor siempre obligatoria.
- Filtros y paginación en la URL (`searchParams`).
- Prettier + ESLint antes de mergear.

READMEs por capa: `src/features/README.md`, `src/data/README.md`, `src/components/README.md`, etc.

---

## 7. Autenticación y sesión

- Auth.js con credenciales; un `AppUser` sembrado.
- Cookie de sesión; proxy deja pasar Server Actions sin cookie válida para que la acción responda `NO_AUTORIZADO` en lugar de redirigir en silencio.
- `redirectIfSessionExpired` en el cliente manda al login con mensaje cuando una operación sensible pierde la sesión a mitad de camino.

Detalles de robustez: [`revision-robustez.md`](./revision-robustez.md), [`revision-ficha-procesos.md`](./revision-ficha-procesos.md) (este último llega con HU-47).

---

## 8. Reportes

Son consultas de agregación en la base (no gráficos). Ejemplos de decisiones:

- Compensación: promedio/mín/máx sobre tarifa vigente de activos, por departamento vigente; sin historial salarial → contados aparte, fuera del promedio.
- Antigüedad: `age(CURRENT_DATE, hiredate)` en SQL; tramos fijos; detalle paginado.
- Plantilla / totales: headcount por departamento y turno con % sobre activos.

---

## Lecturas relacionadas

Índice completo: [`docs/README.md`](./README.md).
