/**
 * Genera las 31 pantallas (stub) + el registro maestro desde el inventario.
 * Uso: node tools/_gen_screens.js   (desde la carpeta app/)
 */
const fs = require("fs");
const path = require("path");

const meta = JSON.parse(fs.readFileSync(path.join(__dirname, "_screens_meta.json"), "utf8"));
const outDir = path.join(__dirname, "..", "src", "screens");
fs.mkdirSync(outDir, { recursive: true });

// Pantallas ya implementadas (Fases 1+): el generador no las pisa.
const IMPLEMENTED = new Set([
  "INI-01", "INI-02", "INI-03", "REC-01", "REC-02",
  "DES-01", "DES-02", "DES-03", "DES-04", "DES-05", "DES-06", "DES-07", "DES-08",
  "PLA-01", "PLA-02", "PLA-03", "PLA-04", "PLA-05", "COM-01", "SAL-01",
  "ACC-01", "ACC-02", "ACC-03", "ACC-04", "AJU-01", "AJU-02", "AJU-03", "AJU-04",
  "PRE-01", "PRE-02", "PRE-03",
]);

for (const s of meta.screens) {
  if (IMPLEMENTED.has(s.id)) continue;
  const comp = s.id.replace(/-/g, "_");
  const file = path.join(outDir, `${s.id}.js`);
  const code = [
    `import ScreenStub from "../components/ScreenStub";`,
    ``,
    `export default function ${comp}() {`,
    `  return (`,
    `    <ScreenStub`,
    `      id="${s.id}"`,
    `      name=${JSON.stringify(s.name)}`,
    `      items={${s.items}}`,
    `      links={${JSON.stringify(meta.links[s.id] || {})}}`,
    `    />`,
    `  );`,
    `}`,
    ``,
  ].join("\n");
  fs.writeFileSync(file, code, "utf8");
}

const ids = meta.screens.map((s) => s.id);
const registry = [
  "// Registro maestro de las 31 pantallas del inventario (cobertura 31/31).",
  `import { createElement } from "react";`,
  ``,
  `export const SCREEN_IDS = ${JSON.stringify(ids, null, 2)};`,
  ``,
  `export const SCREEN_META = ${JSON.stringify(
    Object.fromEntries(meta.screens.map((s) => [s.id, { name: s.name, tab: s.tab, hasFab: s.hasFab }])),
    null,
    2
  )};`,
  ``,
  `const LOADERS = {`,
  ...ids.map((id) => `  "${id}": () => require("./${id}").default,`),
  `};`,
  ``,
  `export function getScreen(id) {`,
  `  const load = LOADERS[id];`,
  `  return load ? load() : null;`,
  `}`,
  ``,
  `export function hasScreen(id) {`,
  `  return !!LOADERS[id];`,
  `}`,
  ``,
  `// Devuelve el elemento de la pantalla (o null si el ID no existe).`,
  `export function renderScreen(id, props) {`,
  `  const load = LOADERS[id];`,
  `  return load ? createElement(load(), props) : null;`,
  `}`,
  ``,
].join("\n");

fs.writeFileSync(path.join(outDir, "index.js"), registry, "utf8");
console.log(`OK: ${ids.length} pantallas + registro en src/screens/index.js`);
