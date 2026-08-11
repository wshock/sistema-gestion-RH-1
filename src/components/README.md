# Componentes (Presentación)

Componentes de React reutilizables, organizados en cuatro niveles de menor a mayor especificidad:

- `ui/` — primitivos generados por shadcn/ui sobre Base UI. No se editan a mano salvo necesidad puntual y **nunca** contienen nombres de dominio: si un componente se llama `EmployeeTable`, no va acá.
- `layout/` — armazón de la aplicación: `AppShell`, cabecera, navegación, cambio de tema.
- `shared/` — componentes propios pero genéricos, reutilizables por cualquier módulo (páginas de estado, tablas, paginadores). No importan nada de un módulo concreto.
- `<módulo>/` (`auth/`, `departments/`, …) — componentes atados a un dominio: formularios, tablas y diálogos de ese módulo.

Junto con `src/app`, esta carpeta forma la capa de **Presentación**: solo renderiza UI y llama a `src/actions`. No importa nada de `src/data` ni de `src/services`.

## Qué hay en `shared/`

Son la base sobre la que se arman los módulos siguientes. Ninguno conoce una entidad concreta: si hace falta tocarlos para que acepten un caso nuevo, se generalizan, no se copian.

| Componente      | Para qué                                                                                     | Estados que resuelve                            |
| --------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `DataTable`     | Listado tabular. Recibe `columnas` y `filas`; cada columna decide cómo pintar su celda.      | Carga, vacío y error                            |
| `FormDialog`    | Alta y edición en modal. Aporta cabecera, `<form>` y pie; los campos entran como `children`. | Envío en curso                                  |
| `ConfirmDialog` | Confirmación de acciones irreversibles.                                                      | Operación en curso, y se queda abierto si falla |
| `FormField`     | Etiqueta, control y error de un campo, con el cableado de accesibilidad ya resuelto.         | Error por campo                                 |
| `StatusPage`    | Pantallas de 401, 403 y sesión expirada.                                                     | —                                               |

Las notificaciones de resultado son [Sonner](https://sonner.emilkowal.ski/): `toast.success(…)` / `toast.error(…)`. El `<Toaster />` ya está montado en el layout raíz, no hace falta añadirlo por página.

El módulo de departamentos (`departments/`) es el ejemplo de referencia: usa `DataTable`, `FormDialog`, `ConfirmDialog`, `FormField` y las notificaciones, los cinco en un caso real.

Por defecto son Server Components. `"use client"` se añade solo cuando hace falta interactividad real (estado, efectos, manejadores de eventos), y lo más abajo posible en el árbol para que el resto siga renderizándose en el servidor.
