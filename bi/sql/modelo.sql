-- Modelo en estrella para el reporte de gestión de personal.
-- Misma regla que los reportes de la app:
--   activo            = employee.currentflag
--   asignación vigente = EmployeeDepartmentHistory.enddate nulo
--                        (si hay más de una abierta, la de startdate más reciente)
--   salario vigente   = EmployeePayHistory de ratechangedate más reciente
--   antigüedad        = años cumplidos con age(CURRENT_DATE, hiredate)
--
-- Ejecutar contra la base PostgreSQL del SGRH:
--   psql "$DATABASE_URL" -f bi/sql/modelo.sql

CREATE SCHEMA IF NOT EXISTS bi;

CREATE OR REPLACE VIEW bi.dim_departamento AS
SELECT d.departmentid          AS departamento_id,
       d.name                  AS departamento,
       d.groupname             AS grupo
FROM humanresources.department d;

CREATE OR REPLACE VIEW bi.dim_turno AS
SELECT s.shiftid                              AS turno_id,
       s.name                                 AS turno,
       to_char(s.starttime, 'HH24:MI')        AS hora_inicio,
       to_char(s.endtime, 'HH24:MI')          AS hora_fin,
       (s.endtime <= s.starttime)             AS cruza_medianoche
FROM humanresources.shift s;

CREATE OR REPLACE VIEW bi.dim_empleado AS
SELECT e.businessentityid                                        AS empleado_id,
       p.firstname                                                AS nombre,
       p.lastname                                                 AS apellido,
       p.firstname || ' ' || p.lastname                          AS nombre_completo,
       e.jobtitle                                                 AS cargo,
       e.gender                                                   AS genero,
       e.maritalstatus                                            AS estado_civil,
       e.hiredate                                                 AS fecha_contratacion,
       e.birthdate                                                AS fecha_nacimiento,
       e.salariedflag                                             AS asalariado,
       e.currentflag                                              AS activo,
       CASE WHEN e.currentflag THEN 'Activo' ELSE 'Inactivo' END AS estado,
       EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int      AS anios_antiguedad,
       CASE
         WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 5  THEN 'Menos de 5 años'
         WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 10 THEN '5 a 9 años'
         WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 15 THEN '10 a 14 años'
         WHEN EXTRACT(YEAR FROM age(CURRENT_DATE, e.hiredate))::int < 20 THEN '15 a 19 años'
         ELSE '20 años o más'
       END                                                        AS tramo_antiguedad
FROM humanresources.employee e
JOIN person.person p ON p.businessentityid = e.businessentityid;

CREATE OR REPLACE VIEW bi.dim_fecha AS
SELECT d::date                         AS fecha,
       EXTRACT(YEAR FROM d)::int       AS anio,
       EXTRACT(MONTH FROM d)::int      AS mes,
       (ARRAY[
         'enero','febrero','marzo','abril','mayo','junio',
         'julio','agosto','septiembre','octubre','noviembre','diciembre'
       ])[EXTRACT(MONTH FROM d)::int]  AS nombre_mes,
       EXTRACT(QUARTER FROM d)::int    AS trimestre
FROM generate_series(
       (SELECT min(hiredate) FROM humanresources.employee),
       (CURRENT_DATE + INTERVAL '1 year')::date,
       INTERVAL '1 day'
     ) AS d;

-- Una fila por empleado activo: grano de las tarjetas de KPI.
CREATE OR REPLACE VIEW bi.fact_plantilla AS
WITH asignacion_vigente AS (
  SELECT DISTINCT ON (businessentityid)
         businessentityid,
         departmentid,
         shiftid,
         startdate
  FROM humanresources.employeedepartmenthistory
  WHERE enddate IS NULL
  ORDER BY businessentityid, startdate DESC
),
salario_vigente AS (
  SELECT DISTINCT ON (businessentityid)
         businessentityid,
         ratechangedate,
         rate,
         payfrequency
  FROM humanresources.employeepayhistory
  ORDER BY businessentityid, ratechangedate DESC
)
SELECT e.businessentityid                         AS empleado_id,
       av.departmentid                            AS departamento_id,
       av.shiftid                                 AS turno_id,
       e.hiredate                                 AS fecha_contratacion,
       sv.ratechangedate::date                    AS fecha_salario,
       sv.rate                                    AS tarifa_vigente,
       sv.payfrequency                            AS frecuencia_pago,
       (sv.rate IS NULL)                          AS sin_historial_salarial,
       (av.departmentid IS NULL)                  AS sin_asignacion,
       1                                          AS empleados
FROM humanresources.employee e
LEFT JOIN asignacion_vigente av ON av.businessentityid = e.businessentityid
LEFT JOIN salario_vigente sv ON sv.businessentityid = e.businessentityid
WHERE e.currentflag = true;

-- Historial de asignación. Una fila cerrada (fecha_fin no nula) es un traslado consumado.
CREATE OR REPLACE VIEW bi.fact_asignacion AS
SELECT edh.businessentityid          AS empleado_id,
       edh.departmentid              AS departamento_id,
       edh.shiftid                   AS turno_id,
       edh.startdate                 AS fecha_inicio,
       edh.enddate                   AS fecha_fin,
       (edh.enddate IS NULL)         AS vigente
FROM humanresources.employeedepartmenthistory edh;

-- Historial salarial. es_cambio distingue el alta inicial de un aumento posterior.
CREATE OR REPLACE VIEW bi.fact_salario AS
SELECT ph.businessentityid                              AS empleado_id,
       ph.ratechangedate::date                          AS fecha,
       ph.rate                                          AS tarifa,
       ph.payfrequency                                  AS frecuencia_pago,
       (ph.ratechangedate::date > e.hiredate)           AS es_cambio
FROM humanresources.employeepayhistory ph
JOIN humanresources.employee e ON e.businessentityid = ph.businessentityid;

-- Pendiente = businessentityid nulo. Misma regla que el módulo de candidatos.
CREATE OR REPLACE VIEW bi.fact_candidato AS
SELECT jc.jobcandidateid                                              AS candidato_id,
       jc.businessentityid                                            AS empleado_id,
       CASE
         WHEN jc.businessentityid IS NULL THEN 'Pendiente'
         ELSE 'Contratado'
       END                                                            AS estado,
       COALESCE(jc.firstname || ' ' || jc.lastname, '(sin nombre)')   AS nombre
FROM humanresources.jobcandidate jc;
