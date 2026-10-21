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
  return (Number(cantidad) || 0) * factorUnidad(unidad);
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
const FAMILIAS = {
  peso: { g: 1, gr: 1, gramo: 1, gramos: 1, kg: 1000, kilo: 1000, kilos: 1000, kilogramo: 1000, kilogramos: 1000 },
  volumen: { ml: 1, mililitro: 1, mililitros: 1, l: 1000, lt: 1000, litro: 1000, litros: 1000 },
};
const CONTABLES = ["und", "unid", "unidad", "unidades", "lata", "latas", "atado", "docena", "botella", "paquete"];

// Factor para llevar una unidad a su base (g, ml o unidad).
function factorUnidad(u) {
  const n = norm(u).trim();
  for (const f of Object.keys(FAMILIAS)) {
    if (FAMILIAS[f][n] != null) return FAMILIAS[f][n];
  }
  return 1;
}

// Familia de la unidad: peso, volumen, cantidad (contables) o la propia unidad
// (tazas, cucharadas...), que solo se compara consigo misma.
export function familiaUnidad(u) {
  const n = norm(u).trim();
  for (const f of Object.keys(FAMILIAS)) {
    if (FAMILIAS[f][n] != null) return f;
  }
  if (CONTABLES.indexOf(n) !== -1) return "cantidad";
  return n;
}

const bucketUnidad = familiaUnidad;

const redondear = (n) => Math.round(n * 1000) / 1000;

// ¿El nombre de un ingrediente y el de un insumo se refieren al mismo producto?
// (palabras de 4+ letras en común, sin acentos). Misma regla que el motor.
export function coincideNombre(a, b) {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  const wa = na.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  const wb = nb.split(/[^a-z0-9]+/).filter((w) => w.length >= 4);
  return wa.some((w) => nb.indexOf(w) !== -1) || wb.some((w) => na.indexOf(w) !== -1);
}

// Ingredientes de una receta escalados a `porc` porciones. Fuente ÚNICA para
// PRE-01 (descuento) y PRE-02 (ajuste), de modo que ambos usen la misma cantidad.
// Contables: entero (mín. 1); peso/volumen: hasta 2 decimales.
export function escalarIngredientes(receta, porc) {
  if (!receta) return [];
  const factor = receta.porciones > 0 ? porc / receta.porciones : 1;
  const escalar = (cantidad, unidad) => {
    const x = (Number(cantidad) || 0) * factor;
    if (x <= 0) return 0;
    return familiaUnidad(unidad) === "cantidad" ? Math.max(1, Math.round(x)) : Math.round(x * 100) / 100;
  };
  const detalle = receta.ingredientes_detalle || [];
  if (detalle.length) {
    return detalle
      .map((ing, i) => {
        const unit = ing.unidad_medida || "und";
        return { id: "D" + i, label: ing.nombre, qty: escalar(ing.cantidad, unit), unit };
      })
      .filter((d) => d.qty > 0);
  }
  // Respaldo: texto plano "400 gr de Lomo fino" -> { cantidad, unidad }.
  return (receta.ingredientes || [])
    .map((texto, i) => {
      const m = String(texto).match(/([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)?/);
      const unit = (m && m[2] && m[2].toLowerCase()) || "und";
      return {
        id: "D" + i,
        label: String(texto).replace(/^[0-9.,]+\s*[a-zA-Z]*\s*(de\s+)?/i, "").trim(),
        qty: escalar(m ? Number(m[1].replace(",", ".")) : 1, unit),
        unit,
      };
    })
    .filter((d) => d.label && d.qty > 0);
}

// Descuento puro sobre un arreglo de insumos (no muta el original). Cantidades
// negativas suman (ajuste fino de PRE-02). Devuelve además un reporte:
//  - noEncontrados: ingredientes que no están en la despensa (o en otra familia
//    de unidad: no se mezcla "gr" con "taza");
//  - insuficientes: ingredientes cuyo stock no alcanzó (la despensa queda en 0,
//    nunca negativa; CU-05).
// Convierte entre unidades de la misma familia (kg↔g, l↔ml) y consume primero
// el lote que vence antes (FEFO), para que las alertas de vencimiento (PRE-03)
// reflejen lo que realmente queda.
export function descontarConReporte(items, descuentos) {
  const arr = items.map((p) => ({ ...p }));
  const noEncontrados = [];
  const insuficientes = [];
  const porVencimiento = (a, b) =>
    String(a.fechaVencimiento || "9999-12-31").localeCompare(String(b.fechaVencimiento || "9999-12-31"));

  descuentos.forEach((it) => {
    const qty = Number(it.qty) || 0;
    if (qty === 0) return;
    const familia = familiaUnidad(it.unit);
    const mismaFamilia = arr.filter((p) => familiaUnidad(p.unidad) === familia);
    const exactos = mismaFamilia.filter((p) => norm(p.nombre) === norm(it.label));
    // Coincidencia aproximada: solo el producto que vence antes (como antes, un único item).
    const candidatos = (exactos.length ? exactos : mismaFamilia.filter((p) => coincideNombre(it.label, p.nombre)))
      .sort(porVencimiento)
      .slice(0, exactos.length ? undefined : 1);

    if (!candidatos.length) {
      noEncontrados.push(it.label);
      return;
    }
    if (qty < 0) {
      // Ajuste a la baja: devuelve la cantidad al lote que vence más tarde.
      const c = candidatos[candidatos.length - 1];
      c.cantidad = redondear((aBaseCantidad(c.cantidad, c.unidad) + aBaseCantidad(-qty, it.unit)) / factorUnidad(c.unidad));
      return;
    }
    let restante = aBaseCantidad(qty, it.unit);
    for (const c of candidatos) {
      if (restante <= 1e-9) break;
      const disponible = aBaseCantidad(c.cantidad, c.unidad);
      const toma = Math.min(disponible, restante);
      c.cantidad = redondear((disponible - toma) / factorUnidad(c.unidad));
      restante -= toma;
    }
    if (restante > 1e-9) {
      insuficientes.push({ label: it.label, faltante: redondear(restante / factorUnidad(it.unit)), unit: it.unit });
    }
  });
  return { items: arr, noEncontrados, insuficientes };
}

export function descontarEn(items, descuentos) {
  return descontarConReporte(items, descuentos).items;
}
