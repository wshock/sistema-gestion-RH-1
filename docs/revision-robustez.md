# Revisión de robustez y despliegue final

Revisión integral de las pantallas de Dev A (listado de empleados, candidatos, contratación y reportes de plantilla) y verificación del despliegue. Registra los defectos encontrados, cómo se corrigieron y lo que queda por verificar en el entorno desplegado.

## Criterios revisados

| Aspecto                                 | Resultado                                                                                                                                           |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Errores en lenguaje de negocio          | Servicios y acciones ya devolvían `Result` con mensajes de negocio. Faltaba cubrir las excepciones fuera de `Result` (D1).                          |
| Estados de carga                        | Faltaban en cuatro rutas (D2).                                                                                                                      |
| Vacío distinto de error                 | Correcto: `DataTable` prioriza error sobre carga y vacío, y cada listado tiene un mensaje de vacío propio (con y sin filtros).                      |
| Confirmación de acciones destructivas   | Correcto: eliminar candidato y dar de baja/reactivar empleado pasan por `ConfirmDialog`, que no se cierra mientras la operación está en curso.      |
| Errores de validación junto al campo    | Correcto: `FormField` pinta el error bajo el control con `aria-describedby`, y los errores de servidor (`fieldErrors`) se trasladan con `setError`. |
| Pérdida de sesión durante una operación | Defectuoso (D3, D4).                                                                                                                                |
| Responsive                              | Desbordes en móvil en el listado de empleados, el de candidatos y la ficha del candidato (D5).                                                      |

## Defectos encontrados y corregidos

| #   | Pantalla                                                 | Defecto                                                                                                                                                                                                                                                                            | Corrección                                                                                                                                                                              |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Toda la zona autenticada                                 | Sin `error.tsx` ni `not-found.tsx`. Una excepción fuera de `Result` (p. ej. la carga de departamentos y turnos de los filtros, o del formulario de contratación, si cae la base) mostraba la pantalla genérica de Next.js en inglés. El 404 del candidato también salía en inglés. | `src/app/(app)/error.tsx` con mensaje de negocio, **Reintentar** e **Ir al inicio**, sin exponer el detalle. `src/app/not-found.tsx` en español.                                        |
| D2  | Empleados, candidatos, ficha del candidato, contratación | Sin estado de carga: al navegar, la pantalla anterior quedaba congelada hasta que respondía la base.                                                                                                                                                                               | `loading.tsx` con esqueleto en las cuatro rutas.                                                                                                                                        |
| D3  | Candidatos, contratación, baja de empleado               | Si la sesión expiraba antes de guardar, la acción respondía `NO_AUTORIZADO` y solo se veía un aviso: el usuario seguía en una pantalla que ya no podía usar.                                                                                                                       | `redirectIfSessionExpired` (`src/lib/sessionExpired.ts`) lleva al login con `motivo=sesion-expirada` y `redirectTo` a la pantalla actual. El login muestra el aviso "Tu sesión expiró". |
| D3b | Todas                                                    | Si la cookie ya no existía, el proxy redirigía la propia petición de la Server Action al login: la acción nunca respondía y el formulario quedaba sin ningún aviso.                                                                                                                | El proxy deja pasar las peticiones de Server Actions (cabecera `next-action`); cada acción ya comprueba la sesión y responde `NO_AUTORIZADO`.                                           |
| D4  | Todas                                                    | Con cookie de sesión presente pero inválida, `requireSessionUser` mandaba a `/login` y el proxy, al ver la cookie, devolvía a `/inicio`: redirección en bucle.                                                                                                                     | `requireSessionUser` redirige a `/login?motivo=sesion-expirada` y el proxy deja pasar al login con ese motivo.                                                                          |
| D5  | Listado de empleados                                     | Siete columnas visibles en móvil: la tabla requería desplazamiento horizontal para llegar a las acciones.                                                                                                                                                                          | En móvil quedan nombre, estado y acciones; documento, cargo, departamento y turno aparecen según el ancho.                                                                              |
| D5  | Listado de candidatos                                    | La columna de acciones repetía "Ver currículum" (el nombre ya enlaza a la ficha) y desbordaba.                                                                                                                                                                                     | En móvil se oculta ese enlace y "Ver empleado" queda como ícono con `aria-label`.                                                                                                       |
| D5  | Ficha del candidato                                      | Estado y tres botones en una sola fila sin salto: desbordaban en pantallas angostas.                                                                                                                                                                                               | `flex-wrap` en el grupo de acciones.                                                                                                                                                    |
| D6  | Ficha del candidato                                      | Un fallo inesperado se mostraba como un párrafo suelto, sin forma de volver.                                                                                                                                                                                                       | Se conserva el enlace "Volver al listado".                                                                                                                                              |
| D7  | Contratación                                             | Un candidato sin nombre y apellido podía completar todo el formulario y recién al enviar se le rechazaba.                                                                                                                                                                          | La pantalla lo avisa antes del formulario y remite a la ficha para editarlo.                                                                                                            |

## Despliegue y manual

| #   | Defecto                                                                                                                                                                                | Corrección                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | `migrate.mjs` no ejecutaba `add_jobcandidate_name_columns.sql`: una base migrada desde cero no tenía `firstname`/`lastname` y el módulo de candidatos fallaba.                         | Se agregó como paso 5 del script.                                                                                                                  |
| M2  | Ese script solo creaba las columnas; los nombres de los 13 candidatos migrados se habían cargado a mano en la base compartida. Desde cero, ningún candidato migrado podía contratarse. | El script completa los nombres desde el XML del currículum, solo donde están en `NULL`. Contrastado contra la base compartida: coincide en los 13. |
| M3  | El README remitía a `docs/migration.md`, que no existe (está en `migration/docs/migration.md`).                                                                                        | Enlace corregido.                                                                                                                                  |
| M4  | La documentación no advertía que, dentro de los contenedores de la migración, `localhost` no es el equipo.                                                                             | Documentado `host.docker.internal` en el manual y en la guía de migración.                                                                         |
| M5  | No había forma documentada de obtener un SQL Server con AdventureWorks para migrar desde cero.                                                                                         | El manual incluye levantarlo en Docker y restaurar el respaldo oficial.                                                                            |
| M6  | `.env.example` sugería `npx auth secret` (descarga un paquete extra) y un `DATABASE_URL` con `?schema=public`, distinto del README.                                                    | Unificado con el comando de Node del manual.                                                                                                       |

## Consistencia de la base compartida

Consultas ejecutadas contra la base de Supabase el 28/09/2026:

| Comprobación                                                 | Resultado |
| ------------------------------------------------------------ | --------- |
| Empleados sin registro en `person.person`                    | 0         |
| Empleados sin historial salarial                             | 0         |
| Empleados sin asignación vigente                             | 0         |
| Empleados con más de una asignación abierta                  | 0         |
| Candidatos contratados que apuntan a un empleado inexistente | 0         |
| Candidatos migrados sin nombre                               | 0         |

Totales: 292 empleados, 300 asignaciones, 319 registros salariales y 14 candidatos. La diferencia con los conteos de una migración limpia (290 / 296 / 316 / 13) corresponde a las operaciones registradas desde la aplicación.

## Pendiente de verificación manual

- [ ] Recorrer en la URL de producción: login, catálogos, empleados, candidatos, contratación, cambio salarial, traslado y los cuatro reportes.
- [ ] Confirmar en Vercel que `DATABASE_URL` y `AUTH_SECRET` están definidas para _Production_.
- [ ] Confirmar que el último merge a `main` generó un despliegue de producción exitoso.
- [ ] Ejecutar el manual completo en un equipo limpio (camino B) y registrar aquí la fecha y cualquier omisión encontrada.
- [ ] Probar en un dispositivo móvil real las pantallas del ámbito.
- [ ] Probar la pérdida de sesión: borrar la cookie `authjs.session-token` con un formulario abierto y enviar.
