/**
 * Crea el esquema `bi` y exporta cada vista a CSV para Power BI Desktop.
 *
 * Uso: node --env-file=.env bi/exportar.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const raiz = path.dirname(fileURLToPath(import.meta.url));
const salida = path.join(raiz, "datos");

const VISTAS = [
  "dim_departamento",
  "dim_turno",
  "dim_empleado",
  "dim_fecha",
  "fact_plantilla",
  "fact_asignacion",
  "fact_salario",
  "fact_candidato",
];

function celda(valor) {
  if (valor === null || valor === undefined) return "";
  if (valor instanceof Date) return valor.toISOString().slice(0, 10);
  if (typeof valor === "boolean") return valor ? "TRUE" : "FALSE";
  const texto = String(valor);
  if (/[",\n\r]/.test(texto)) return `"${texto.replaceAll('"', '""')}"`;
  return texto;
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
await cliente.connect();

const sql = await readFile(path.join(raiz, "sql", "modelo.sql"), "utf8");
await cliente.query(sql);
await mkdir(salida, { recursive: true });

for (const vista of VISTAS) {
  const { rows, fields } = await cliente.query(`SELECT * FROM bi.${vista}`);
  const encabezado = fields.map((campo) => campo.name).join(",");
  const cuerpo = rows.map((fila) => fields.map((campo) => celda(fila[campo.name])).join(","));
  const archivo = path.join(salida, `${vista}.csv`);
  await writeFile(archivo, [encabezado, ...cuerpo].join("\n") + "\n", "utf8");
  console.log(`${vista}: ${rows.length} filas`);
}

await cliente.end();
