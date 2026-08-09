# Componentes (Presentación)

Componentes de React reutilizables. `ui/` contiene los primitivos generados por shadcn/ui (no se editan a mano salvo necesidad puntual); el resto son componentes propios del dominio (formularios, tablas, layouts de sección).

Junto con `src/app`, esta carpeta forma la capa de **Presentación**: solo renderiza UI y llama a `src/actions`. No importa nada de `src/data` ni de `src/services`.
