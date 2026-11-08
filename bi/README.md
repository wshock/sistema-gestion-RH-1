# Reporte Power BI — gestión de personal (AdventureWorks)

Preparado en Mac. Los pasos de Windows, vista móvil y publicación están en [instrucciones.md](./instrucciones.md). La rúbrica del docente está en [Rubrica_PowerBI_AdventureWorks_Mobile.pdf](./Rubrica_PowerBI_AdventureWorks_Mobile.pdf).

La fuente es la misma base del SGRH: esquemas `humanresources` y `person` migrados desde AdventureWorks. El salario y el departamento vigentes no son columnas: se derivan igual que en los reportes de la app.

## 1. Problema y requerimientos

AdventureWorks tiene el historial de personal (contratación, salario, departamento, turno y candidatos), pero ese historial solo se consulta tabla por tabla. RRHH no ve en un solo lugar cuánta gente está activa, cuánto cuesta la tarifa vigente por área, qué tan antigua es la plantilla ni cuántos candidatos siguen abiertos.

Objetivo: que una persona de RRHH decida sobre plantilla y compensación sin escribir SQL.

Requerimientos:

1. Contar empleados activos y verlos por departamento y por turno.
2. Mostrar la tarifa horaria vigente (promedio, mínimo y máximo) por departamento. Quien no tenga historial salarial se cuenta aparte y no entra al promedio.
3. Mostrar antigüedad en años cumplidos y por los mismos tramos de la app (menos de 5, 5–9, 10–14, 15–19, 20 o más).
4. Contar traslados y cambios salariales de los últimos 12 meses, sin reescribir el historial.
5. Separar candidatos pendientes y contratados. Pendiente significa `businessentityid` nulo.
6. Filtrar por departamento y por turno.
7. Leer las mismas cifras en el celular, en vertical.

## 2. KPIs

La tarifa es la columna `rate` de AdventureWorks (tarifa horaria). Las metas son de gestión para el tablero, no vienen de la base de muestra.

| KPI | Definición | Fórmula | Meta |
| --- | --- | --- | --- |
| Empleados activos | Personas con `currentflag` verdadero | `COUNTROWS ( FactPlantilla )` | 100 % con asignación vigente |
| % con asignación | Activos cuya fila vigente de departamento existe | `([Empleados activos] - [Empleados sin asignacion]) / [Empleados activos]` | 100 % |
| Tarifa promedio | Promedio de la tarifa vigente de activos que sí tienen historial. `AVERAGE` ignora vacíos | `AVERAGE ( FactPlantilla[tarifa_vigente] )` | Ningún departamento queda más de 15 % por debajo del promedio de la empresa |
| % sin salario | Activos sin ninguna fila en `EmployeePayHistory` | `[Empleados sin salario] / [Empleados activos]` | 0 % |
| Antigüedad promedio | Media de años cumplidos de los activos | `AVERAGEX` sobre `DimEmpleado[anios_antiguedad]` | Ver el tramo «20 años o más» por departamento para planear relevo |
| Traslados 12 meses | Asignaciones ya cerradas (`fecha_fin` no nula) en el último año | Conteo de `FactAsignacion` no vigente con `fecha_fin >= EDATE(TODAY(), -12)` | Revisar el departamento que concentre más del 20 % de esos traslados |
| Cambios salariales 12 meses | Filas de historial posteriores a la fecha de contratación, último año | Conteo de `FactSalario` con `es_cambio` y `fecha` en 12 meses | Todo cambio queda como fila nueva; la meta de control es que el conteo coincida con el historial de la app |
| Tasa de conversión | Contratados sobre el total de candidatos | contratados / (contratados + pendientes) | 50 % |

Las medidas están listas para pegar en `bi/medidas.dax`.

## 3. Modelo en estrella

Vistas en el esquema `bi` (`bi/sql/modelo.sql`):

| Tabla en Power BI | Grano | Rol |
| --- | --- | --- |
| `DimEmpleado` | un empleado | nombre, cargo, estado, antigüedad, tramo |
| `DimDepartamento` | un departamento | nombre y grupo |
| `DimTurno` | un turno | horario |
| `DimFecha` | un día, desde la contratación más antigua hasta un año adelante | eje de tiempo |
| `FactPlantilla` | un empleado activo | tarjetas y promedios de hoy |
| `FactAsignacion` | un periodo de asignación | traslados |
| `FactSalario` | un cambio de tarifa | aumentos |
| `FactCandidato` | un candidato | embudo |

Relaciones (varias a uno, filtro de la dimensión hacia el hecho):

- `FactPlantilla[empleado_id]` → `DimEmpleado[empleado_id]`
- `FactPlantilla[departamento_id]` → `DimDepartamento[departamento_id]`
- `FactPlantilla[turno_id]` → `DimTurno[turno_id]`
- `FactPlantilla[fecha_contratacion]` → `DimFecha[fecha]`
- `FactAsignacion` igual con `empleado_id`, `departamento_id`, `turno_id`
- `FactAsignacion[fecha_fin]` → `DimFecha[fecha]` en una segunda relación **inactiva** (la activa es `fecha_inicio`)
- `FactSalario[empleado_id]` → `DimEmpleado[empleado_id]`
- `FactSalario[fecha]` → `DimFecha[fecha]`
- `FactCandidato` no se une a la plantilla: es otro proceso. El estado se filtra en la medida.

No relacionar hechos entre sí.

En la medida de traslados, activar la relación de `fecha_fin` con `USERELATIONSHIP` solo si el filtro de fecha del lienzo debe aplicarle. Tal como está en `medidas.dax`, el corte de 12 meses va directo sobre `fecha_fin` y no depende de esa relación.

## 4. Qué va en cada vista

Escritorio, una página «Gestión de personal»:

- Fila de tarjetas: Empleados activos, Tarifa promedio, % sin salario, Antigüedad promedio, Tasa de conversión.
- Barras horizontales: empleados por departamento.
- Barras: tarifa promedio por departamento.
- Columnas: empleados por tramo de antigüedad.
- Anillo: candidatos por estado.
- Segmentadores: departamento y turno.

Móvil (Mobile layout, no copiar el lienzo de escritorio):

1. Las cinco tarjetas, apiladas, número grande.
2. Un solo gráfico: empleados por departamento.
3. Segmentador de departamento, control alto para el dedo.
4. Dejar fuera el anillo, el mínimo/máximo y el detalle de turnos.

## 5. Regenerar los CSV

Con la base del proyecto accesible en `DATABASE_URL`:

```bash
npm run bi:export
```

Escribe `bi/datos/*.csv` (una archivo por vista) y crea el esquema `bi` en PostgreSQL. Esos CSV se importan en Power BI Desktop (Obtener datos → Texto/CSV). Si en Windows pueden llegar a la misma base, también sirve conectarse a PostgreSQL y leer el esquema `bi`.

## 6. Lo que queda en Windows

1. Instalar **Power BI Desktop optimizado para Report Server** (la edición de Power BI en el navegador no publica en PBIRS ni deja el layout móvil de esta entrega).
2. Importar los CSV, armar las relaciones de la sección 3 y pegar `bi/medidas.dax`.
3. Maquetar la página de escritorio y, en Vista → Diseño para dispositivos móviles, la pila de la sección 4.
4. Publicar el `.pbix` en la URL de Power BI Report Server que indique la clase, dentro de una carpeta con permiso de lectura.
5. En Power BI Mobile (Android), conectar esa URL del servidor de informes —no la cuenta de app.powerbi.com— y abrir el reporte.
