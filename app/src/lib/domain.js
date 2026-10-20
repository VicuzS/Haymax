import { pantryMock, shoppingMock, recipesMock, mealPlanMock } from "../data/mock";

// Reglas de negocio de la Fase 1: qué puedo cocinar, precio por porción y
// avance de la lista. En Fase 2 esto se reemplaza llamando a la API.

export function norm(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const STOP = ["de", "con", "por", "und", "lata", "gr", "kg", "ml", "botella", "docena"];

function words(s) {
  return norm(s)
    .split(/[^a-z0-9]+/)
    .filter((w) => w.length >= 4 && STOP.indexOf(w) === -1);
}

export function ingredienteCubierto(ingrediente, pantry = pantryMock) {
  const ing = norm(ingrediente);
  const iw = words(ingrediente);
  return pantry.some((p) => {
    const n = norm(p.nombre);
    if (n.length < 3) return false;
    const pw = words(p.nombre);
    if (pw.some((w) => ing.indexOf(w) !== -1)) return true;
    if (iw.some((w) => n.indexOf(w) !== -1)) return true;
    return false;
  });
}

export function faltantes(receta, pantry = pantryMock) {
  return receta.ingredientes.filter((i) => !ingredienteCubierto(i, pantry));
}

// — Persona 4 · planificación (mínimos por porción) ——————————————————

// Normaliza cantidad+unidad a una base comparable: peso→gramos,
// volumen→mililitros, resto→unidades.
export function aBaseCantidad(cantidad, unidad) {
  const n = Number(cantidad) || 0;
  const u = norm(unidad);
  if (["kg", "kilo", "kilos", "kilogramo", "kilogramos"].indexOf(u) !== -1) return n * 1000;
  if (["l", "lt", "litro", "litros"].indexOf(u) !== -1) return n * 1000;
  return n;
}

// ¿La cantidad de un ingrediente alcanza para N porciones? Compara por
// unidades de la misma familia (peso↔gramos, volumen↔ml, unidades).
export function ingredienteAlcanza(receta, pantry = pantryMock, porciones) {
  const detalle = receta.ingredientes_detalle || [];
  const goal = porciones == null ? receta.porciones : porciones;
  const base = receta.porciones > 0 ? goal / receta.porciones : 1;

  if (!detalle.length) {
    // Sin datos estructurados, delegamos en la coincidencia por nombre.
    const f = faltantes(receta, pantry);
    return { alcanza: f.length === 0, faltantes: f };
  }

  const deficit = [];
  for (const ing of detalle) {
    if (ing.opcional) continue;
    const requerido = aBaseCantidad((Number(ing.cantidad) || 0) * base, ing.unidad_medida);
    const enCasa = buscarEnPantry(pantry, ing.nombre, ing.producto_id);
    const mismoBucket = enCasa && bucketUnidad(enCasa.unidad) === bucketUnidad(ing.unidad_medida);
    const disp = mismoBucket ? aBaseCantidad(enCasa.cantidad, enCasa.unidad) : 0;
    if (disp < requerido - 1e-9) deficit.push(ing.nombre);
  }
  return { alcanza: deficit.length === 0, faltantes: deficit };
}

export function puedePreparar(receta, pantry = pantryMock) {
  return faltantes(receta, pantry).length === 0;
}

export function precioPorPorcion(receta) {
  return receta.precioEstimado / receta.porciones;
}

export function soles(n) {
  return "S/ " + Number(n).toFixed(2);
}

export function dificultadTexto(d) {
  return d === "facil" ? "Fácil" : d === "media" ? "Media" : "Difícil";
}

// El delivery se estima en 3x el costo en casa (criterio del inventario).
export function ahorroPorPorcion(receta) {
  const enCasa = precioPorPorcion(receta);
  const delivery = enCasa * 3;
  return { enCasa, delivery, pct: Math.round((1 - enCasa / delivery) * 100) };
}

export function pantryStats(pantry = pantryMock) {
  return {
    total: pantry.length,
    disponibles: pantry.filter((p) => p.estado === "ok").length,
    porVencer: pantry.filter((p) => p.estado === "por-vencer").length,
    vencidos: pantry.filter((p) => p.estado === "vencido").length,
  };
}

export function shoppingProgress(list = shoppingMock) {
  const listos = list.filter((i) => i.listo).length;
  const total = list.length;
  return { listos, total, pct: total ? listos / total : 0 };
}

export function recetaById(id) {
  return recipesMock.find((r) => r.id === id) || recipesMock[0];
}

// Fase 3 — plan semanal, cobertura y ahorro.
export function comidasDelDia(dia, plan = mealPlanMock) {
  return plan.filter((m) => m.dia === dia);
}

export function planCobertura(plan = mealPlanMock) {
  return { planificadas: plan.length, total: 14 };
}

export function faltantesDelPlan(plan = mealPlanMock) {
  const set = new Set();
  plan.forEach((m) => faltantes(recetaById(m.recetaId)).forEach((f) => set.add(f)));
  return Array.from(set);
}

export function balanceSemanal() {
  return {
    pct: 76,
    delta: "▲ 6%",
    texto: "Tu semana va balanceada: 3 proteínas, 5 verduras y 2 frituras.",
  };
}

// Devuelve el item de la despensa que corresponde a un ingrediente de receta.
// Empareja por producto_id del catálogo y, si no hay match, por nombre
// normalizado (sin acentos) — mismas reglas que usa el motor del backend.
function buscarEnPantry(pantry = [], nombre, productoId) {
  const objetivo = norm(nombre);
  const porId = productoId != null ? pantry.filter((p) => p.producto_id != null && Number(p.producto_id) === Number(productoId)) : [];
  if (porId.length) return porId.reduce((acc, p) => ({ ...acc, cantidad: Number(acc.cantidad) + Number(p.cantidad) }), porId[0]);
  const porNombre = pantry.filter((p) => {
    const n = norm(p.nombre);
    if (!n || !objetivo) return false;
    if (n === objetivo) return true;
    const corto = n.length <= objetivo.length ? n : objetivo;
    const largo = n.length <= objetivo.length ? objetivo : n;
    return corto.length >= 4 && largo.includes(corto);
  });
  if (porNombre.length) return porNombre.reduce((acc, p) => ({ ...acc, cantidad: Number(acc.cantidad) + Number(p.cantidad) }), porNombre[0]);
  return null;
}

// Descuento puro sobre un arreglo de insumos (lo usa la API real contra la
// lista de /despensa; no muta el arreglo recibido). Cantidades negativas
// suman (ajuste fino de PRE-02).
function bucketUnidad(u) {
  const n = norm(u);
  if (["g", "gr", "gramo", "gramos", "kg"].indexOf(n) !== -1) return "peso";
  if (["und", "unid", "unidad", "unidades", "lata", "latas", "atado", "docena", "botella", "paquete"].indexOf(n) !== -1) {
    return "cantidad";
  }
  return n;
}

export function descontarEn(items, descuentos) {
  const arr = items.map((p) => ({ ...p }));
  descuentos.forEach((it) => {
    const label = norm(it.label);
    const lw = label.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
    const i = arr.findIndex((p) => {
      const n = norm(p.nombre);
      const pw = n.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
      return lw.some((w) => n.indexOf(w) !== -1) || pw.some((w) => label.indexOf(w) !== -1);
    });
    if (i < 0) return;
    const p = arr[i];
    if (bucketUnidad(p.unidad) !== bucketUnidad(it.unit)) return;
    arr[i] = { ...p, cantidad: Math.max(0, Number(p.cantidad) - Number(it.qty)) };
  });
  return arr;
}
