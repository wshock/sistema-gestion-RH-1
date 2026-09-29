# Revisión de ficha y pantallas de proceso (HU-47)

Revisión integral del ámbito de Dev B: ficha del empleado, alta y edición, cambio salarial, traslado y reporte de compensación. Complementa [`revision-robustez.md`](./revision-robustez.md) (ámbito Dev A).

## Criterios revisados

| Aspecto | Resultado |
| --- | --- |
| Errores en lenguaje de negocio | Correcto: acciones y servicios ya devolvían `Result`. La ficha ante fallo inesperado no dejaba enlace para volver (D1). |
| Estados de carga | Faltaban en ficha, alta, edición, salario y traslado (D2). El listado y compensación ya los tenían. |
| Vacío distinto de error | Correcto: historiales usan `DataTable` con mensaje de vacío propio. |
| Confirmación de procesos | Baja ya pasaba por `ConfirmDialog`. Cambio salarial y traslado enviaban al primer clic (D3). |
| Resultado inequívoco | Correcto: toast de éxito/error y redirección a la ficha tras registrar. |
| Envío duplicado | Correcto: `isSubmitting` / `confirmando` deshabilitan botones. |
| Validación junto al campo | Correcto: `FormField` + `fieldErrors` del servidor. |
| Pérdida de sesión | Baja ya usaba `redirectIfSessionExpired`. Alta, edición, salario y traslado solo mostraban toast (D4). |
| Responsive | Acciones de la ficha ya tenían `flex-wrap`. Formularios en grilla `sm:grid-cols-2`. |

## Defectos encontrados y corregidos

| # | Pantalla | Defecto | Corrección |
| --- | --- | --- | --- |
| D1 | Ficha del empleado | Un fallo inesperado se mostraba como párrafo suelto, sin forma de volver al listado. | Se conserva el enlace «Volver al listado». |
| D2 | Ficha, alta, edición, salario, traslado | Sin `loading.tsx`: al navegar, la pantalla anterior quedaba congelada. | Esqueletos de carga en las cinco rutas. |
| D3 | Cambio salarial y traslado | Un clic en «Registrar» ejecutaba la operación de historial sin confirmación. | Diálogo de confirmación con el resumen (tarifa/destino) antes de llamar a la Server Action. |
| D4 | Alta, edición, salario, traslado | Si la sesión expiraba al guardar, solo se veía un toast: el usuario seguía en una pantalla inutilizable. | `redirectIfSessionExpired` lleva al login con `motivo=sesion-expirada` y `redirectTo`. |

## Ya correcto (sin cambio)

- Historiales vacíos vs error en la ficha.
- Baja/reactivación con `ConfirmDialog` y bloqueo mientras corre.
- Toasts de éxito/error en todas las escrituras del ámbito.
- Botones deshabilitados durante el envío.
- Errores de Zod pintados bajo el campo.
- Compensación: `loading.tsx`, mensajes de vacío/error en la tabla.

## Pendiente de verificación manual

- [ ] Recorrer en producción: ficha, alta, edición, cambio salarial, traslado y compensación.
- [ ] Probar confirmación: cancelar el diálogo no debe escribir en la base.
- [ ] Borrar la cookie con el formulario de salario/traslado abierto y confirmar: debe ir al login con aviso.
- [ ] Revisar la ficha en un teléfono real (acciones y dos historiales).
