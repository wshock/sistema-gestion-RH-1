# Verificación de atomicidad — proceso de contratación (HU-33)

No hay entorno de test en el proyecto: esta verificación corre contra la base
real con [`scripts/verify-hire-transaction.ts`](../scripts/verify-hire-transaction.ts)
(`npm run verify:hire`). Cada escenario crea su propio candidato descartable
y limpia lo que crea, incluido el registro exitoso del escenario 3.

Las cinco tablas que la contratación escribe: `BusinessEntity`, `Person`,
`Employee`, `EmployeeDepartmentHistory`, `EmployeePayHistory`, más el vínculo
en `JobCandidate.businessEntityId`.

## Escenarios

### 1. Fallo justo después de crear `BusinessEntity`

Réplica mínima de `prisma.$transaction`: crea `BusinessEntity` y lanza un
error a propósito antes de `Person`. Verifica el mecanismo de transacción que
usa `hireCandidate`, en el punto más temprano de la secuencia.

**Resultado:** el conteo de `BusinessEntity` no cambia. ✅

### 2. Fallo en `EmployeeDepartmentHistory` (departamento inexistente)

Llama a `data/hire.ts` directamente (sin el chequeo previo del servicio) con
un `departmentId` que no existe. `BusinessEntity`, `Person` y `Employee` se
crean dentro de la misma transacción antes de que la FK de
`EmployeeDepartmentHistory` la aborte.

**Resultado:** la operación falla, ninguna de las tres tablas conserva el
registro, y el candidato queda con `businessEntityId` nulo. ✅

### 3. Fallo tardío: vínculo con el candidato

Contrata a un candidato de verdad y, sobre ese mismo candidato ya vinculado,
intenta contratarlo otra vez llamando a `data/hire.ts` directamente —simula
dos operaciones confirmando la misma contratación a la vez—. El guard
atómico de HU-31 (`updateMany` con `businessEntityId: null` en el `where`)
hace que el segundo intento no toque ninguna fila y lance
`CandidatoYaContratadoError`.

**Resultado:** el segundo intento falla, y no se crea un segundo empleado.
Las cinco tablas quedan como estaban antes del segundo intento. ✅

### 4. Validación tardía: turno inexistente

Igual que el escenario 2, con `shiftId` inexistente en vez de `departmentId`.

**Resultado:** mismo comportamiento — la operación falla sin dejar
`BusinessEntity`, `Person` ni `Employee`, y el candidato sigue pendiente. ✅

## Mensaje al usuario

Cualquier fallo capturado en `hireCandidate` (servicio) se traduce con
`unexpected()` (`src/lib/result.ts`) al mensaje genérico "Ocurrió un error
inesperado. Intentá de nuevo en unos momentos." — nunca el error de Postgres
ni el de Prisma. El único caso con mensaje propio es el del escenario 3
(`CONFLICTO`: "Este candidato ya fue contratado: no se puede iniciar el
proceso de nuevo."), porque es una condición de negocio identificable, no un
fallo técnico.

## Reintento

Como ningún escenario deja registros parciales ni marca al candidato como
contratado, una contratación fallida se puede reintentar de inmediato con los
mismos datos, sin limpieza manual.

## Última ejecución

```
$ npm run verify:hire

[OK] 1. Fallo tras BusinessEntity no deja registros
[OK] 2. La operación falla (departamento inexistente)
[OK] 2. No queda Person/Employee creado
[OK] 2. El candidato sigue pendiente
[OK] 3. La segunda contratación falla (CandidatoYaContratadoError)
[OK] 3. No se crea un segundo empleado
[OK] 4. La operación falla (turno inexistente)
[OK] 4. No quedan registros parciales
[OK] 4. El candidato sigue pendiente

Todos los escenarios pasaron.
```
