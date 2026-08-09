# Acciones

Server Actions (`"use server"`). Es el puente entre la presentación y los servicios.

**Responsabilidad de cada action:**

1. Recibir el input (típicamente `FormData` o un objeto tipado).
2. Validarlo contra el esquema de Zod correspondiente en `src/schemas`.
3. Delegar la lógica al servicio adecuado.
4. Traducir el resultado (o el error) a algo que la UI pueda consumir.

**Regla:** no contiene lógica de negocio ni llama a Prisma directamente.
