
// Capa de datos del app (Fase 5).
//
// Modo CUENTA (sesión con token JWT): todo va a la API real haymax-api
// (Express + PostgreSQL) según config.API_URL. Si la API no responde, la pantalla
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
import { API_URL } from "../config";
import { hoyIso } from "./fechas";
import { router } from "expo-router";
import { leerSesion, guardarSesion as guardarSesionDispositivo, borrarSesion } from "./sesion";

// — Estado local efímero (compartido por ambos modos) —
// Pendientes del registro manual (DES-06/07) y últimos agregados (DES-08).
let pendientesManuales = manualAddsMock.map((m) => ({ ...m }));
let ultimosAgregados = lastAddedMock.map((m) => ({ ...m }));
let escaneoPendiente = null;

export function getPendientesManuales() {
  return pendientesManuales.map((m) => ({ ...m }));
}

export function getUltimosAgregados() {
  return ultimosAgregados.map((m) => ({ ...m }));
}

export function getEscaneoPendiente() {
  return escaneoPendiente
    ? { ...escaneoPendiente, items: escaneoPendiente.items.map((item) => ({ ...item })) }
    : null;
}

export async function analizarImagenDespensa({ base64, mimeType, modo, uri }) {
  await enCuenta();
  const resultado = await rf("/ocr/analizar", {
    method: "POST",
    body: {
      imagen_base64: base64,
      mime_type: mimeType,
      tipo: modo === "Boleta" ? "boleta" : "lista",
    },
  });
  escaneoPendiente = {
    tipo: resultado.tipo_documento,
    uri,
    items: (resultado.items || []).map((item, index) => ({
      ...item,
      id: `OCR-${Date.now()}-${index}`,
    })),
  };
  return getEscaneoPendiente();
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
  // El plato "de hoy" se identifica por la FECHA (no solo por el nombre del día:
  // "lunes" de otra semana no es hoy) y se prefiere el que aún no se preparó.
  const fechaHoy = hoyIso();
  const delDia = planes.filter((p) => String(p.fecha || "").slice(0, 10) === fechaHoy);
  const planP = delDia.find((p) => !p.completado) || delDia[0] || null;
  const plan = planP ? aPlan(planP, rs) : null;
  const shopList = compras.map((c) => ({ ...c, listo: !!c.listo }));
  return {
    hoy,
    usuario: nombreCompleto,
    primerNombre,
    inicial,
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
  // Plan que se marca como preparado: el de hoy; si no hay, el último pendiente ya vencido.
  const hoy = hoyIso();
  const dia = (x) => String(x.fecha || "").slice(0, 10);
  const deLaReceta = planes.filter((x) => x.receta_id === receta.id);
  const p =
    deLaReceta.find((x) => dia(x) === hoy) ||
    deLaReceta.filter((x) => !x.completado && dia(x) <= hoy).sort((a, b) => dia(b).localeCompare(dia(a)))[0] ||
    null;
  return {
    receta,
    plan: p
      ? {
          id: p.id,
          dia: p.dia,
          fecha: p.fecha,
          comida: p.comida,
          recetaId: p.receta_id,
          porciones: p.porciones,
          completado: !!(p.completado || p.cocinado),
        }
      : null,
  };
}

export async function getPlanSemana() {
  return getPlanSemanaDe();
}

export async function getPlanSemanaDe(desde) {
  if (!(await enCuenta())) {
    const plan = mealPlanMock.map((m) => ({ ...m, receta: D.recetaById(m.recetaId) }));
    return {
      plan,
      pantry: [...pantryMock],
      cobertura: D.planCobertura(plan),
      porComprar: porComprarDe(plan, pantryMock),
    };
  }
  const hasta = desde
    ? (() => {
        const fecha = new Date(`${String(desde).slice(0, 10)}T00:00:00`);
        fecha.setDate(fecha.getDate() + 6);
        return fecha.toISOString().slice(0, 10);
      })()
    : null;
  const desdeUrl = desde ? `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}` : "";
  const [planes, recetas, despensa] = await Promise.all([rf("/planes" + desdeUrl), rf("/recetas"), rf("/despensa")]);
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
  const atencion = items
    .filter((p) => p.estado !== "ok")
    .sort((a, b) => String(a.fechaVencimiento || "9999").localeCompare(String(b.fechaVencimiento || "9999")));
  const recetas = await getRecetasConInsumos(atencion).catch(() => []);
  return { atencion, recetas };
}

// CU-04: recetas que aprovechan los insumos por vencer (las que cubren más insumos primero).
export async function getRecetasConInsumos(insumos = []) {
  if (!insumos.length) return [];
  await enCuenta();
  const recetas = (await rf("/recetas")).map(aReceta);
  const usa = (r, p) => {
    const detalle = r.ingredientes_detalle || [];
    return detalle.length
      ? detalle.some((ing) => D.coincideNombre(ing.nombre, p.nombre))
      : (r.ingredientes || []).some((t) => D.ingredienteCubierto(t, [p]));
  };
  return recetas
    .map((r) => ({ receta: r, usados: insumos.filter((p) => usa(r, p)).map((p) => p.nombre) }))
    .filter((x) => x.usados.length > 0)
    .sort((a, b) => b.usados.length - a.usados.length)
    .slice(0, 3);
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
    return rf("/compras/" + id, {
      method: "PUT",
      body: valor == null ? undefined : { comprado: !!valor },
    });
  }
  const i = shoppingMock.findIndex((x) => x.id === id);
  if (i >= 0) shoppingMock.splice(i, 1, { ...shoppingMock[i], listo: !shoppingMock[i].listo });
  return getCompras();
}

export async function agregarCompra({ nombre, cantidad = "1", unidad_medida = "und", seccion = "Mercado de abastos" }) {
  await enCuenta();
  return rf("/compras", {
    method: "POST",
    body: { nombre, cantidad: String(cantidad), unidad_medida, seccion, comprado: false },
  });
}

export async function crearItemCompra({ nombre, cantidad = "1", unidad_medida, seccion = "Mercado de abastos" } = {}) {
  const limpio = String(nombre || "").trim();
  if (!limpio) throw new Error("Escribe el nombre del ítem.");
  const existentes = await rf("/compras");
  const normalizar = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (existentes.some((item) => normalizar(item.nombre) === normalizar(limpio))) {
    throw new Error("Ese ítem ya está en tu lista.");
  }
  return rf("/compras", {
    method: "POST",
    body: { nombre: limpio, cantidad: String(cantidad || "1"), unidad_medida, seccion, comprado: false },
  });
}

export async function quitarCompra(id) {
  return eliminarCompra(id);
}

export async function quitarComprados() {
  const items = (await rf("/compras")).filter((item) => item.comprado || item.listo);
  for (const item of items) await eliminarCompra(item.id);
  return { quitados: items.length };
}

export async function eliminarCompra(id) {
  await enCuenta();
  return rf("/compras/" + encodeURIComponent(id), { method: "DELETE" });
}

export async function actualizarCompra(id, cambios) {
  await enCuenta();
  return rf("/compras/" + encodeURIComponent(id), { method: "PUT", body: cambios });
}

export async function generarListaCompras(fecha) {
  await enCuenta();
  return rf("/compras/generar", {
    method: "POST",
    body: fecha ? { fecha } : {},
  });
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
    const texto = String(raw || "").trim();
    const m = texto.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([^\s]+)?\s*(?:de\s+)?(.+)$/i);
    const limpio = m ? m[3].trim() : texto;
    const key = norm(limpio);
    if (!limpio || existentes.has(key)) continue;
    existentes.add(key);
    await rf("/compras", {
      method: "POST",
      body: {
        nombre: limpio.charAt(0).toUpperCase() + limpio.slice(1),
        cantidad: m ? m[1].replace(",", ".") : "1",
        unidad_medida: m && m[2] ? m[2] : "und",
        seccion: "Mercado de abastos",
        listo: false,
      },
    });
  }
}

// Último descuento aplicado (para que PRE-02 informe qué no se pudo descontar).
let ultimoDescuento = null;

export function getUltimoDescuento() {
  return ultimoDescuento
    ? { noEncontrados: [...ultimoDescuento.noEncontrados], insuficientes: [...ultimoDescuento.insuficientes] }
    : null;
}

export function limpiarUltimoDescuento() {
  ultimoDescuento = null;
}

// Aplica los descuentos contra /despensa. Como la API actualiza un insumo por
// llamada, si una falla a mitad se revierten las ya aplicadas (reversión
// compensatoria) para no dejar la despensa a medio descontar.
async function descontarReales(descuentos) {
  const items = (await rf("/despensa")).map(aInsumo);
  const { items: nuevos, noEncontrados, insuficientes } = D.descontarConReporte(items, descuentos);
  const aplicados = [];
  try {
    for (let i = 0; i < items.length; i++) {
      if (Number(nuevos[i].cantidad) !== Number(items[i].cantidad)) {
        await rf("/despensa/" + items[i].id, {
          method: "PUT",
          body: { cantidad: nuevos[i].cantidad },
        });
        aplicados.push({ id: items[i].id, antes: items[i].cantidad });
      }
    }
  } catch (_e) {
    let revertido = true;
    for (const a of aplicados.reverse()) {
      try {
        await rf("/despensa/" + a.id, { method: "PUT", body: { cantidad: a.antes } });
      } catch (_e2) {
        revertido = false;
      }
    }
    throw new Error(
      revertido
        ? "No se pudo actualizar la despensa; no se descontó ningún insumo. Inténtalo de nuevo."
        : "La despensa quedó parcialmente actualizada. Revísala en Despensa antes de reintentar."
    );
  }
  ultimoDescuento = { noEncontrados, insuficientes };
  return { cambios: aplicados.length, noEncontrados, insuficientes };
}

export async function descontarAlCocinar(descuentos) {
  if (await enCuenta()) {
    return descontarReales(descuentos);
  }
  descontarDespensa(descuentos);
  return { cambios: 0, noEncontrados: [], insuficientes: [] };
}

export async function ajustarAlCocinar(filas) {
  if (await enCuenta()) {
    const deltas = filas
      .map((f) => ({ label: f.label, qty: Number(f.qty) - Number(f.base), unit: f.unit }))
      .filter((d) => d.qty !== 0);
    if (deltas.length) return descontarReales(deltas);
    return { cambios: 0, noEncontrados: [], insuficientes: [] };
  }
  ajustarDespensa(filas);
  return { cambios: 0, noEncontrados: [], insuficientes: [] };
}

// "Deshacer" de CU-05: devuelve a la despensa lo descontado y reabre el plato del plan.
// La cantidad vuelve al lote que vence más tarde (no se guarda de qué lote salió).
export async function deshacerPreparacion({ filas = [], planId } = {}) {
  await enCuenta();
  const devolver = filas
    .map((f) => ({ label: f.label, qty: -Number(f.base), unit: f.unit }))
    .filter((d) => d.qty !== 0);
  if (devolver.length) await descontarReales(devolver);
  if (planId != null) await actualizarPlan(planId, { completado: false });
  ultimoDescuento = null;
}

export async function getPlanesEntre(desde, hasta) {
  const query = desde && hasta ? `?desde=${encodeURIComponent(desde)}&hasta=${encodeURIComponent(hasta)}` : "";
  return rf("/planes" + query);
}

export async function planificarPlato({ recetaId, fecha, dia, comida = "almuerzo", porciones }) {
  if (await enCuenta()) {
    return rf("/planes", {
      method: "POST",
      body: { fecha, dia, comida, receta_id: recetaId, porciones },
    });
  }
  const p = { id: "M" + (mealPlanMock.length + 1), dia: dia || fecha, fecha, comida, recetaId, porciones };
  mealPlanMock.push(p);
  return p;
}

export async function actualizarPlan(id, { recetaId, fecha, dia, comida, porciones, completado } = {}) {
  const body = {};
  if (recetaId) body.receta_id = recetaId;
  if (fecha) body.fecha = fecha;
  else if (dia) body.dia = dia;
  if (comida) body.comida = comida;
  if (porciones != null) body.porciones = porciones;
  if (completado != null) body.completado = !!completado;
  return rf("/planes/" + encodeURIComponent(id), { method: "PUT", body });
}

export async function eliminarPlan(id) {
  return rf("/planes/" + encodeURIComponent(id), { method: "DELETE" });
}

async function altaEnDespensa(items) {
  let n = 0;
  for (const it of items) {
    const parseada = parseCantidad(it.cantidad);
    const cantidad = typeof it.cantidad === "number" ? it.cantidad : parseada.cantidad;
    const unidad = it.unidad || it.unidad_medida || parseada.unidad;
    await rf("/despensa", {
      method: "POST",
      body: {
        id: it.id || "PX" + Date.now() + "-" + n++,
        nombre: it.nombre,
        categoria: it.categoria || "Otros",
        cantidad,
        unidad,
        fecha_vencimiento: it.fecha_vencimiento || null,
        ubicacion: it.ubicacion || "Despensa",
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

export async function confirmarEscaneo(items) {
  await enCuenta();
  await altaEnDespensa(items);
  ultimosAgregados = items.map((item) => ({ ...item }));
  escaneoPendiente = null;
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
