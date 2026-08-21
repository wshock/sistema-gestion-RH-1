# Acuerdo de trabajo — módulo de empleados

Contrato entre las dos features en que se parte el módulo, para que ambas se
desarrollen en paralelo sin bloquearse ni chocar al integrar.

|                     |                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **F05 — Lectura**   | Listado paginado con búsqueda y filtros, y ficha de detalle con asignación vigente, salario actual e historiales |
| **F06 — Escritura** | Alta, edición y baja lógica                                                                                      |

Este documento se acuerda **antes** de que cualquiera empiece a implementar.
Cambiar algo de lo que aquí se fija requiere avisar a la otra parte, porque por
definición le afecta.

---

## 1. Qué comparten las dos features

Tres archivos, y son de propiedad conjunta: **no se modifican dentro de una
rama de feature sin acordarlo**.

| Archivo                                                                     | Contiene                                                                                                                                 |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/features/empleados/types.ts`](../src/features/empleados/types.ts)     | `EmployeeListItem`, `EmployeeDetail`, `EmployeeAssignment`, `EmployeePayRecord` y los dominios `MaritalStatus`, `Gender`, `PayFrequency` |
| [`src/features/empleados/schemas.ts`](../src/features/empleados/schemas.ts) | `employeeCreateSchema`, `employeeEditSchema`, `employeeQuerySchema`, `employeeIdSchema`, `TAMANO_PAGINA`                                 |
| Este documento                                                              | El reparto y los puntos de montaje                                                                                                       |

Ambas features importan desde ahí; ninguna define tipos de empleado por su
cuenta.

### Por qué los tipos viven fuera de `data/`

En departamentos y turnos el tipo de fila vive junto a la consulta que lo
produce (`DepartmentRow` está en `data/department.ts`). Acá no puede: la
consulta es de F05 y F06 también necesita los tipos. Si vivieran en el archivo
de F05, F06 quedaría bloqueada esperándolo y cualquier ajuste de tipo tocaría
un archivo ajeno. Por eso `types.ts` es de nadie y de los dos.

---

## 2. Dos conversiones que la capa de datos debe aplicar

Están documentadas en `types.ts`, pero se repiten acá porque son la fuente más
probable de un bug silencioso.

### Fechas sin hora → texto `"AAAA-MM-DD"`

Las columnas `date` (`birthDate`, `hireDate`, `startDate`, `endDate`) **no
viajan como `Date`**. El driver las devuelve situadas a medianoche UTC, así que
leerlas con `getDate()` desde Bogotá da el día anterior. Medido sobre el
empleado 1:

```
en la base      1969-01-29
Prisma          1969-01-29T00:00:00.000Z
con getDate()   1969-01-28   ← un día menos
```

La misma ficha mostraría fechas distintas según dónde corra el servidor —el de
Vercel va en UTC, la máquina de desarrollo no—. Se convierten en SQL:

```sql
to_char(hiredate, 'YYYY-MM-DD') AS "hireDate"
```

Es exactamente el problema que ya apareció con las horas de los turnos; ver
[`src/features/turnos/data/shift.ts`](../src/features/turnos/data/shift.ts).

Los `timestamptz` (`modifiedDate`, `rateChangeDate`) **sí** son instantes
reales y se mantienen como `Date`.

### Importes → `number`

`rate` es `Decimal` en Prisma: llega como objeto de decimal.js y **no sobrevive
el paso de Server a Client Component**. Se convierte en la capa de datos.
Cualquier aritmética con salarios se hace antes de esa conversión.

---

## 3. La base no valida nada

De AdventureWorks se migraron **solo claves primarias y foráneas**: ni una
restricción `UNIQUE` ni `CHECK` (ver
[`migration/post_migration_constraints.sql`](../migration/post_migration_constraints.sql)).

Consecuencias para F06:

- `nationalIdNumber` y `loginId` **no son únicos en la base**. Si se quieren
  únicos, lo comprueba el servicio antes de escribir, como ya se hace con el
  nombre de departamento o de turno. Hoy no hay ningún duplicado en los 290
  empleados, así que añadir esa comprobación no choca con los datos existentes.
- No hay `CHECK` de fechas: `employeeCreateSchema` es la única barrera contra
  un empleado nacido después de ser contratado o menor de 18 al ingresar.

---

## 4. Reparto de archivos

Nadie edita archivos de la columna ajena. Si hace falta, se pide.

### Compartidos

```
src/features/empleados/types.ts
src/features/empleados/schemas.ts
docs/acuerdo-empleados.md
```

### F05 — Lectura

```
src/features/empleados/data/read.ts                 Consultas de listado y ficha
src/features/empleados/services/read.service.ts     Paginación y armado del detalle
src/features/empleados/components/EmployeeFilters.tsx        Filtros del listado
src/features/empleados/components/EmployeeAssignmentHistory.tsx
src/features/empleados/components/EmployeePayHistory.tsx
src/app/(app)/empleados/page.tsx                    Listado
src/app/(app)/empleados/[id]/page.tsx               Ficha
```

### F06 — Escritura

```
src/features/empleados/data/write.ts                Inserciones y actualizaciones
src/features/empleados/services/write.service.ts    Transacción de alta, edición, baja
src/features/empleados/actions/employee.ts          Server Actions
src/features/empleados/components/EmployeeFormDialog.tsx     Alta y edición
src/features/empleados/components/DeactivateEmployeeDialog.tsx
src/features/empleados/components/EmployeeCreateButton.tsx   ─┐
src/features/empleados/components/EmployeeRowActions.tsx      ├ puntos de montaje
src/features/empleados/components/EmployeeDetailActions.tsx  ─┘
```

---

## 5. Puntos de montaje

F06 necesita poner botones dentro de vistas de F05. Para que no haya que editar
el mismo archivo, **F05 importa exactamente tres componentes de F06 y ninguno
más**:

| Componente              | Dónde lo renderiza F05                                              | Firma                                            |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------ |
| `EmployeeCreateButton`  | Cabecera del listado, donde departamentos pone «Nuevo departamento» | `()`                                             |
| `EmployeeRowActions`    | Columna «Acciones» de cada fila del listado                         | `({ empleado }: { empleado: EmployeeListItem })` |
| `EmployeeDetailActions` | Cabecera de la ficha de detalle                                     | `({ empleado }: { empleado: EmployeeDetail })`   |

Los tres **ya existen en el repositorio como marcadores que devuelven `null`**.
Así F05 puede escribir sus páginas e integrarlas desde el primer día: compilan,
y donde irán los botones no se ve nada hasta que F06 los implemente. F06 los
rellena sin tocar ningún archivo de F05.

Cambiar una de esas tres firmas rompe la compilación de F05, que es
justamente el aviso que se busca: son el contrato, y TypeScript lo verifica.

---

## 6. Rutas y revalidación

Las rutas las crea F05; F06 las necesita para revalidar tras escribir. Se fijan
acá para que no haya que adivinarlas:

| Ruta              | Quién la crea |
| ----------------- | ------------- |
| `/empleados`      | F05           |
| `/empleados/[id]` | F05           |

Tras un alta, edición o baja, las acciones de F06 llaman a
`revalidatePath("/empleados")` y, cuando afecten a una ficha concreta,
`revalidatePath(\`/empleados/${id}\`)`.

**Activar el módulo en la navegación** (`src/config/navigation.ts`, poner
`/empleados` en `disponible: true`) le toca a **F05**, cuando el listado exista.
Hacerlo antes deja un enlace roto.

---

## 7. Puntos de contacto fuera del módulo

Tres cosas que tocan archivos de nadie o de sprint 1. Quien llegue primero las
hace y avisa:

1. **Catálogos para los desplegables.** El formulario de alta de F06 necesita
   la lista completa de departamentos y turnos. Hoy no existe esa consulta:
   habrá que añadir un `listAllDepartments()` en
   `src/features/departamentos/data/department.ts` y un `listAllShifts()` en
   `src/features/turnos/data/shift.ts`. Son módulos ajenos: es una adición
   pequeña, pero se avisa antes.
2. **`src/config/navigation.ts`** — lo activa F05 (punto 6).
3. **Formato de nombres y de importes.** Si ambas features necesitan mostrar
   «Apellido, Nombre» o un salario formateado, el helper va a `src/lib/`, no
   duplicado en cada lado.

---

## 8. Decisiones tomadas

Quedan registradas para no rediscutirlas a mitad del sprint.

| Decisión                                                                                      | Motivo                                                                                                                                |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| El alta crea persona, empleado, asignación inicial y salario inicial, todo en una transacción | Un empleado sin departamento ni salario sería un registro a medias, y la ficha de F05 tendría que tratar ese caso                     |
| La edición **no** incluye departamento, turno ni salario                                      | Se cambian por traslado y cambio salarial (sprint 3), que dejan historial. Es la regla del [README](../README.md#qué-hace-el-sistema) |
| La baja es lógica: `currentFlag = false`                                                      | El histórico del empleado debe sobrevivir                                                                                             |
| La baja es reversible (reactivar)                                                             | El listado filtra por estado; sin reactivación un empleado dado de baja por error quedaría inalcanzable para siempre                  |
| `currentFlag` no es un campo del formulario                                                   | Alta/baja es una acción con confirmación, no una casilla que se marca sin querer al editar otra cosa                                  |
| Página de 20 filas                                                                            | Con 290 empleados, de 10 en 10 serían 29 saltos hasta el final                                                                        |

### Comprobado contra los datos migrados

Todo lo que este acuerdo da por cierto se verificó ejecutándolo contra la base
real, no se dedujo de la documentación de AdventureWorks:

| Qué                                          | Resultado                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `MaritalStatus`                              | Solo `M` y `S`                                                                                  |
| `Gender`                                     | Solo `F` y `M`                                                                                  |
| `PayFrequency`                               | Solo `1` y `2`                                                                                  |
| Desfase de las columnas `date`               | **Real.** `birthdate` = `1969-01-29` en la base; `getDate()` desde Bogotá devuelve `1969-01-28` |
| Tipo de `rate`                               | Objeto `Decimal`, no `number`. `Number(rate)` lo convierte sin pérdida (`125.5`)                |
| Duplicados de `nationalIdNumber` / `loginId` | Ninguno                                                                                         |
| Largos máximos                               | `jobTitle` 40, `nationalIdNumber` 9, `loginId` 28 — holgados frente a los límites del esquema   |

**Estado de la plantilla hoy:** 290 empleados, los 290 activos, todos con
asignación vigente e historial salarial.

Dos consecuencias para F05:

- El filtro «inactivos» no devolverá nada hasta que se dé de baja a alguien. No
  es un fallo del listado.
- `departmentName` y `shiftName` son `string | null` aunque hoy ningún empleado
  esté sin asignar: la consulta lleva `LEFT JOIN` y un alta futura podría dejar
  ese hueco. Es prudencia deliberada, no un caso presente en los datos.

---

## 9. Confirmación

El acuerdo entra en vigor cuando ambos lo confirmen. Hasta entonces, no se
empieza HU-19 ni HU-23.

| Desarrollador | Feature         | Confirmado |
| ------------- | --------------- | ---------- |
| _(pendiente)_ | F05 — Lectura   | ☐          |
| _(pendiente)_ | F06 — Escritura | ☐          |

> El reparto de quién toma cada feature todavía no está decidido. El contrato
> es simétrico: sirve igual con cualquiera de las dos asignaciones.
