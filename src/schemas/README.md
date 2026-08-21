# Schemas

> Desde la entrega 2 los esquemas de cada dominio viven en `src/features/<módulo>/schemas.ts`. Acá queda solo lo de autenticación, que no se migró a feature.

Esquemas de Zod compartidos entre cliente y servidor. Se definen una sola vez y se importan tanto desde los formularios (validación en cliente) como desde las Server Actions (validación en servidor, obligatoria e independiente de la del cliente).
