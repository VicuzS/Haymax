// Pruebas de la lógica de descuento de despensa (integración preparación/alertas).
// Ejecutar desde app/ con:  npm run test:domain
const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../.tmp-test/lib/domain.js");

const despensa = () => [
  { id: 1, nombre: "Lomo fino", cantidad: 1, unidad: "kg", fechaVencimiento: "2026-10-25" },
  { id: 2, nombre: "Pollo", cantidad: 300, unidad: "gr", fechaVencimiento: "2026-10-22" },
  { id: 3, nombre: "Pollo", cantidad: 600, unidad: "gr", fechaVencimiento: "2026-10-30" },
  { id: 4, nombre: "Huevo", cantidad: 6, unidad: "und", fechaVencimiento: "2026-10-28" },
];
const cant = (arr, id) => arr.find((p) => p.id === id).cantidad;

test("convierte kg↔gr al descontar (antes 400 gr vaciaba 1 kg)", () => {
  const { items } = D.descontarConReporte(despensa(), [{ label: "Lomo fino", qty: 400, unit: "gr" }]);
  assert.equal(cant(items, 1), 0.6);
});

test("consume primero el lote que vence antes (FEFO)", () => {
  const { items } = D.descontarConReporte(despensa(), [{ label: "Pollo", qty: 500, unit: "gr" }]);
  assert.equal(cant(items, 2), 0); // vence 22/10: se agota
  assert.equal(cant(items, 3), 400); // vence 30/10: aporta el resto
});

test("stock insuficiente: queda en 0 (nunca negativo) y se reporta", () => {
  const r = D.descontarConReporte(despensa(), [{ label: "Huevo", qty: 10, unit: "und" }]);
  assert.equal(cant(r.items, 4), 0);
  assert.deepEqual(r.insuficientes, [{ label: "Huevo", faltante: 4, unit: "und" }]);
});

test("no encontrado o de otra familia de unidad: no descuenta y lo reporta", () => {
  const r = D.descontarConReporte(despensa(), [
    { label: "Culantro", qty: 1, unit: "atado" },
    { label: "Huevo", qty: 1, unit: "taza" },
  ]);
  assert.deepEqual(r.noEncontrados, ["Culantro", "Huevo"]);
  assert.equal(cant(r.items, 4), 6);
});

test("cantidad negativa devuelve stock (ajuste / deshacer)", () => {
  const r = D.descontarConReporte(despensa(), [{ label: "Huevo", qty: -2, unit: "und" }]);
  assert.equal(cant(r.items, 4), 8);
});

test("no muta el arreglo original", () => {
  const original = despensa();
  D.descontarConReporte(original, [{ label: "Huevo", qty: 3, unit: "und" }]);
  assert.equal(cant(original, 4), 6);
});

test("escalarIngredientes: contables enteros (mín. 1) y peso con decimales", () => {
  const receta = {
    porciones: 4,
    ingredientes_detalle: [
      { nombre: "Huevo", cantidad: 2, unidad_medida: "und" },
      { nombre: "Arroz", cantidad: 0.5, unidad_medida: "kg" },
    ],
  };
  const e = D.escalarIngredientes(receta, 2);
  assert.deepEqual(e.map((x) => [x.label, x.qty, x.unit]), [["Huevo", 1, "und"], ["Arroz", 0.25, "kg"]]);
  assert.equal(D.escalarIngredientes(receta, 1)[0].qty, 1); // 0.5 und → mín. 1
});

test("coincideNombre ignora acentos y mayúsculas", () => {
  assert.equal(D.coincideNombre("Ají amarillo", "aji AMARILLO"), true);
  assert.equal(D.coincideNombre("Lomo fino", "Pollo"), false);
});
