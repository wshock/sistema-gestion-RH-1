# Componentes (Presentación)

Componentes de React reutilizables, organizados en cuatro niveles de menor a mayor especificidad:

- `ui/` — primitivos generados por shadcn/ui sobre Base UI. No se editan a mano salvo necesidad puntual y **nunca** contienen nombres de dominio: si un componente se llama `EmployeeTable`, no va acá.
- `layout/` — armazón de la aplicación: `AppShell`, cabecera, navegación, cambio de tema.
- `shared/` — componentes propios pero genéricos, reutilizables por cualquier módulo (páginas de estado, tablas, paginadores). No importan nada de un módulo concreto.
- `<módulo>/` (`auth/`, `departments/`, …) — componentes atados a un dominio: formularios, tablas y diálogos de ese módulo.

Junto con `src/app`, esta carpeta forma la capa de **Presentación**: solo renderiza UI y llama a `src/actions`. No importa nada de `src/data` ni de `src/services`.

Por defecto son Server Components. `"use client"` se añade solo cuando hace falta interactividad real (estado, efectos, manejadores de eventos), y lo más abajo posible en el árbol para que el resto siga renderizándose en el servidor.
