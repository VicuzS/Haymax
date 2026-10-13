// Capa de datos del app (Fase 5).
//
// Modo CUENTA (sesión con token JWT): todo va a la API real haymax-api
// (Express + SQLite) según config.API_URL. Si la API no responde, la pantalla
// muestra el estado de error con "Reintentar".
//
// Modo INVITADO / sin token: adaptador simulado sobre los mocks locales
// (decisión B+.1: los datos del invitado viven en el dispositivo).
//
// Las pantallas usan las mismas firmas en ambos modos.
import {
  recipesMock,
  pantryMock,
  mealPlanMock,
  shoppingMock,
  manualAddsMock,
  lastAddedMock,
  addLastAdded,
  agregarALista,
  descontarDespensa,
  ajustarDespensa,
} from "../data/mock";
import * as D from "./domain";
import { API_URL } from "../config";
import { leerSesion, guardarSesion as guardarSesionDispositivo, borrarSesion } from "./sesion";

// — Estado local efímero (compartido por ambos modos) —
// Pendientes del registro manual (DES-06/07) y últimos agregados (DES-08).
let pendientesManuales = manualAddsMock.map((m) => ({ ...m }));
let ultimosAgregados = lastAddedMock.map((m) => ({ ...m }));

export function getPendientesManuales() {
  return pendientesManuales.map((m) => ({ ...m }));
}

export function getUltimosAgregados() {
  return ultimosAgregados.map((m) => ({ ...m }));
}

// — HTTP hacia haymax-api —
async function rf(path, { method = "GET", body, conToken = true } = {}) {
  const s = await leerSesion();
  const headers = { "Content-Type": "application/json" };
  if (conToken && s && s.token) headers.Authorization = "Bearer " + s.token;
  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    data = {};
  }
  if (!res.ok) throw new Error((data && data.error) || "Error " + res.status);
  return data;
}

async function enCuenta() {
  const s = await leerSesion();
  return !!(s && s.modo === "cuenta" && s.token);
}

// — Mapeo BD (snake_case) → formas del app —
function aReceta(r) {
  if (!r) return null;
  return { ...r, precioEstimado: r.precio != null ? r.precio : r.precioEstimado };
}

function aInsumo(p) {
  if (!p) return p;
  return { ...p, fechaVencimiento: p.fechaVencimiento || p.fecha_vencimiento };
}

function aPlan(p, recetas) {
  return {
    id: p.id,
    dia: p.dia,
    comida: p.comida,
    recetaId: p.receta_id || p.recetaId,
    porciones: p.porciones,
    receta: aReceta(recetas.find((r) => r.id === (p.receta_id || p.recetaId))) || recetas[0] || null,
  };
}

const DIAS_ES = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function hoyInfo(distrito) {
  const d = new Date();
  const dia = DIAS_ES[d.getDay()];
  const capital = dia.charAt(0).toUpperCase() + dia.slice(1);
  return {
    dia,
    fecha: `${capital} ${d.getDate()} de ${MESES_ES[d.getMonth()]} · ${distrito || "Surquillo"}`,
  };
}

function porComprarDe(plan, pantry) {
  const set = new Set();
  plan.forEach((m) => {
    if (m.receta) D.faltantes(m.receta, pantry).forEach((f) => set.add(f));
  });
  return set.size;
}

function parseCantidad(texto) {
  const m = String(texto == null ? "" : texto).match(/([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z]+)?/);
  if (!m) return { cantidad: 1, unidad: "und" };
  return { cantidad: parseFloat(m[1].replace(",", ".")), unidad: (m[2] || "und").toLowerCase() };
}

const COCINADAS = [
  { label: "Proteínas", value: "3 platos", icon: "🥩", color: undefined },
  { label: "Verduras", value: "5 platos", icon: "🥦", color: undefined },
  { label: "Frituras", value: "2 platos", icon: "🍟", color: "amber" },
];

const SUGERENCIAS = [
  { id: "S1", title: "Suma 1 ensalada en 2 días", sub: "más fibra" },
  { id: "S2", title: "Cambia 1 fritura por caldo", sub: "menos aceite" },
];

// — Lecturas —
export async function getInicio() {
  const s = await leerSesion();
  const hoy = hoyInfo(s && s.distrito);

  if (!(await enCuenta())) {
    const planM = mealPlanMock.find((m) => m.dia === hoy.dia) || mealPlanMock[0] || null;
    const plan = planM ? { ...planM, receta: D.recetaById(planM.recetaId) } : null;
    return {
      hoy,
      plan,
      recetaHoy: plan ? plan.receta : D.recetaById("REC-LOMO"),
      sugerida: recipesMock[0],
      stats: D.pantryStats(),
      shop: D.shoppingProgress(),
      balance: D.balanceSemanal(),
      atencion: pantryMock.filter((p) => p.estado !== "ok").length,
    };
  }

  const [recetas, planes, despensa, compras] = await Promise.all([
    rf("/recetas"),
    rf("/planes"),
    rf("/despensa"),
    rf("/compras"),
  ]);
  const rs = recetas.map(aReceta);
  const planP = planes.find((p) => p.dia === hoy.dia) || null;
  const plan = planP ? aPlan(planP, rs) : null;
  const shopList = compras.map((c) => ({ ...c, listo: !!c.listo }));
  return {
    hoy,
    plan,
    recetaHoy: plan ? plan.receta : rs[0],
    sugerida: rs[0],
    stats: D.pantryStats(despensa.map(aInsumo)),
    shop: D.shoppingProgress(shopList),
    balance: D.balanceSemanal(),
    atencion: despensa.filter((p) => p.estado !== "ok").length,
  };
}

export async function getDespensa() {
  if (!(await enCuenta())) {
    return { items: [...pantryMock], stats: D.pantryStats() };
  }
  const items = (await rf("/despensa")).map(aInsumo);
  return { items, stats: D.pantryStats(items) };
}

export async function getRecetas() {
  if (!(await enCuenta())) {
    return { recetas: [...recipesMock], pantry: [...pantryMock] };
  }
  const [recetas, despensa] = await Promise.all([rf("/recetas"), rf("/despensa")]);
  return { recetas: recetas.map(aReceta), pantry: despensa.map(aInsumo) };
}

export async function getReceta(id) {
  if (!(await enCuenta())) {
    return { receta: D.recetaById(id), pantry: [...pantryMock] };
  }
  const [lista, despensa] = await Promise.all([rf("/recetas"), rf("/despensa")]);
  const rs = lista.map(aReceta);
  const receta = id ? rs.find((r) => r.id === id) : null;
  return { receta: receta || rs[0], pantry: despensa.map(aInsumo) };
}

export async function getPreparar(id) {
  if (!(await enCuenta())) {
    return { receta: D.recetaById(id), plan: mealPlanMock.find((m) => m.recetaId === id) || null };
  }
  const [recetas, planes] = await Promise.all([rf("/recetas"), rf("/planes")]);
  const rs = recetas.map(aReceta);
  const r = id ? rs.find((x) => x.id === id) : null;
  const receta = r || rs[0];
  const p = planes.find((x) => x.receta_id === receta.id) || null;
  return {
    receta,
    plan: p ? { id: p.id, dia: p.dia, comida: p.comida, recetaId: p.receta_id, porciones: p.porciones } : null,
  };
}

export async function getPlanSemana() {
  if (!(await enCuenta())) {
    const plan = mealPlanMock.map((m) => ({ ...m, receta: D.recetaById(m.recetaId) }));
    return {
      plan,
      pantry: [...pantryMock],
      cobertura: D.planCobertura(plan),
      porComprar: porComprarDe(plan, pantryMock),
    };
  }
  const [planes, recetas, despensa] = await Promise.all([rf("/planes"), rf("/recetas"), rf("/despensa")]);
  const rs = recetas.map(aReceta);
  const pantry = despensa.map(aInsumo);
  const plan = planes.map((p) => aPlan(p, rs));
  return {
    plan,
    pantry,
    cobertura: D.planCobertura(plan),
    porComprar: porComprarDe(plan, pantry),
  };
}

export async function getCompras() {
  if (!(await enCuenta())) {
    return { items: [...shoppingMock], prog: D.shoppingProgress() };
  }
  const items = (await rf("/compras")).map((c) => ({ ...c, listo: !!c.listo }));
  return { items, prog: D.shoppingProgress(items) };
}

export async function getAlertas() {
  if (!(await enCuenta())) {
    return { atencion: pantryMock.filter((p) => p.estado !== "ok") };
  }
  const items = (await rf("/despensa")).map(aInsumo);
  return { atencion: items.filter((p) => p.estado !== "ok") };
}

export async function getBalance() {
  if (!(await enCuenta())) {
    return { ...D.balanceSemanal(), cocinadas: COCINADAS, sugerencias: SUGERENCIAS };
  }
  const [planes] = await Promise.all([rf("/planes")]);
  const pct = Math.round((planes.length / 14) * 100);
  return {
    pct,
    delta: planes.length ? "" : undefined,
    texto: planes.length
      ? `Llevas ${planes.length} comidas planificadas de las 14 de la semana.`
      : "Tu semana aún no tiene platos: planifica el primero.",
    cocinadas: COCINADAS,
    sugerencias: SUGERENCIAS,
  };
}

export async function getSesion() {
  return leerSesion();
}

// — Sesión —
export async function login(email, password) {
  const data = await rf("/auth/login", {
    method: "POST",
    body: { email, password },
    conToken: false,
  });
  await guardarSesionDispositivo({
    modo: "cuenta",
    usuario: data.user.nombre,
    token: data.token,
  });
  return data.user;
}

export async function guardarSesion(datos) {
  await guardarSesionDispositivo(datos);
}

export async function cerrarSesion() {
  await borrarSesion();
}

// — Escrituras —
export async function setCompraListo(id) {
  if (await enCuenta()) {
    return rf("/compras/" + id, { method: "PUT" });
  }
  const i = shoppingMock.findIndex((x) => x.id === id);
  if (i >= 0) shoppingMock.splice(i, 1, { ...shoppingMock[i], listo: !shoppingMock[i].listo });
  return getCompras();
}

export async function enviarFaltantesALista(ings) {
  if (!(await enCuenta())) {
    agregarALista(ings);
    return;
  }
  const lista = await rf("/compras");
  const norm = (s) =>
    String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const existentes = new Set(lista.map((c) => norm(c.nombre)));
  let n = 0;
  for (const raw of ings) {
    const limpio = raw.replace(/^[0-9.,]+\s*(g|kg|ml|l|und|unid|atado|docena)?\s*(de\s+)?/i, "").trim();
    const key = norm(limpio || raw);
    if (!limpio || existentes.has(key)) continue;
    existentes.add(key);
    await rf("/compras", {
      method: "POST",
      body: {
        id: "CL" + Date.now() + "-" + n++,
        nombre: limpio.charAt(0).toUpperCase() + limpio.slice(1),
        cantidad: "1",
        seccion: "Mercado de abastos",
        listo: false,
      },
    });
  }
}

async function descontarReales(descuentos) {
  const items = (await rf("/despensa")).map(aInsumo);
  const nuevos = D.descontarEn(items, descuentos);
  for (let i = 0; i < items.length; i++) {
    if (Number(nuevos[i].cantidad) !== Number(items[i].cantidad)) {
      await rf("/despensa/" + items[i].id, {
        method: "PUT",
        body: { cantidad: nuevos[i].cantidad },
      });
    }
  }
}

export async function descontarAlCocinar(descuentos) {
  if (await enCuenta()) {
    await descontarReales(descuentos);
    return;
  }
  descontarDespensa(descuentos);
}

export async function ajustarAlCocinar(filas) {
  if (await enCuenta()) {
    const deltas = filas
      .map((f) => ({ label: f.label, qty: Number(f.qty) - Number(f.base), unit: f.unit }))
      .filter((d) => d.qty !== 0);
    if (deltas.length) await descontarReales(deltas);
    return;
  }
  ajustarDespensa(filas);
}

export async function planificarPlato({ recetaId, dia, comida = "almuerzo", porciones }) {
  if (await enCuenta()) {
    return rf("/planes", {
      method: "POST",
      body: { id: "M" + Date.now(), dia, comida, receta_id: recetaId, porciones },
    });
  }
  const p = { id: "M" + (mealPlanMock.length + 1), dia, comida, recetaId, porciones };
  mealPlanMock.push(p);
  return p;
}

async function altaEnDespensa(items) {
  let n = 0;
  for (const it of items) {
    const { cantidad, unidad } = parseCantidad(it.cantidad);
    await rf("/despensa", {
      method: "POST",
      body: {
        id: it.id || "PX" + Date.now() + "-" + n++,
        nombre: it.nombre,
        categoria: "Secos",
        cantidad,
        unidad,
        estado: "ok",
      },
    });
  }
}

export async function agregarUltimos(items) {
  if (await enCuenta()) {
    await altaEnDespensa(items);
  } else {
    addLastAdded(items);
  }
  ultimosAgregados = items.map((m) => ({ ...m }));
}

export async function agregarManualInsumo(item) {
  pendientesManuales.push({
    id: "A" + (pendientesManuales.length + 1),
    nombre: item.nombre,
    cantidad: item.cantidad,
  });
}

export async function confirmarAltaManual(items) {
  if (await enCuenta()) {
    await altaEnDespensa(items);
  } else {
    addLastAdded(items);
  }
  pendientesManuales = [];
  ultimosAgregados = items.map((m) => ({ ...m }));
}

export async function actualizarInsumo(id, cambios) {
  if (await enCuenta()) {
    return rf("/despensa/" + id, {
      method: "PUT",
      body: {
        cantidad: cambios.cantidad,
        unidad: cambios.unidad,
        fecha_vencimiento: cambios.fechaVencimiento,
      },
    });
  }
  const i = pantryMock.findIndex((p) => p.id === id);
  if (i >= 0) {
    pantryMock.splice(i, 1, {
      ...pantryMock[i],
      ...cambios,
      fechaVencimiento: cambios.fechaVencimiento || pantryMock[i].fechaVencimiento,
    });
  }
  return null;
}

export async function eliminarInsumo(id) {
  if (await enCuenta()) {
    return rf("/despensa/" + id, { method: "DELETE" });
  }
  const i = pantryMock.findIndex((p) => p.id === id);
  if (i >= 0) pantryMock.splice(i, 1);
  return null;
}
