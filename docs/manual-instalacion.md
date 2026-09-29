# Manual de instalación y ejecución local

Guía para poner en marcha SGRH desde cero en un equipo limpio, sin asistencia del equipo. Cubre la migración de AdventureWorks, la configuración, la carga del usuario inicial y la ejecución.

Hay dos caminos:

| Camino                 | Cuándo                                                                            | Pasos         |
| ---------------------- | --------------------------------------------------------------------------------- | ------------- |
| **A. Base ya migrada** | Se dispone de la cadena de conexión a una base ya migrada (p. ej. la de Supabase) | 1, 2, 6, 7, 9 |
| **B. Desde cero**      | Base PostgreSQL vacía; hay que migrar AdventureWorks                              | 1 a 9         |

---

## Requisitos

| Herramienta                   | Versión          | Para qué                                                         |
| ----------------------------- | ---------------- | ---------------------------------------------------------------- |
| Node.js                       | 22.12 o superior | Ejecutar la aplicación (ver `engines` en `package.json`)         |
| npm                           | el que trae Node | Instalar dependencias                                            |
| Git                           | cualquiera       | Clonar el repositorio                                            |
| Docker Desktop (en ejecución) | cualquiera       | Solo camino B: corre `pgloader`, `psql`, SQL Server y PostgreSQL |

No hace falta instalar PostgreSQL, SQL Server, `pgloader` ni `psql` en el equipo: en el camino B todos corren en contenedores.

---

## 1. Clonar e instalar dependencias

```bash
git clone https://github.com/hannerco/sistema-gestion-RH.git
cd sistema-gestion-RH
npm install
```

`npm install` ejecuta `prisma generate` (script `postinstall`) y genera el cliente tipado en `src/generated/prisma`. Si ese paso falla, la aplicación no compila.

## 2. Variables de entorno

```bash
cp .env.example .env        # PowerShell: Copy-Item .env.example .env
```

| Variable              | Obligatoria       | Descripción                                                                                                                          |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`        | Sí                | Cadena de conexión PostgreSQL. En Supabase, usar la del **Session pooler** (puerto `5432`), que también sirve para `prisma migrate`. |
| `AUTH_SECRET`         | Sí                | Secreto con el que Auth.js firma la cookie de sesión. Vacío → error 500 (`MissingSecret`) en todo el flujo de login.                 |
| `AUTH_URL`            | Fuera de Vercel   | URL base de la app. En local: `http://localhost:3000`. En Vercel no hace falta.                                                      |
| `SEED_ADMIN_EMAIL`    | Solo para el seed | Correo del usuario administrador inicial.                                                                                            |
| `SEED_ADMIN_PASSWORD` | Solo para el seed | Contraseña del administrador. Se guarda hasheada con bcrypt.                                                                         |
| `SEED_ADMIN_NAME`     | Solo para el seed | Nombre visible del administrador.                                                                                                    |

Para generar `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

> Si se cambia una variable con el servidor levantado, hay que detenerlo, borrar la carpeta `.next` y volver a levantarlo: Turbopack cachea el valor anterior.

En el camino A basta con completar `DATABASE_URL` y `AUTH_SECRET`; seguir en el paso 6.

## 3. PostgreSQL de destino (camino B)

Cualquier PostgreSQL 16 sirve. Dos opciones:

**Supabase** (lo usado en producción): crear un proyecto y copiar la cadena de _Session pooler_ desde _Connect_. Esa misma cadena va en `PG_URI` (paso 5) y en `DATABASE_URL`.

**Local con Docker:**

```bash
docker run -d --name sgrh-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
```

Con esta opción:

- `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"` (la app corre en el equipo).
- `PG_URI="postgresql://postgres:postgres@host.docker.internal:5432/postgres"` (la migración corre **dentro** de contenedores, donde `localhost` es el propio contenedor). En Linux, agregar `--add-host=host.docker.internal:host-gateway` o usar la IP del equipo.

## 4. SQL Server de origen con AdventureWorks (camino B)

Si no se dispone ya de un SQL Server con `AdventureWorks2022` restaurada:

```bash
docker run -d --name sgrh-mssql -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD='Sgrh.Passw0rd' \
  -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
```

Descargar el respaldo `AdventureWorks2022.bak` desde las [releases oficiales de Microsoft](https://github.com/Microsoft/sql-server-samples/releases/tag/adventureworks), copiarlo al contenedor y restaurarlo:

```bash
docker cp AdventureWorks2022.bak sgrh-mssql:/var/opt/mssql/data/
docker exec sgrh-mssql /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P 'Sgrh.Passw0rd' -C -Q \
  "RESTORE DATABASE AdventureWorks2022 FROM DISK='/var/opt/mssql/data/AdventureWorks2022.bak' \
   WITH MOVE 'AdventureWorks2022' TO '/var/opt/mssql/data/AdventureWorks2022.mdf', \
        MOVE 'AdventureWorks2022_log' TO '/var/opt/mssql/data/AdventureWorks2022_log.ldf'"
```

## 5. Migrar AdventureWorks a PostgreSQL (camino B)

Con Docker Desktop en ejecución:

```bash
# bash / macOS / Linux
export MSSQL_URI="mssql://sa:Sgrh.Passw0rd@host.docker.internal:1433/AdventureWorks2022"
export PG_URI="postgresql://postgres:postgres@host.docker.internal:5432/postgres"
node migration/migrate.mjs
```

```powershell
# Windows PowerShell
$env:MSSQL_URI="mssql://sa:Sgrh.Passw0rd@host.docker.internal:1433/AdventureWorks2022"
$env:PG_URI="postgresql://postgres:postgres@host.docker.internal:5432/postgres"
node migration/migrate.mjs
```

El script carga las 8 tablas, crea claves primarias y foráneas, ajusta las secuencias y agrega nombre y apellido a los candidatos. Termina con `==> Migración completa.`; cualquier otro final indica en qué paso falló. Es idempotente: se puede volver a correr. El detalle de cada paso y las consultas de verificación están en [`migration/docs/migration.md`](../migration/docs/migration.md).

## 6. Esquema propio de la aplicación

```bash
npx prisma migrate deploy
```

Crea el esquema `app` (tabla de usuarios) y habilita la extensión `unaccent` para las búsquedas. No toca las tablas de AdventureWorks. En el camino A es seguro correrlo aunque ya esté aplicado.

## 7. Usuario administrador (camino B, o si no se tiene usuario)

Completar `SEED_ADMIN_*` en `.env` y ejecutar:

```bash
npm run seed
```

Es idempotente: si el correo ya existe, actualiza su nombre y contraseña.

## 8. Verificar los datos (camino B)

Tras una migración recién hecha, estos conteos deben coincidir (los de la base de producción son mayores porque incluyen lo registrado desde la aplicación):

| Tabla                                      | Filas |
| ------------------------------------------ | ----- |
| `humanresources.department`                | 16    |
| `humanresources.employee`                  | 290   |
| `humanresources.employeedepartmenthistory` | 296   |
| `humanresources.employeepayhistory`        | 316   |
| `humanresources.jobcandidate`              | 13    |
| `humanresources.shift`                     | 3     |

## 9. Ejecutar

```bash
npm run dev                  # desarrollo, http://localhost:3000
```

Para probar el build de producción:

```bash
npm run build
npm start
```

Entrar en `/login` con el usuario del paso 7. Recorrido mínimo para confirmar que todo funciona:

1. **Reportes** muestra los totales generales (290 empleados activos tras una migración limpia).
2. **Empleados** lista, busca y filtra.
3. **Candidatos → Contratar** a un candidato pendiente crea el empleado y redirige a su ficha.
4. **Procesos** registra un cambio salarial y un traslado.

---

## Problemas frecuentes

| Síntoma                                                        | Causa y solución                                                                                                     |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Error 500 `MissingSecret` al entrar                            | `AUTH_SECRET` vacío. Completarlo y reiniciar borrando `.next`.                                                       |
| `pgloader` no conecta con SQL Server o PostgreSQL              | Dentro del contenedor `localhost` no es el equipo. Usar `host.docker.internal` en `MSSQL_URI` y `PG_URI`.            |
| `EMAXCONNSESSION max clients reached` con Supabase             | Se agotaron las conexiones del Session pooler. Cerrar otros servidores locales apuntando a la misma base.            |
| `column jobcandidate.firstname does not exist`                 | La base se migró con una versión anterior del script. Volver a correr `node migration/migrate.mjs` (es idempotente). |
| `duplicate key value violates unique constraint` al crear algo | Secuencias sin ajustar. Volver a correr la migración; el paso 4 las corrige.                                         |
| Cambié `.env` y la app sigue usando el valor viejo             | Detener el servidor, borrar `.next` y volver a levantarlo.                                                           |

## Despliegue

Producción corre en Vercel, conectado al repositorio: cada merge a `main` despliega automáticamente y cada pull request recibe una URL de preview. En Vercel → _Project Settings → Environment Variables_ deben estar `DATABASE_URL` y `AUTH_SECRET` (`AUTH_URL` no es necesaria allí). La URL pública figura en el [README](../README.md).
