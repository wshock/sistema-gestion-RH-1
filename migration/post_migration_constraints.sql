-- =====================================================================
-- post_migration_constraints.sql
--
-- Se ejecuta DESPUÉS de la carga de datos con pgloader.
-- pgloader (driver MSSQL) no siempre traduce correctamente las
-- primary keys clustered de SQL Server, lo que impide crear las FKs
-- automáticamente. Este script las crea de forma explícita e idempotente
-- (se puede ejecutar varias veces sin error).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PRIMARY KEYS
-- ---------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_businessentity_businessentityid'
    ) THEN
        ALTER TABLE person.businessentity
            ADD CONSTRAINT pk_businessentity_businessentityid
            PRIMARY KEY (businessentityid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_person_businessentityid'
    ) THEN
        ALTER TABLE person.person
            ADD CONSTRAINT pk_person_businessentityid
            PRIMARY KEY (businessentityid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_department_departmentid'
    ) THEN
        ALTER TABLE humanresources.department
            ADD CONSTRAINT pk_department_departmentid
            PRIMARY KEY (departmentid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_shift_shiftid'
    ) THEN
        ALTER TABLE humanresources.shift
            ADD CONSTRAINT pk_shift_shiftid
            PRIMARY KEY (shiftid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_employee_businessentityid'
    ) THEN
        ALTER TABLE humanresources.employee
            ADD CONSTRAINT pk_employee_businessentityid
            PRIMARY KEY (businessentityid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_employeedepartmenthistory'
    ) THEN
        ALTER TABLE humanresources.employeedepartmenthistory
            ADD CONSTRAINT pk_employeedepartmenthistory
            PRIMARY KEY (businessentityid, startdate, departmentid, shiftid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_employeepayhistory'
    ) THEN
        ALTER TABLE humanresources.employeepayhistory
            ADD CONSTRAINT pk_employeepayhistory
            PRIMARY KEY (businessentityid, ratechangedate);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'pk_jobcandidate_jobcandidateid'
    ) THEN
        ALTER TABLE humanresources.jobcandidate
            ADD CONSTRAINT pk_jobcandidate_jobcandidateid
            PRIMARY KEY (jobcandidateid);
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. FOREIGN KEYS (mismas 7 que pgloader no pudo crear)
-- ---------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_person_businessentity_businessentityid'
    ) THEN
        ALTER TABLE person.person
            ADD CONSTRAINT fk_person_businessentity_businessentityid
            FOREIGN KEY (businessentityid)
            REFERENCES person.businessentity (businessentityid)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_employee_person_businessentityid'
    ) THEN
        ALTER TABLE humanresources.employee
            ADD CONSTRAINT fk_employee_person_businessentityid
            FOREIGN KEY (businessentityid)
            REFERENCES person.person (businessentityid)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_employeedepartmenthistory_department_departmentid'
    ) THEN
        ALTER TABLE humanresources.employeedepartmenthistory
            ADD CONSTRAINT fk_employeedepartmenthistory_department_departmentid
            FOREIGN KEY (departmentid)
            REFERENCES humanresources.department (departmentid)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_employeedepartmenthistory_employee_businessentityid'
    ) THEN
        ALTER TABLE humanresources.employeedepartmenthistory
            ADD CONSTRAINT fk_employeedepartmenthistory_employee_businessentityid
            FOREIGN KEY (businessentityid)
            REFERENCES humanresources.employee (businessentityid)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_employeedepartmenthistory_shift_shiftid'
    ) THEN
        ALTER TABLE humanresources.employeedepartmenthistory
            ADD CONSTRAINT fk_employeedepartmenthistory_shift_shiftid
            FOREIGN KEY (shiftid)
            REFERENCES humanresources.shift (shiftid)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_employeepayhistory_employee_businessentityid'
    ) THEN
        ALTER TABLE humanresources.employeepayhistory
            ADD CONSTRAINT fk_employeepayhistory_employee_businessentityid
            FOREIGN KEY (businessentityid)
            REFERENCES humanresources.employee (businessentityid)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_jobcandidate_employee_businessentityid'
    ) THEN
        ALTER TABLE humanresources.jobcandidate
            ADD CONSTRAINT fk_jobcandidate_employee_businessentityid
            FOREIGN KEY (businessentityid)
            REFERENCES humanresources.employee (businessentityid)
            ON UPDATE NO ACTION ON DELETE NO ACTION;
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. Verificación rápida (opcional, para revisar manualmente)
-- ---------------------------------------------------------------------
-- SELECT conname, conrelid::regclass AS tabla, confrelid::regclass AS referencia
-- FROM pg_constraint
-- WHERE contype = 'f'
--   AND connamespace IN ('humanresources'::regnamespace, 'person'::regnamespace)
-- ORDER BY conrelid::regclass::text;
