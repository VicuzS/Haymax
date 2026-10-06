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
