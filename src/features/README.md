# Features

Un módulo de dominio por carpeta, con dentro solo las capas que necesite:

```
features/<módulo>/
  types.ts        Tipos del dominio, cuando los comparten varias piezas
  schemas.ts      Esquemas de Zod (validación cliente + servidor)
  data/           Consultas a la base
  services/       Reglas de negocio
  actions/        Server Actions
  components/     Componentes atados a este dominio
```

Las cuatro capas de la arquitectura y sus reglas **no cambian** (ver [README del proyecto](../../README.md#arquitectura)); cambia el criterio de agrupación: de tipo de archivo a módulo de dominio. Esto es lo previsto en [CONVENTIONS.md](../../CONVENTIONS.md) para la entrega 2.

## Qué NO vive acá

| Sigue en                               | Qué                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `src/data/prisma.ts`                   | El cliente de Prisma. Es infraestructura, no un dominio                    |
| `src/lib/`                             | Utilidades que cruzan módulos: `result`, `session`, `referencias`, `utils` |
| `src/components/{ui,shared,layout}/`   | Primitivos, componentes genéricos y armazón de la aplicación               |
| `src/app/`                             | Las rutas. Una página importa de su feature, no al revés                   |
| `src/{actions,services,schemas,data}/` | Lo de autenticación, que no se migró a feature                             |

## Reglas entre módulos

- **Un módulo no importa de otro.** Si dos lo necesitan, el código sube a `src/lib/` o a `src/components/shared/`. `lib/referencias.ts` es el ejemplo: departamentos y turnos comparten la regla de bloqueo por integridad referencial.
- **La dirección de las dependencias no cambia**: `app/` → `components/` → `actions/` → `services/` → `data/`. Ninguna capa fuera de `data/` invoca Prisma.
- **Un módulo repartido entre dos personas necesita un contrato escrito** antes de empezar: qué archivos son de cada quién y qué tipos comparten.
