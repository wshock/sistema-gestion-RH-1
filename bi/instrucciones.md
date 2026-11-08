# Instrucciones para armar el reporte en Windows

La rúbrica del docente está en [Rubrica_PowerBI_AdventureWorks_Mobile.pdf](./Rubrica_PowerBI_AdventureWorks_Mobile.pdf). Esto es lo que falta del trabajo de Power BI. El problema, los requerimientos, los KPIs, el modelo y los datos ya están en esta carpeta. En Windows se arma el archivo, la vista del celular y la publicación en el servidor.

No uses Power BI en el navegador (`app.powerbi.com`). La entrega se califica con **Power BI Desktop optimizado para Report Server**, la publicación en **Power BI Report Server** y el consumo en **Power BI Mobile para Android**.

## Qué te tienen que pasar

La carpeta `bi/` del repositorio, con estas tres cosas:

| Archivo o carpeta | Para qué sirve |
| --- | --- |
| `bi/datos/*.csv` | Ocho tablas listas para importar. No hace falta conectarse a Supabase. |
| `bi/medidas.dax` | Las fórmulas de los indicadores. Se pegan tal cual, después de renombrar las tablas como dice el paso 4. |
| `bi/README.md` | Problema, requerimientos, definición de cada KPI, fórmula y meta. Es el texto para sustentar la rúbrica. |

Conteos esperados al importar, para comprobar que los archivos están completos:

| CSV | Filas |
| --- | --- |
| `dim_departamento.csv` | 16 |
| `dim_turno.csv` | 3 |
| `dim_empleado.csv` | 292 |
| `dim_fecha.csv` | 7.802 |
| `fact_plantilla.csv` | 291 |
| `fact_asignacion.csv` | 300 |
| `fact_salario.csv` | 319 |
| `fact_candidato.csv` | 14 |

`fact_plantilla` tiene 291 filas y `dim_empleado` tiene 292 porque la dimensión incluye un empleado inactivo. Las tarjetas de plantilla deben contar 291, no 292.

## Qué dice el negocio

AdventureWorks ya guarda contratación, salario, departamento, turno y candidatos, pero RRHH solo puede verlo tabla por tabla. El tablero responde, en una pantalla, cuánta gente está activa, cuál es la tarifa horaria vigente por área, qué tan antigua es la plantilla y cuántos candidatos siguen abiertos.

Reglas, las mismas de la aplicación del curso:

- Activo: `currentflag` verdadero. En los CSV eso ya está filtrado en `fact_plantilla`.
- Departamento y turno vigentes: la fila de asignación sin fecha de fin.
- Salario vigente: la tarifa de la fecha más reciente. `tarifa_vigente` es tarifa **horaria**.
- Quien no tiene historial salarial se cuenta en «% sin salario» y no entra al promedio.
- Antigüedad: años cumplidos desde la fecha de contratación. Tramos: Menos de 5 años, 5 a 9, 10 a 14, 15 a 19, 20 años o más.
- Candidato pendiente: no tiene empleado asociado. En el CSV la columna `estado` ya dice `Pendiente` o `Contratado`.

Metas que hay que poder explicar:

| Indicador | Meta |
| --- | --- |
| % con asignación | 100 % |
| % sin salario | 0 % |
| Tarifa promedio | Ningún departamento queda más de 15 % por debajo del promedio de la empresa |
| Antigüedad | Mirar el tramo «20 años o más» por departamento para planear relevo |
| Traslados 12 meses | Revisar el departamento que concentre más del 20 % de los traslados del año |
| Tasa de conversión | 50 % |

## Paso 1. Instalar el Desktop correcto

1. Instala **Power BI Desktop optimizado para Power BI Report Server**. Lo publica Microsoft junto con Report Server. Si el docente indicó una versión del servidor, usa el Desktop de esa misma versión. Si las versiones no coinciden, Publicar falla.
2. Abre ese Desktop. En Archivo tiene que existir **Publicar en Power BI Report Server** (o *Publish to Power BI Report Server*). Si solo aparece «Publicar en Power BI», está instalada la edición de la nube y no sirve para esta entrega.

## Paso 2. Importar los CSV

1. Inicio → Obtener datos → Texto o CSV.
2. Elige `dim_departamento.csv`. En la vista previa, pulsa **Cargar**.
3. Repite con los otros siete archivos de `bi/datos/`.

Comprueba el número de filas de la tabla de arriba. En la vista de tabla, la barra de estado muestra el conteo.

## Paso 3. Corregir tipos de dato

Inicio → Transformar datos. En cada consulta, revisa el icono de tipo en el encabezado de la columna.

| Consulta | Columnas | Tipo |
| --- | --- | --- |
| `dim_departamento` | `departamento_id` | Número entero |
| `dim_turno` | `turno_id` | Número entero |
| `dim_turno` | `cruza_medianoche` | Verdadero/falso |
| `dim_empleado` | `empleado_id`, `anios_antiguedad` | Número entero |
| `dim_empleado` | `fecha_contratacion`, `fecha_nacimiento` | Fecha |
| `dim_empleado` | `asalariado`, `activo` | Verdadero/falso |
| `dim_fecha` | `fecha` | Fecha |
| `dim_fecha` | `anio`, `mes`, `trimestre` | Número entero |
| `fact_plantilla` | `empleado_id`, `departamento_id`, `turno_id`, `frecuencia_pago`, `empleados` | Número entero |
| `fact_plantilla` | `fecha_contratacion`, `fecha_salario` | Fecha |
| `fact_plantilla` | `tarifa_vigente` | Número decimal |
| `fact_plantilla` | `sin_historial_salarial`, `sin_asignacion` | Verdadero/falso |
| `fact_asignacion` | `empleado_id`, `departamento_id`, `turno_id` | Número entero |
| `fact_asignacion` | `fecha_inicio`, `fecha_fin` | Fecha |
| `fact_asignacion` | `vigente` | Verdadero/falso |
| `fact_salario` | `empleado_id`, `frecuencia_pago` | Número entero |
| `fact_salario` | `fecha` | Fecha |
| `fact_salario` | `tarifa` | Número decimal |
| `fact_salario` | `es_cambio` | Verdadero/falso |
| `fact_candidato` | `candidato_id`, `empleado_id` | Número entero |

`fecha_fin` y `empleado_id` de candidatos pueden venir vacíos. Déjalos vacíos: eso significa «sigue vigente» y «candidato pendiente».

Si una columna TRUE/FALSE quedó como texto, cámbiala a Verdadero/falso. Si se queda en texto, las medidas que comparan con `TRUE()` dan blanco.

Inicio → Cerrar y aplicar.

## Paso 4. Renombrar las tablas

Las medidas esperan estos nombres, con esta mayúscula. En la vista de modelo, doble clic en el nombre de la tabla:

| Nombre al importar | Renombrar a |
| --- | --- |
| `dim_departamento` | `DimDepartamento` |
| `dim_turno` | `DimTurno` |
| `dim_empleado` | `DimEmpleado` |
| `dim_fecha` | `DimFecha` |
| `fact_plantilla` | `FactPlantilla` |
| `fact_asignacion` | `FactAsignacion` |
| `fact_salario` | `FactSalario` |
| `fact_candidato` | `FactCandidato` |

Los nombres de las columnas se quedan como vienen en el CSV (`departamento`, `tarifa_vigente`, `empleado_id`, etc.). No los traduzcas: las medidas los citan así.

## Paso 5. Crear las relaciones

Vista de modelo → Administrar relaciones → Nueva. En todas: cardinalidad **varios a uno** (`*:1`) y dirección de filtro **única**, de la dimensión hacia el hecho.

Crea estas relaciones activas:

| Desde | Hacia |
| --- | --- |
| `FactPlantilla[empleado_id]` | `DimEmpleado[empleado_id]` |
| `FactPlantilla[departamento_id]` | `DimDepartamento[departamento_id]` |
| `FactPlantilla[turno_id]` | `DimTurno[turno_id]` |
| `FactPlantilla[fecha_contratacion]` | `DimFecha[fecha]` |
| `FactAsignacion[empleado_id]` | `DimEmpleado[empleado_id]` |
| `FactAsignacion[departamento_id]` | `DimDepartamento[departamento_id]` |
| `FactAsignacion[turno_id]` | `DimTurno[turno_id]` |
| `FactAsignacion[fecha_inicio]` | `DimFecha[fecha]` |
| `FactSalario[empleado_id]` | `DimEmpleado[empleado_id]` |
| `FactSalario[fecha]` | `DimFecha[fecha]` |

Crea una relación más y déjala **inactiva** (desmarca «Activar esta relación»):

| Desde | Hacia |
| --- | --- |
| `FactAsignacion[fecha_fin]` | `DimFecha[fecha]` |

`FactCandidato` no se relaciona con nadie. El estado ya viene en la columna `estado`.

No relaciones un hecho con otro hecho. Si Power BI propone una relación automática de más, bórrala.

Sobre `DimFecha`: clic derecho en la tabla → **Marcar como tabla de fechas** → columna `fecha`.

Orden de las etiquetas, para que los ejes no salgan alfabéticos:

1. Clic en `DimFecha[nombre_mes]` → Herramientas de columna → **Ordenar por columna** → `mes`.
2. En `DimEmpleado`, Nueva columna:

```dax
orden_tramo =
SWITCH (
    DimEmpleado[tramo_antiguedad],
    "Menos de 5 años", 1,
    "5 a 9 años", 2,
    "10 a 14 años", 3,
    "15 a 19 años", 4,
    "20 años o más", 5
)
```

3. Clic en `DimEmpleado[tramo_antiguedad]` → Ordenar por columna → `orden_tramo`.

Oculta de la vista de informe (clic derecho → Ocultar) las columnas que solo sirven para relacionar: todos los `*_id`, `orden_tramo`, `empleados`, `frecuencia_pago`. Así el panel de campos muestra nombre, cargo, departamento, turno, fechas y tarifas.

## Paso 6. Pegar las medidas

1. Clic en la tabla `FactPlantilla`.
2. Inicio → Nueva medida.
3. Borra lo que aparece y pega **una** medida de `bi/medidas.dax`. El nombre va a la izquierda del `=`.
4. Enter. Repite hasta pegar las 14 medidas (las tres últimas son las metas: `Meta sin salario`, `Meta con asignacion`, `Meta conversion`).

Si una medida marca error de nombre, la tabla no quedó renombrada como en el paso 4.

Formato (selecciona la medida → Herramientas de medida → Formato):

| Medida | Formato |
| --- | --- |
| `Empleados activos`, `Empleados sin salario`, `Empleados sin asignacion`, `Traslados 12 meses`, `Cambios salariales 12 meses`, `Candidatos pendientes`, `Candidatos contratados` | Número entero |
| `Tarifa promedio`, `Tarifa minima`, `Tarifa maxima`, `Antiguedad promedio` | Número decimal, 2 decimales (antigüedad puede ir con 1) |
| `% sin salario`, `% con asignacion`, `Tasa de conversion`, `Meta con asignacion`, `Meta conversion` | Porcentaje |
| `Meta sin salario` | Número entero |

Comprueba, sin ningún filtro puesto, una tarjeta de `Empleados activos`. Tiene que mostrar **291**.

Qué filtro mueve cada número:

- Departamento y turno filtran `FactPlantilla` y `FactAsignacion`. Cambian empleados, tarifas, antigüedad y traslados.
- `FactSalario` no tiene departamento. La tarjeta de cambios salariales se queda en el total de la empresa. Es el comportamiento de las medidas tal como están.
- `FactCandidato` tampoco. El anillo y la tasa de conversión no se mueven al elegir un departamento: el proceso de candidatos es de toda la compañía.

## Paso 7. Página de escritorio

Vista de informe. Abajo, renombra la página a **Gestión de personal**. Lienzo 16:9.

Arriba, un cuadro de texto:

> Plantilla, tarifa vigente y candidatos de AdventureWorks. La tarifa es horaria. El salario y el departamento son los vigentes, no el historial completo.

Segmentadores, a la izquierda, uno debajo del otro:

1. Segmentador → campo `DimDepartamento[departamento]`. En el formato del visual, estilo **Lista desplegable**.
2. Segmentador → campo `DimTurno[turno]`. Lista desplegable.

Fila de tarjetas. Cada tarjeta lleva una sola medida, en este orden:

1. `Empleados activos`
2. `Tarifa promedio`
3. `% sin salario`
4. `Antiguedad promedio`
5. `Tasa de conversion`

En `% sin salario` y `Tasa de conversion`, si el formato de la tarjeta ofrece etiqueta de destino, usa `Meta sin salario` (0 %) y `Meta conversion` (50 %).

Segunda fila, tres tarjetas más pequeñas:

1. `% con asignacion`
2. `Traslados 12 meses`
3. `Cambios salariales 12 meses`

Gráficos:

1. **Barras horizontales agrupadas.** Eje Y: `DimDepartamento[departamento]`. Eje X: `Empleados activos`. Título: «Empleados activos por departamento». Ordena el eje por la medida, descendente.
2. **Barras horizontales agrupadas.** Eje Y: `DimDepartamento[departamento]`. Eje X: `Tarifa promedio`. Título: «Tarifa horaria promedio por departamento».
3. **Columnas agrupadas.** Eje X: `DimEmpleado[tramo_antiguedad]`. Eje Y: `Empleados activos`. Título: «Antigüedad de la plantilla». El orden tiene que ser de «Menos de 5 años» a «20 años o más». Si sale alfabético, revisa el paso 5.
4. **Gráfico de anillos.** Leyenda: `FactCandidato[estado]`. Valores: recuento de `FactCandidato[candidato_id]`. Título: «Candidatos». Usa el recuento del identificador, no la medida `Candidatos pendientes`: esa medida ya está filtrada a un solo estado y el anillo saldría con una sola porción.

Título de cada visual en español, visible. Quita la leyenda cuando el gráfico solo tiene una medida.

Prueba de filtros, antes de seguir:

1. Elige un departamento en el segmentador. Las barras y las tarjetas de empleados, tarifa, antigüedad, asignación y traslados cambian. El anillo de candidatos se queda igual.
2. Quita el filtro. `Empleados activos` vuelve a 291.
3. Pasa el cursor por un departamento de la barra de tarifas: el valor es un promedio de tarifas horarias, no una suma de salarios.

## Paso 8. Vista móvil

Esto es un criterio aparte. Hay que diseñarla; no basta con que el informe de escritorio se encoja.

1. Cinta **Vista** → **Diseño móvil** (*Mobile layout*).
2. A la derecha queda la lista de objetos de la página, todavía fuera del teléfono.
3. Arrastra, de arriba hacia abajo, solo estos objetos, en este orden:
   1. El cuadro de texto del título, en una línea corta si no cabe.
   2. La tarjeta `Empleados activos`.
   3. La tarjeta `Tarifa promedio`.
   4. La tarjeta `% sin salario`.
   5. La tarjeta `Antiguedad promedio`.
   6. La tarjeta `Tasa de conversion`.
   7. El gráfico «Empleados activos por departamento».
   8. El segmentador de departamento.
4. Estira cada tarjeta al ancho del teléfono. El número tiene que leerse sin hacer zoom.
5. Estira el segmentador hasta una altura cómoda para tocarlo con el dedo (varias filas de la cuadrícula del teléfono).
6. Deja fuera del teléfono: el segmentador de turno, las tres tarjetas pequeñas, la barra de tarifas, las columnas de antigüedad y el anillo.

Vista → Escritorio para volver al lienzo grande. El diseño móvil queda guardado en la misma página.

## Paso 9. Guardar

Archivo → Guardar como → `Gestion-personal-AdventureWorks.pbix`.

Guarda una copia de ese archivo: es parte de lo que se muestra en la sustentación, junto con el informe ya publicado.

## Paso 10. Publicar en Power BI Report Server

Usa la URL que dé el docente. Suele verse como `http://servidor/reports`.

1. En el navegador, entra al portal de Report Server con el usuario del curso.
2. Nuevo → Carpeta. Nombre: `Gestion de personal`.
3. Entra a la carpeta → Administrar → Seguridad. El grupo o el usuario con el que se va a consultar necesita el rol **Explorador** (*Browser*). Quien publica necesita un rol que permita crear informes. Si no puedes abrir Seguridad, pídele al docente que cree la carpeta y te dé permiso.
4. Vuelve a Power BI Desktop → Archivo → **Publicar en Power BI Report Server**.
5. Si pide la dirección del servidor, pega la URL del portal.
6. Elige la carpeta `Gestion de personal`.
7. Confirma. Al terminar, abre el enlace que muestra el cuadro de diálogo.

En el portal tiene que abrirse el informe y verse las mismas tarjetas que en Desktop. Anota la URL de esa página: es la que se configura en el celular.

Si Publicar dice que la versión del Desktop no es compatible con el servidor, instala el Desktop que corresponde a esa versión de Report Server y vuelve a abrir el `.pbix`.

## Paso 11. Abrirlo en el celular Android

La app lee el informe desde el servidor. No abre el `.pbix`.

1. En el teléfono, instala **Power BI** de Microsoft desde Play Store (Power BI Mobile).
2. El teléfono tiene que alcanzar la URL del servidor. Si el servidor está en la red del laboratorio, conéctalo a esa misma red o a la VPN que indiquen.
3. Abre la app → Configuración → **Conectarse al servidor** (*Connect to server*).
4. Pega la URL del portal de Report Server, la misma del paso 10. Esto es una conexión al servidor de informes, no un inicio de sesión de la cuenta de Power BI en la nube.
5. Entra con el usuario que tenga permiso de Explorador sobre la carpeta.
6. Abre `Gestion de personal` → el informe.
7. Comprueba en el teléfono: las cinco tarjetas se leen en vertical, debajo está la barra de empleados por departamento, y el filtro de departamento se puede tocar y cambia las tarjetas y la barra.

Para la nota, deja evidencia de tres pantallas: el informe en Desktop, la misma página en el portal de Report Server, y el informe abierto en el Android después de usar el filtro.

## Si algo no cuadra

| Lo que ves | Qué revisar |
| --- | --- |
| Una medida subrayada en rojo | El nombre de la tabla no es `FactPlantilla`, `DimEmpleado`, `FactAsignacion`, `FactSalario` o `FactCandidato`. |
| `% sin salario` en blanco | `sin_historial_salarial` quedó como texto. Vuelve al paso 3 y ponla en Verdadero/falso. |
| La tarjeta de empleados muestra 292 | La medida está contando `DimEmpleado`. Tiene que ser `COUNTROWS ( FactPlantilla )`. |
| El eje de antigüedad sale alfabético | Falta Ordenar por columna → `orden_tramo`. |
| El segmentador no cambia la tarifa | La relación `FactPlantilla[departamento_id]` → `DimDepartamento[departamento_id]` no existe o está inactiva. |
| No aparece «Publicar en Power BI Report Server» | El Desktop instalado es el de la nube. Instala la edición para Report Server. |
| El celular pide cuenta de Power BI y no muestra el servidor | Falta Configuración → Conectarse al servidor. La cuenta de la nube no ve este informe. |
