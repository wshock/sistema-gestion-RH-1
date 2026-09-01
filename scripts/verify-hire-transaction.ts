/**
 * Verificación de atomicidad de la contratación (HU-33).
 *
 * Corre contra la base real: no hay entorno de test aparte. Cada escenario
 * usa su propio candidato descartable y limpia lo que crea.
 *
 * Ejecutar: npm run verify:hire
 */
import "dotenv/config";
import { prisma } from "@/data/prisma";
import * as hireData from "@/features/candidatos/data/hire";
import * as hireService from "@/features/candidatos/services/hire.service";
import type { HireCandidateInput } from "@/features/candidatos/schemas";

const INPUT_VALIDO: Omit<HireCandidateInput, "nationalIdNumber"> = {
  jobTitle: "QA Tester",
  birthDate: "1990-05-15",
  maritalStatus: "S",
  gender: "M",
  hireDate: "2026-01-10",
  departmentId: 7,
  shiftId: 1,
  rate: 40,
  payFrequency: 1,
};

// Fuera de rango de ids reales, pero dentro de smallint: fuerza una FK
// violation real, no un error de rango.
const ID_INEXISTENTE = 30000;

type Conteos = {
  businessEntity: number;
  person: number;
  employee: number;
  edh: number;
  eph: number;
};

async function contarTablas(): Promise<Conteos> {
  return {
    businessEntity: await prisma.businessEntity.count(),
    person: await prisma.person.count(),
    employee: await prisma.employee.count(),
    edh: await prisma.employeeDepartmentHistory.count(),
    eph: await prisma.employeePayHistory.count(),
  };
}

function iguales(a: Conteos, b: Conteos): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function crearCandidato(nombre: string) {
  return prisma.jobCandidate.create({
    data: { firstName: nombre, lastName: "Verificación", modifiedDate: new Date() },
  });
}

async function limpiarCandidato(jobCandidateId: number) {
  await prisma.jobCandidate.delete({ where: { jobCandidateId } }).catch(() => {});
}

let todoOk = true;

function reportar(nombre: string, condicion: boolean, detalle?: unknown) {
  console.log(`[${condicion ? "OK" : "FALLÓ"}] ${nombre}`, detalle ?? "");
  if (!condicion) todoOk = false;
}

/** Fallo justo después de crear BusinessEntity, antes de Person. */
async function escenario1() {
  const antes = await contarTablas();

  await prisma
    .$transaction(async (tx) => {
      await tx.businessEntity.create({ data: { modifiedDate: new Date() } });
      throw new Error("fallo forzado tras BusinessEntity");
    })
    .catch(() => {});

  const despues = await contarTablas();
  reportar(
    "1. Fallo tras BusinessEntity no deja registros",
    iguales(antes, despues),
    despues,
  );
}

/** Fallo en EmployeeDepartmentHistory: departamento inexistente. */
async function escenario2() {
  const candidato = await crearCandidato("Escenario2");
  const antes = await contarTablas();

  let fallo = false;
  try {
    await hireData.hireCandidate(
      candidato.jobCandidateId,
      { firstName: "Escenario2", lastName: "Verificación" },
      { ...INPUT_VALIDO, nationalIdNumber: "HU33-ESC2", departmentId: ID_INEXISTENTE },
    );
  } catch {
    fallo = true;
  }

  const despues = await contarTablas();
  const candidatoFinal = await prisma.jobCandidate.findUnique({
    where: { jobCandidateId: candidato.jobCandidateId },
  });

  reportar("2. La operación falla (departamento inexistente)", fallo);
  reportar("2. No queda Person/Employee creado", iguales(antes, despues), despues);
  reportar("2. El candidato sigue pendiente", candidatoFinal?.businessEntityId === null);

  await limpiarCandidato(candidato.jobCandidateId);
}

/** Fallo tardío: el candidato se vincula mientras el intento estaba en curso. */
async function escenario3() {
  const candidato = await crearCandidato("Escenario3");

  const primera = await hireService.hireCandidate(candidato.jobCandidateId, {
    ...INPUT_VALIDO,
    nationalIdNumber: "HU33-ESC3-A",
  });

  if (!primera.success) {
    reportar("3. Preparación (primera contratación)", false, primera);
    await limpiarCandidato(candidato.jobCandidateId);
    return;
  }

  const antes = await contarTablas();

  let fallo = false;
  try {
    // Salta el chequeo del servicio a propósito, como si otra operación
    // hubiese vinculado al candidato un instante antes.
    await hireData.hireCandidate(
      candidato.jobCandidateId,
      { firstName: "Escenario3", lastName: "Verificación" },
      { ...INPUT_VALIDO, nationalIdNumber: "HU33-ESC3-B" },
    );
  } catch (error) {
    fallo = error instanceof hireData.CandidatoYaContratadoError;
  }

  const despues = await contarTablas();

  reportar("3. La segunda contratación falla (CandidatoYaContratadoError)", fallo);
  reportar("3. No se crea un segundo empleado", iguales(antes, despues), despues);

  const { businessEntityId } = primera.data;
  await prisma.employeePayHistory.deleteMany({ where: { businessEntityId } });
  await prisma.employeeDepartmentHistory.deleteMany({ where: { businessEntityId } });
  await prisma.jobCandidate.delete({
    where: { jobCandidateId: candidato.jobCandidateId },
  });
  await prisma.employee.delete({ where: { businessEntityId } });
  await prisma.person.delete({ where: { businessEntityId } });
  await prisma.businessEntity.delete({ where: { businessEntityId } });
}

/** Validación tardía: turno inexistente, mismo punto de falla que el escenario 2. */
async function escenario4() {
  const candidato = await crearCandidato("Escenario4");
  const antes = await contarTablas();

  let fallo = false;
  try {
    await hireData.hireCandidate(
      candidato.jobCandidateId,
      { firstName: "Escenario4", lastName: "Verificación" },
      { ...INPUT_VALIDO, nationalIdNumber: "HU33-ESC4", shiftId: ID_INEXISTENTE },
    );
  } catch {
    fallo = true;
  }

  const despues = await contarTablas();
  const candidatoFinal = await prisma.jobCandidate.findUnique({
    where: { jobCandidateId: candidato.jobCandidateId },
  });

  reportar("4. La operación falla (turno inexistente)", fallo);
  reportar("4. No quedan registros parciales", iguales(antes, despues), despues);
  reportar("4. El candidato sigue pendiente", candidatoFinal?.businessEntityId === null);

  await limpiarCandidato(candidato.jobCandidateId);
}

async function main() {
  await escenario1();
  await escenario2();
  await escenario3();
  await escenario4();

  console.log(
    todoOk ? "\nTodos los escenarios pasaron." : "\nHay escenarios que fallaron.",
  );
  process.exit(todoOk ? 0 : 1);
}

main();
