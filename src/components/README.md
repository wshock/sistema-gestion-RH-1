# Componentes (Presentación)

Componentes de React sin dueño de dominio, de menor a mayor especificidad:

- `ui/` — primitivos generados por shadcn/ui sobre Base UI. No se editan a mano salvo necesidad puntual y **nunca** contienen nombres de dominio: si un componente se llama `EmployeeTable`, no va acá.
- `layout/` — armazón de la aplicación: `AppShell`, cabecera, navegación, cambio de tema.
- `shared/` — componentes propios pero genéricos, reutilizables por cualquier módulo (tablas, diálogos, paginadores). No importan nada de un módulo concreto.
- `auth/` — el formulario de inicio de sesión. Autenticación no se migró a feature.

> Los componentes atados a un dominio viven en `src/features/<módulo>/components/`. Si un componente menciona una entidad del negocio, ese es su sitio.

Junto con `src/app`, esta carpeta forma la capa de **Presentación**: solo renderiza UI y llama a las Server Actions. No importa nada de `data/` ni de `services/`.

## Qué hay en `shared/`

Son la base sobre la que se arman los módulos siguientes. Ninguno conoce una entidad concreta: si hace falta tocarlos para que acepten un caso nuevo, se generalizan, no se copian.

| Componente      | Para qué                                                                                       | Estados que resuelve                            |
| --------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `DataTable`     | Listado tabular. Recibe `columnas` y `filas`; cada columna decide cómo pintar su celda.        | Carga, vacío y error                            |
| `FormDialog`    | Alta y edición en modal. Aporta cabecera, `<form>` y pie; los campos entran como `children`.   | Envío en curso                                  |
| `ConfirmDialog` | Confirmación de acciones irreversibles.                                                        | Operación en curso, y se queda abierto si falla |
| `FormField`     | Etiqueta, control y error de un campo, con el cableado de accesibilidad ya resuelto.           | Error por campo                                 |
| `SearchInput`   | Buscador de listados. Escribe el término en el parámetro `q` de la URL, con retardo.           | Búsqueda en curso                               |
| `Pagination`    | Paginador por enlaces, sin JavaScript de cliente. Recibe la ruta y los parámetros a conservar. | Sin resultados                                  |
| `StatusPage`    | Pantallas de 401, 403 y sesión expirada.                                                       | —                                               |

Las notificaciones de resultado son [Sonner](https://sonner.emilkowal.ski/): `toast.success(…)` / `toast.error(…)`. El `<Toaster />` ya está montado en el layout raíz, no hace falta añadirlo por página.

Los módulos `features/departamentos` y `features/turnos` son los ejemplos de referencia: entre los dos usan todos, y son casi idénticos salvo por los campos propios de cada entidad. Si al construir un módulo nuevo hace falta copiar uno de estos componentes para cambiarle un detalle, lo correcto es generalizar el compartido, no duplicarlo.

Por defecto son Server Components. `"use client"` se añade solo cuando hace falta interactividad real (estado, efectos, manejadores de eventos), y lo más abajo posible en el árbol para que el resto siga renderizándose en el servidor.
