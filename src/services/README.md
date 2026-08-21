# Servicios

> Desde la entrega 2 los servicios de cada dominio viven en `src/features/<módulo>/services/`. Acá queda solo lo de autenticación, que no se migró a feature.

Lógica de negocio: reglas de dominio, orquestación de transacciones y todo lo que decide _qué_ debe pasar cuando se ejecuta un proceso (contratación, cambio salarial, traslado, etc.).

**Reglas:**

- Es la única capa (además de `datos`) que conoce el modelo de Prisma.
- Toda escritura que toque más de una tabla va dentro de `prisma.$transaction`.
- No importa nada de `next/server` ni recibe `FormData`: recibe y devuelve datos ya validados/tipados.
