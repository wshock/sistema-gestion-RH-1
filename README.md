# SGRH — Sistema de Gestión de Recursos Humanos

Aplicación web para administrar la información de personal de **AdventureWorks**, la base de datos de muestra de Microsoft que modela una empresa ficticia de manufactura de bicicletas.

Proyecto académico. Equipo de 2 desarrolladores. Agosto – septiembre de 2026.

**URL de producción:** _pendiente de primer despliegue_ — se actualizará aquí en cuanto el proyecto quede desplegado en Vercel.

---

## El problema

AdventureWorks trae un modelo de datos de recursos humanos completo y poblado con datos reales (~290 empleados, 16 departamentos, historiales salariales y de asignación), pero **no incluye ninguna aplicación para operarlo**. Todo se consulta y modifica escribiendo SQL a mano.

Eso genera tres problemas concretos:

1. **Nadie sin conocimiento técnico puede trabajar.** Dar de alta un empleado o consultar cuánta gente hay por área requiere un desarrollador.
2. **El historial se destruye con facilidad.** Las tablas `EmployeePayHistory` y `EmployeeDepartmentHistory` están diseñadas para _acumular_ registros. Sin una capa de aplicación que lo imponga, un `UPDATE` mal hecho borra la trazabilidad de un empleado.
3. **Los procesos quedan a medias.** Contratar a alguien implica escribir en cinco tablas. Hecho manualmente, es fácil dejar la base inconsistente.

## La solución

Una capa de aplicación sobre la base que:

- Permite operar todo desde una interfaz, sin SQL.
- **Nunca sobrescribe historial**: los cambios de salario y de departamento se registran como filas nuevas, no como actualizaciones.
- Ejecuta los procesos multi-tabla **dentro de una transacción**, así que o pasa todo o no pasa nada.
- Expone reportes de gestión sobre los datos reales.

---

## Stack

|               |                          |
| ------------- | ------------------------ |
| Framework     | Next.js (App Router)     |
| Lenguaje      | TypeScript               |
| ORM           | Prisma                   |
| Base de datos | PostgreSQL               |
| Autenticación | Auth.js (credenciales)   |
| Validación    | Zod                      |
| Estilos       | Tailwind CSS + shadcn/ui |

---

## Modelo de datos

Los datos originales de AdventureWorks se **migran desde SQL Server a PostgreSQL**. No se generan datos ficticios: todo lo que ves en la app viene de la base original.

Se migran 8 tablas de los esquemas `HumanResources` y `Person`:

```
Employee                     Entidad central
Department                   Catálogo
Shift                        Catálogo
JobCandidate                 Candidatos a contratar
EmployeeDepartmentHistory    Histórico de asignaciones
EmployeePayHistory           Histórico salarial
BusinessEntity               Soporte (esquema Person)
Person                       Nombres del empleado (esquema Person)
```

Más una tabla propia, en esquema separado:

```
AppUser                      Credenciales de acceso al sistema
```

**Adaptaciones necesarias:** `OrganizationNode` (tipo `hierarchyid`, sin equivalente en PostgreSQL) se migra como texto y no se usa. `JobCandidate.Resume` pasa de XML a texto plano.

---

## Qué hace el sistema

**Un solo rol:** administrador de RRHH. Todo detrás de login.

### Catálogos

CRUD de departamentos y turnos. No se puede eliminar uno que tenga empleados asignados (ni vigentes ni históricos).

### Empleados

Listado paginado con búsqueda y filtros. Ficha de detalle con datos, asignación vigente, salario actual e historiales completos. Alta, edición y baja lógica.

> La edición de empleado **no incluye salario ni departamento**. Esos se cambian por sus procesos dedicados, para que siempre quede historial.

### Candidatos

CRUD de aspirantes, con su currículum en texto.

### Procesos de negocio

El núcleo del proyecto. Los tres son transaccionales:

| Proceso             | Qué hace                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Contratación**    | Convierte un candidato en empleado: crea `BusinessEntity` → `Person` → `Employee`, registra su asignación inicial y su salario inicial, y marca el candidato como contratado. Cinco tablas, una transacción. |
| **Cambio salarial** | Inserta una fila nueva en `EmployeePayHistory`. El salario vigente es siempre el de fecha más reciente. Nunca se sobrescribe.                                                                                |
| **Traslado**        | Cierra la asignación actual poniendo su `EndDate` y abre una nueva. El empleado conserva toda su trayectoria.                                                                                                |

### Reportes

Headcount por departamento, distribución por turno, salario promedio por área, antigüedad del personal y estado de candidatos. Formato tabular.

---

## Arquitectura

Separación en cuatro capas. El acceso a datos está confinado a la última.

```
Presentación    Componentes de React, formularios, vistas
     ↓
Acciones        Server Actions: reciben input, validan, delegan
     ↓
Servicios       Lógica de negocio: transacciones, reglas de dominio
     ↓
Datos           Cliente de Prisma. Nadie más consulta la BD.
```

**Reglas que el código debe respetar:**

- Ninguna capa fuera de la de datos invoca Prisma directamente.
- Toda escritura multi-tabla va dentro de una transacción.
- Los esquemas de Zod se definen una vez y se comparten entre cliente y servidor.
- La validación de servidor es obligatoria, independiente de la de cliente.
- Los registros de historial se insertan, nunca se actualizan ni se borran.

---

## Roadmap

| Entrega | Fecha  | Contenido                                                                       |
| ------- | ------ | ------------------------------------------------------------------------------- |
| 1       | 12 ago | Migración de la BD, modelo Prisma, autenticación, CRUD de catálogos, despliegue |
| 2       | 26 ago | Consulta y mantenimiento de empleados, gestión de candidatos                    |
| 3       | 16 sep | Contratación, cambio salarial y traslado — los procesos transaccionales         |
| 4       | 30 sep | Reportes, estabilización y documentación                                        |

---

## Puesta en marcha

> **El equipo comparte una única base en Supabase**, ya migrada y con el
> usuario administrador creado. Si te estás incorporando al proyecto,
> **no vuelvas a correr `migration/migrate.mjs` ni `npm run seed`**: eso
> ya se hizo una vez contra esa base. Pedile a un integrante del equipo
> la cadena de conexión real (`DATABASE_URL`) por un canal seguro —nunca
> por git ni por chat en texto plano, `.env` está en `.gitignore` a
> propósito— y usá los pasos 1, 2 y 4 de abajo. Los pasos 3 y 5 son solo
> para levantar una base nueva desde cero (por ejemplo, en un entorno de
> pruebas separado).

```bash
# 1. Dependencias (dispara `prisma generate` vía postinstall)
npm install

# 2. Variables de entorno
cp .env.example .env
# DATABASE_URL: pedir la cadena de conexión real de Supabase a otro
# integrante del equipo. No inventar una conexión local: es una base
# compartida, ya migrada.
#
# AUTH_SECRET: cada desarrollador genera el suyo, no necesita coincidir
# con el de nadie más porque solo firma las cookies de su propio
# servidor local. No puede quedar vacío o Auth.js responde 500
# (MissingSecret) en todo el flujo de sesión:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# Si se cambia una variable con el servidor levantado, hay que reiniciarlo y
# borrar .next: Turbopack cachea el valor anterior en los chunks compilados.
#
# SEED_ADMIN_*: no hace falta completarlos con datos reales si no vas a
# correr `npm run seed` (el admin ya existe en la base compartida).

# 3. [Solo para una base nueva, no para unirse a la compartida] Migrar
#    los datos de AdventureWorks a PostgreSQL
export MSSQL_URI="mssql://usuario:password@host:1433/AdventureWorks2022"
export PG_URI="postgresql://usuario:password@host:5432/postgres"
node migration/migrate.mjs
# (Ver docs/migration.md para más detalles)

# 4. Aplicar migraciones de Prisma pendientes (seguro incluso si ya están
#    todas aplicadas: Prisma lleva el registro en `_prisma_migrations` y
#    no repite las que ya corrieron)
npx prisma migrate deploy

# 5. [Solo para una base nueva] Crear el usuario administrador inicial
npm run seed

# 6. Levantar
npm run dev
```

Los pasos 3-5 son independientes entre sí: la migración de Prisma solo crea el esquema `app`, nunca toca las tablas de AdventureWorks (ver [`src/data/README.md`](./src/data/README.md)). Ya con el usuario creado, el acceso es por `/login`.

---

## Despliegue

La aplicación se despliega en **Vercel**, conectado directamente al repositorio de GitHub.

- **Producción:** cada push/merge a `main` dispara automáticamente un nuevo despliegue de producción.
- **Preview:** cada pull request recibe su propio despliegue de preview con una URL única, útil para revisar una entrega antes de mergear.
- Las variables de entorno (`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`) se configuran en Vercel → Project Settings → Environment Variables, nunca en el repositorio.
- La base de datos PostgreSQL es un servicio externo administrado (fuera de Vercel); solo su cadena de conexión vive en `DATABASE_URL`.

---

## Fuera de alcance (por el momento)

Para evitar malentendidos, esto **no** forma parte del proyecto: cálculo de nómina o impuestos, portal de autoservicio del empleado, múltiples roles o permisos granulares, notificaciones por correo, flujo de aprobación de vacaciones, gráficos o dashboards visuales, exportación a PDF/Excel, carga de archivos, jerarquía de supervisión (`OrganizationNode`), app móvil nativa e internacionalización.

---
