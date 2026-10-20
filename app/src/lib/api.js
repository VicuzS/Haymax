
// Capa de datos del app (Fase 5).
//
// Modo CUENTA (sesión con token JWT): todo va a la API real haymax-api
// (Express + SQLite) según config.API_URL. Si la API no responde, la pantalla
// muestra el estado de error con "Reintentar".
//
// Todas las operaciones personales requieren una sesión de cuenta válida.
// Los datos simulados se conservan para pruebas internas, pero no son una vía de acceso.
import {
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
import { hoyIso, lunesDeIso, sumarDiasIso, fechaCorta, DIAS_CORTOS } from "./fechas";
import { API_URL } from "../config";
import { router } from "expo-router";
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
  if (!res.ok) {
    if (res.status === 401 && conToken) {
      await borrarSesion();
      router.replace("/screen/ACC-02");
    }
    throw new Error((data && data.error) || "Error " + res.status);
  }
  return data;
}

async function enCuenta() {
  const s = await leerSesion();
  if (s && s.modo === "cuenta" && s.token) return true;
  throw new Error("Inicia sesión para continuar.");
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
    fecha: p.fecha,
    comida: p.comida,
    recetaId: p.receta_id || p.recetaId,
    porciones: p.porciones,
    completado: !!(p.completado || p.cocinado),
    receta: aReceta(recetas.find((r) => r.id === (p.receta_id || p.recetaId))) || null,
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
  const nombreCompleto = (s && (s.nombre || s.usuario)) || "Usuario";
  const primerNombre = nombreCompleto.split(" ")[0];
  const inicial = primerNombre.charAt(0).toUpperCase() || "U";

  await enCuenta();  // garantiza que hay sesión

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
    usuario: nombreCompleto,
    primerNombre,
    inicial,
    plan,
    recetaHoy: plan && plan.receta ? plan.receta : rs[0],
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

// — Motor de disponibilidad (P3) —
export async function getMotor() {
  await enCuenta();
  const [recetas, favoritos] = await Promise.all([
    rf("/recetas/disponibilidad"),
    rf("/favoritos/ids").catch(() => []),
  ]);
  return { recetas, favoritos };
}

export async function getRecetasPorDistrito(distrito) {
  await enCuenta();
  const qs = distrito ? "?distrito=" + encodeURIComponent(distrito) : "";
  const [lista, disponibilidad] = await Promise.all([
    rf("/recetas" + qs),
    rf("/recetas/disponibilidad").catch(() => []),
  ]);
  const ids = new Set((lista || []).map((r) => r.id));
  return disponibilidad.filter((d) => ids.has(d.id));
}

export async function getReceta(id) {
  await enCuenta();
  const [detalle, despensa] = await Promise.all([
    id ? rf("/recetas/" + encodeURIComponent(id)) : rf("/recetas").then((l) => (l && l[0]) || null),
    rf("/despensa"),
  ]);
  return { receta: aReceta(detalle), pantry: despensa.map(aInsumo) };
}

export async function getRecetaDetalle(id) {
  await enCuenta();
  const [detalle, disponibilidad, despensa] = await Promise.all([
    id ? rf("/recetas/" + encodeURIComponent(id)) : rf("/recetas").then((l) => (l && l[0]) || null),
    rf("/recetas/disponibilidad").catch(() => []),
    rf("/despensa"),
  ]);
  const receta = aReceta(detalle);
  return {
    receta,
    pantry: despensa.map(aInsumo),
    disponibilidad: receta ? disponibilidad.find((d) => d.id === receta.id) || null : null,
  };
}

export async function agregarFavorito(recetaId) {
  await enCuenta();
  return rf("/favoritos/" + encodeURIComponent(recetaId), { method: "POST" });
}

export async function quitarFavorito(recetaId) {
  await enCuenta();
  return rf("/favoritos/" + encodeURIComponent(recetaId), { method: "DELETE" });
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
  return getPlanSemanaDe(lunesDeIso(hoyIso()));
}

// Igual que getPlanSemana, pero para la semana que empieza en `desde`
// (un lunes). Permite navegar semanas en el plan con flechas.
export async function getPlanSemanaDe(desde) {
  const hoy = hoyIso();
  const lunes = lunesDeIso(desde);
  const hasta = sumarDiasIso(lunes, 6);
  const chips = DIAS_CORTOS.map((lbl, i) => ({ lbl, iso: sumarDiasIso(lunes, i) }));

  if (!(await enCuenta())) {
    const plan = mealPlanMock.map((m) => ({ ...m, receta: D.recetaById(m.recetaId) }));
    return {
      plan,
      pantry: [...pantryMock],
      cobertura: D.planCobertura(plan),
      porComprar: porComprarDe(plan, pantryMock),
      semana: {
        hoy,
        desde: lunes,
        hasta,
        chips,
        etiqueta: `Semana del ${fechaCorta(lunes)} al ${fechaCorta(hasta)}`,
      },
    };
  }
  const [planes, recetas, despensa] = await Promise.all([
    rf(`/planes?desde=${lunes}&hasta=${hasta}`),
    rf("/recetas"),
    rf("/despensa"),
  ]);
  const rs = recetas.map(aReceta);
  const pantry = despensa.map(aInsumo);
  const plan = planes.map((p) => aPlan(p, rs));
  return {
    plan,
    pantry,
    cobertura: D.planCobertura(plan),
    porComprar: porComprarDe(plan, pantry),
    semana: {
      hoy,
      desde: lunes,
      hasta,
      chips,
      etiqueta: `Semana del ${fechaCorta(lunes)} al ${fechaCorta(hasta)}`,
    },
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

// — Autenticación y perfil —
async function persistirAutenticacion(data) {
  if (!data || !data.token || !data.user) {
    throw new Error("El servidor devolvió una sesión incompleta.");
  }
  await guardarSesionDispositivo({ token: data.token, user: data.user });
  return data.user;
}

export async function login(email, password) {
  const data = await rf("/auth/login", {
    method: "POST",
    body: { email: String(email || "").trim().toLowerCase(), password },
    conToken: false,
  });
  return persistirAutenticacion(data);
}

export async function registrarUsuario({ nombre, email, password, distrito } = {}) {
  const data = await rf("/auth/registro", {
    method: "POST",
    body: {
      nombre: String(nombre || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      password,
      distrito: String(distrito || "").trim() || null,
    },
    conToken: false,
  });
  return persistirAutenticacion(data);
}

export async function getPerfil() {
  await enCuenta();
  const data = await rf("/auth/yo");
  const user = data && data.user;
  if (!user) throw new Error("No se pudo cargar el perfil.");
  const actual = await leerSesion();
  await guardarSesionDispositivo({ token: actual.token, user });
  return user;
}

export async function actualizarPerfil(cambios = {}) {
  await enCuenta();
  const data = await rf("/auth/perfil", {
    method: "PUT",
    body: {
      nombre: cambios.nombre,
      distrito: cambios.distrito,
      foto_url: cambios.foto_url,
    },
  });
  const user = data && data.user;
  if (!user) throw new Error("El servidor no devolvió el perfil actualizado.");
  const actual = await leerSesion();
  await guardarSesionDispositivo({ token: actual.token, user });
  return user;
}

export async function cerrarSesion() {
  const actual = await leerSesion();
  try {
    if (actual && actual.token) {
      // Revoca el JWT en el servidor cuando la API está disponible.
      await rf("/auth/logout", { method: "POST" });
    }
  } catch (_e) {
    // La salida local debe completarse aunque el dispositivo esté sin conexión.
  } finally {
    await borrarSesion();
  }
}

// — Escrituras —
export async function setCompraListo(id, valor) {
  if (await enCuenta()) {
    // Sin `valor` el servidor alterna el estado; con él hay idempotencia.
    return rf("/compras/" + id, {
      method: "PUT",
      body: valor == null ? {} : { comprado: !!valor },
    });
  }
  const i = shoppingMock.findIndex((x) => x.id === id);
  if (i >= 0) shoppingMock.splice(i, 1, { ...shoppingMock[i], listo: !shoppingMock[i].listo });
  return getCompras();
}

// Agrega un ítem manual a la lista (sin duplicar por nombre).
export async function crearItemCompra({ nombre, cantidad = "1", unidad_medida, seccion = "Mercado de abastos" } = {}) {
  const limpio = String(nombre || "").trim();
  if (!limpio) throw new Error("Escribe el nombre del ítem.");
  if (!(await enCuenta())) {
    const ya = shoppingMock.some((s) => String(s.nombre).toLowerCase() === limpio.toLowerCase());
    if (!ya) {
      shoppingMock.push({
        id: "CL" + (shoppingMock.length + 1),
        nombre: limpio.charAt(0).toUpperCase() + limpio.slice(1),
        seccion,
        cantidad: String(cantidad || "1"),
        listo: false,
      });
    }
    return getCompras();
  }
  const lista = await rf("/compras");
  const existe = lista.some(
    (c) => String(c.nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") ===
      limpio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );
  if (existe) throw new Error("Ese ítem ya está en tu lista.");
  return rf("/compras", {
    method: "POST",
    body: {
      nombre: limpio.charAt(0).toUpperCase() + limpio.slice(1),
      cantidad: cantidad != null && String(cantidad).trim() !== "" ? String(cantidad).trim() : "1",
      unidad_medida,
      seccion,
      listo: false,
    },
  });
}

// Elimina un ítem de la lista.
export async function quitarCompra(id) {
  if (await enCuenta()) {
    return rf("/compras/" + id, { method: "DELETE" });
  }
  const i = shoppingMock.findIndex((x) => x.id === id);
  if (i >= 0) shoppingMock.splice(i, 1);
  return getCompras();
}

// Quita de la lista todos los ítems ya marcados (comprados).
export async function quitarComprados() {
  if (await enCuenta()) {
    const items = (await rf("/compras")).filter((c) => c.listo || c.comprado);
    for (const it of items) {
      await rf("/compras/" + it.id, { method: "DELETE" });
    }
    return { quitados: items.length };
  }
  shoppingMock.splice(0, shoppingMock.length, ...shoppingMock.filter((s) => !s.listo));
  return getCompras();
}

// Genera la lista de compras a partir del plan de la semana (endpoint P4).
export async function generarListaCompras(fecha) {
  if (await enCuenta()) {
    return rf("/compras/generar", { method: "POST", body: { fecha } });
  }
  return { creados: 0 };
}

// Plan de la semana en un rango ('YYYY-MM-DD' a 'YYYY-MM-DD').
export async function getPlanesEntre(desde, hasta) {
  if (desde && hasta) {
    return rf(`/planes?desde=${desde}&hasta=${hasta}`);
  }
  return rf("/planes");
}

// Crea o actualiza un plato del plan. `fecha` va en formato 'YYYY-MM-DD';
// si se pasa `dia` ("lunes"…), la API lo resuelve para la semana actual.
export async function planificarPlato({ recetaId, fecha, dia, comida = "almuerzo", porciones } = {}) {
  const cuerpo = { comida, porciones };
  if (fecha) cuerpo.fecha = fecha;
  else if (dia) cuerpo.dia = dia;
  if (await enCuenta()) {
    return rf("/planes", { method: "POST", body: { receta_id: recetaId, ...cuerpo } });
  }
  const p = { id: "M" + (mealPlanMock.length + 1), dia: dia || fecha, comida, recetaId, porciones };
  mealPlanMock.push(p);
  return p;
}

// Edita un plato existente del plan (PUT /planes/:id, cambios parciales).
export async function actualizarPlan(id, { recetaId, fecha, dia, comida, porciones, completado } = {}) {
  const cuerpo = {};
  if (recetaId) cuerpo.receta_id = recetaId;
  if (fecha) cuerpo.fecha = fecha;
  if (dia && !fecha) cuerpo.dia = dia;
  if (comida) cuerpo.comida = comida;
  if (porciones != null) cuerpo.porciones = porciones;
  if (completado != null) cuerpo.completado = !!completado;
  if (await enCuenta()) {
    return rf("/planes/" + id, { method: "PUT", body: cuerpo });
  }
  const i = mealPlanMock.findIndex((m) => String(m.id) === String(id));
  if (i >= 0) mealPlanMock.splice(i, 1, { ...mealPlanMock[i], ...cuerpo });
  return null;
}

// Quita un plato del plan.
export async function quitarPlato(id) {
  if (await enCuenta()) {
    return rf("/planes/" + id, { method: "DELETE" });
  }
  const i = mealPlanMock.findIndex((m) => String(m.id) === String(id));
  if (i >= 0) mealPlanMock.splice(i, 1);
  return null;
}

// Alias usado por las pantallas del flujo PLA-06..09.
export async function eliminarPlan(id) {
  return quitarPlato(id);
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
  for (const raw of ings) {
    const limpio = raw.replace(/^[0-9.,]+\s*(g|kg|ml|l|und|unid|atado|docena)?\s*(de\s+)?/i, "").trim();
    const key = norm(limpio || raw);
    if (!limpio || existentes.has(key)) continue;
    existentes.add(key);
    await rf("/compras", {
      method: "POST",
      body: {
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
