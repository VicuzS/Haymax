/**
 * Correcciones de flujo del inventario -> prototipo Figma (prototipo/code.js)
 * + regeneración de metadatos y stubs de la app (app/src/screens/*).
 *
 * Uso: node tools/apply_flow_fixes.js
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const CODE = path.join(ROOT, "prototipo", "code.js");
const META = path.join(ROOT, "app", "tools", "_screens_meta.json");
const GEN = path.join(ROOT, "app", "tools", "_gen_screens.js");

let raw = fs.readFileSync(CODE, "utf8");
const S = JSON.parse(raw.match(/var SCREENS = (\[[\s\S]*?\]);/)[1]);
const L = JSON.parse(raw.match(/var LINKS = (\{[\s\S]*?\});/)[1]);

const get = (id) => S.find((x) => x.id === id);
const setItems = (id, items) => (get(id).items = items);
const setLinks = (id, links) => (L[id] = links);
const push = (id, item) => {
  const it = get(id).items;
  if (!it.some((x) => x[0] === item[0] && x[1] === item[1])) it.push(item);
};

/* 1) PLA-01 — selector de día + "Cancelar" real (antes era texto decorativo) */
setItems("PLA-01", [
  ["sec", "Paso 1 de 2"],
  ["card", "Lomo Saltado Criollo", "4 porciones · 25 min", null, "Cambiar"],
  ["sec", "¿Para cuándo lo planeas?"],
  ["chips", ["Hoy", "Mañana", "Vi", "Sá", "Do"], "Hoy"],
  ["text", "La semana completa se edita en tu plan (7 días)."],
  ["edit", "Porciones", "4"],
  ["note", "Recalcularemos insumos y lista de compras automáticamente."],
  ["btn", "Confirmar porciones"],
  ["link", "Ver resultado con faltantes (demo)", "CENTER"],
  ["link", "Ver conflicto de horario (demo)", "CENTER"],
  ["link", "Cancelar", "CENTER"],
]);
setLinks("PLA-01", { 1: "REC-02", 7: "PLA-02", 8: "PLA-03", 9: "PLA-04", 10: "INI-01" });

/* 2) INI-01 — hub completo (antes solo tenía 6 elementos; faltaban plato hoy,
      despensa, ahorro, motor, lista de compras y el plan) */
setItems("INI-01", [
  ["greet", "Hola, Rosa", "Martes 19 de noviembre · Surquillo"],
  ["card", "🍽 Plato planeado hoy", "Almuerzo · Ají de Gallina · 4 porciones", null, "Ver"],
  ["link", "Ya lo preparé · descontar insumos"],
  ["link", "Ver mi plan de la semana"],
  ["link", "Planificar un plato nuevo"],
  ["sec", "Tu despensa", "Ver todo"],
  ["chips", ["12 disponibles", "3 por vencer"], "3 por vencer"],
  ["note", "3 insumos vencen en menos de 3 días: revísalos hoy."],
  ["stat", "S/ 42", "Ahorro acumulado vs delivery", "+ S/ 12"],
  ["balance", "BALANCE DE LA SEMANA", "78%", "Tu semana va balanceada: 3 proteínas, 5 verduras y 2 frituras.", "Ver resumen nutricional →"],
  ["sec", "💡 ¿Qué puedo cocinar?", "Abrir motor"],
  ["photo", { img: "lomo", title: "Lomo Saltado Criollo", sub: "Rinde 4 porciones generosas", price: "S/ 8.50", time: "25 min", status: "✓ Se puede preparar", cta: "Cocinar ahora →" }],
  ["photo", { img: "gallina", title: "Ají de Gallina Clásico", sub: "Te falta: 1 atado de palta", subColor: "B26A00", price: "S/ 6.20", time: "40 min", h: 240, ih: 140 }],
  ["card", "Lista de compras", "7 de 12 artículos listos", null, "Ver"],
  ["sec", "📍 Precios e insumos cerca de ti", "Otros distritos"],
]);
setLinks("INI-01", {
  1: "REC-02", 2: "PRE-01", 3: "PLA-05", 4: "PLA-01", 5: "DES-01", 7: "PRE-03",
  9: "SAL-01", 10: "REC-01", 11: "REC-02", 12: "REC-02", 13: "COM-01", 14: "INI-03",
});

/* 3) ACC-04 — "Empezar" iba siempre a INI-01; queda INI-02 huérfano */
setItems("ACC-04", [
  ["sec", "¿Dónde vives?"],
  ["input", "Busca tu distrito…"],
  ["row", "Surquillo", "✓", null, "📍"],
  ["row", "Miraflores", "", null, "📍"],
  ["row", "Lima Norte", "", null, "📍"],
  ["sec", "¿Quién cocina en casa?"],
  ["row", "Rosa Ticlla", "Admin", null, "R"],
  ["row", "Diego Lopez", "Miembro", "9E9E9E", "D"],
  ["btno", "+ Agregar integrante"],
  ["btn", "Empezar"],
  ["link", "¿Ya tienes cuenta? Inicia sesión"],
  ["link", "Ya usé Haymax antes · ir a mi inicio"],
]);
setLinks("ACC-04", { 8: "AJU-03", 9: "INI-02", 10: "ACC-02", 11: "INI-01" });

/* 4) DES-03 — "¿Por qué tres formas?" apuntaba a ACC-03 (onboarding): sin destino */
setItems("DES-03", [
  ["sec", "¿Cómo quieres agregar insumos?"],
  ["card", "Escanear boleta"],
  ["card", "Escanear lista de compras"],
  ["card", "Agregar manualmente"],
  ["text", "Tres formas según lo que tengas a mano: boleta, lista o a mano."],
]);
setLinks("DES-03", { 1: "DES-04", 2: "DES-04", 3: "DES-06" });

/* 5) COM-01 — "Registrar compra escaneada" debe ir a la cámara (DES-04) */
setLinks("COM-01", { 8: "DES-06", 9: "DES-04" });

/* 6) REC-01 — faltaban salidas a DES-03 (insumo que falta) y PLA-01 (planificar) */
push("REC-01", ["link", "Falta 1 insumo → agregarlo a mi despensa"]);
push("REC-01", ["link", "Planificar con lo que tengo"]);
setLinks("REC-01", { 2: "REC-02", 4: "REC-02", 6: "INI-03", 7: "DES-03", 8: "PLA-01" });

/* 7) DES-05 / DES-06 — faltaban "repetir escaneo" y "volver a opciones" */
push("DES-05", ["link", "Repetir escaneo", "CENTER"]);
setLinks("DES-05", { 7: "DES-08", 8: "DES-06", 9: "DES-04" });
push("DES-06", ["link", "Volver a las opciones de alta"]);
setLinks("DES-06", { 5: "DES-07", 6: "DES-03" });

/* 8) PLA-03 — "agregar faltantes a mi lista" no llevaba a la lista + Cancelar */
push("PLA-03", ["link", "Ver mi lista de compras", "CENTER"]);
push("PLA-03", ["link", "Cancelar", "CENTER"]);
setLinks("PLA-03", { 7: "PLA-05", 8: "PLA-05", 9: "COM-01", 10: "PLA-01" });

/* 9) PLA-05 — 7 días + estado por tarjeta + editar por tarjeta + cobertura */
setItems("PLA-05", [
  ["chips", ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"], "Ma"],
  ["sec", "Martes 19 de noviembre"],
  ["card", "Almuerzo · Lomo Saltado", "Falta 1 insumo", "B26A00", "Ver"],
  ["link", "Editar almuerzo del martes"],
  ["card", "Cena · Ají de Gallina", "Completa", "2E7D32", "Ver"],
  ["link", "Editar cena del martes"],
  ["sec", "Miércoles 20 de noviembre"],
  ["card", "Almuerzo · Seco de Res", "Falta 2 insumos", "B26A00", "Ver"],
  ["link", "Editar almuerzo del miércoles"],
  ["note", "Si cambias tu despensa, el plan se recalcula solo."],
  ["text", "Cobertura de la semana: 6 de 14 comidas planificadas · 4 insumos por comprar."],
  ["link", "Ya cociné este plato · descontar insumos", "CENTER"],
  ["btn", "Generar lista de compras"],
]);
setLinks("PLA-05", {
  2: "REC-02", 3: "PLA-01", 4: "REC-02", 5: "PLA-01", 7: "REC-02", 8: "PLA-01",
  11: "PRE-01", 12: "COM-01",
});

/* 10) PRE-02 — faltaba volver al inicio */
push("PRE-02", ["link", "Volver a mi inicio", "CENTER"]);
setLinks("PRE-02", { 7: "DES-01", 8: "SAL-01", 9: "INI-01" });

/* 11) PRE-03 — el texto "editar desde la despensa" ahora navega a DES-02 */
setItems("PRE-03", [
  ["banner", "Vencen en 2 días · 3 insumos"],
  ["sec", "Usarlos ya"],
  ["card", "Palta · 2 unidades"],
  ["card", "Leche · 1 litro"],
  ["card", "Cilantro · 1 atado"],
  ["btn", "Cocinar con estos insumos"],
  ["btno", "Marcar como descartado"],
  ["link", "Editar el ítem desde la despensa"],
]);
setLinks("PRE-03", { 2: "REC-02", 3: "REC-02", 4: "REC-02", 5: "PRE-01", 6: "DES-01", 7: "DES-02" });

/* 12) AJU-01 — filas con valor a la derecha y destino para el perfil */
setItems("AJU-01", [
  ["row", "Rosa Ticlla", "Admin", null, "R"],
  ["row", "Mi distrito", "Surquillo", null, "📍"],
  ["row", "Notificaciones", "Activadas", null, "🔔"],
  ["row", "Exclusiones", "2 activas", null, "🚫"],
  ["row", "Integrantes del hogar", "2", null, "👪"],
  ["row", "Plan de suscripción", "Gratis", null, "★"],
  ["btno", "Cerrar sesión"],
]);
setLinks("AJU-01", { 0: "AJU-03", 1: "ACC-04", 3: "AJU-02", 4: "AJU-03", 5: "AJU-04", 6: "ACC-02" });

/* 13) AJU-02 — faltaba ver el impacto en el motor */
push("AJU-02", ["link", "Ver recetas que se verán afectadas"]);
setLinks("AJU-02", { 7: "AJU-01", 8: "REC-01" });

/* 14) AJU-04 — texto final convertido en acceso de prueba al OCR (DES-05) */
setItems("AJU-04", [
  ["sec", "Haymax Gratis"],
  ["card", "OCR limitado"],
  ["card", "Salud resumida"],
  ["sec", "Haymax Premium"],
  ["banner", "S/ 12.90 al mes"],
  ["row", "OCR ilimitado"],
  ["row", "Recomendaciones por distrito"],
  ["row", "Resumen de salud completo"],
  ["btn", "Suscribirme"],
  ["link", "Probar el escaneo (OCR ilimitado en Premium)"],
]);
setLinks("AJU-04", { 8: "AJU-01", 9: "DES-05" });

/* 15) ACC-02 — "Regístrate" no hacía nada (mismo destino que Continuar) */
setLinks("ACC-02", { 3: "ACC-03", 4: "INI-01", 6: "INI-01", 7: "INI-01" });

/* 16) ACC-01 — el splash tenia un unico destino; el doc pide ademas INI-01 */
setItems("ACC-01", [
  ["logo", "Cocina con lo que ya tienes"],
  ["link", "¿Ya tenías sesión? Entra a mi inicio", "CENTER"],
]);
setLinks("ACC-01", { 0: "ACC-02", 1: "INI-01" });

/* 16b) DES-01 — badges de vencimiento (3 por vencer, igual que PRE-03) */
setItems("DES-01", [
  ["input", "Buscar insumo…"],
  ["chips", ["Todos", "Verduras", "Lácteos", "Secos"], "Todos"],
  ["row", "Tomate italiano", "3 unid", null, "🍅"],
  ["row", "Leche evaporada", "6 unid · por vencer", "B26A00", "🥛"],
  ["row", "Fideos tallarín", "1 paquete", null, "🍞"],
  ["row", "Palta", "2 unid · por vencer", "B26A00", "🫐"],
  ["row", "Cilantro", "1 atado · por vencer", "B26A00", "🌿"],
  ["note", "3 insumos vencen en menos de 3 días: revisa la alerta."],
]);
setLinks("DES-01", {
  2: "DES-02", 3: "DES-02", 4: "DES-02", 5: "DES-02", 6: "DES-02", 7: "PRE-03",
});

/* 16c) DES-08 — el CTA decía "a mi plan" pero va al paso 1 de planificar */
setItems("DES-08", [
  ["check", "Insumos agregados a tu despensa"],
  ["row", "Tomate italiano", "3 unid", null, "🍅"],
  ["row", "Leche evaporada", "6 unid", null, "🥛"],
  ["row", "Fideos tallarín", "1 paquete", null, "🍞"],
  ["text", "Ya puedes usarlos en el motor de recetas."],
  ["btn", "Continuar y planificar"],
  ["btno", "Ver mi despensa"],
]);
setLinks("DES-08", { 5: "PLA-01", 6: "DES-01" });

/* 16d) PLA-05 — navegación de semana + bloque "Próxima semana" (no hay que
       esperar al lunes para planificar) */
setItems("PLA-05", [
  ["chips", ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"], "Ma"],
  ["sec", "Semana del 18–24 de noviembre", "‹ ›"],
  ["sec", "Martes 19 de noviembre"],
  ["card", "Almuerzo · Lomo Saltado", "Falta 1 insumo", "B26A00", "Ver"],
  ["link", "Editar almuerzo del martes"],
  ["card", "Cena · Ají de Gallina", "Completa", "2E7D32", "Ver"],
  ["link", "Editar cena del martes"],
  ["sec", "Miércoles 20 de noviembre"],
  ["card", "Almuerzo · Seco de Res", "Falta 2 insumos", "B26A00", "Ver"],
  ["link", "Editar almuerzo del miércoles"],
  ["note", "Si cambias tu despensa, el plan se recalcula solo."],
  ["text", "Cobertura de la semana: 6 de 14 comidas planificadas · 4 insumos por comprar."],
  ["link", "Ya cociné este plato · descontar insumos", "CENTER"],
  ["sec", "Próxima semana · 25 nov – 1 dic"],
  ["empty", "Aún no hay platos en esta semana", "Puedes planificar desde hoy: no hace falta esperar al lunes."],
  ["btn", "Planificar un plato para esa semana"],
  ["btn", "Generar lista de compras"],
]);
setLinks("PLA-05", {
  3: "REC-02", 4: "PLA-01", 5: "REC-02", 6: "PLA-01", 8: "REC-02", 9: "PLA-01",
  12: "PRE-01", 15: "PLA-01", 16: "COM-01",
});

/* 16e) PLA-01 — chips incluyen el lunes siguiente (planificación anticipada) */
(function () {
  var it = get("PLA-01").items;
  for (var i = 0; i < it.length; i++) {
    if (it[i][0] === "chips") {
      it[i] = ["chips", ["Hoy", "Mañana", "Sábado", "Próx. lunes"], "Hoy"];
    }
  }
})();

/* 17) ACC-02 — modo invitado: usar la app sin cuenta (datos locales) */
setItems("ACC-02", [
  ["text", "Bienvenido de vuelta", "1F1F1F"],
  ["input", "correo@unmsm.edu.pe"],
  ["input", "••••••••"],
  ["text", "¿No tienes cuenta? Regístrate"],
  ["btn", "Continuar"],
  ["link", "Entrar sin cuenta · se guarda en este dispositivo", "CENTER"],
  ["text", "o continúa con"],
  ["btno", "Google"],
  ["btno", "Apple"],
]);
setLinks("ACC-02", { 3: "ACC-03", 4: "INI-01", 5: "INI-01", 7: "INI-01", 8: "INI-01" });

/* 18) INI-01 — menos densidad: hoy + alerta + planificar arriba;
       se quita una foto duplicada del motor (REC-01 ya la muestra) y la
       sugerencia pasa a tarjeta compacta sin imagen (la foto esta en REC-02) */
setItems("INI-01", [
  ["greet", "Hola, Rosa", "Martes 19 de noviembre · Surquillo"],
  ["card", "🍽 Plato planeado hoy", "Almuerzo · Ají de Gallina · 4 porciones", null, "Ver"],
  ["link", "Ya lo preparé · descontar insumos"],
  ["link", "Planificar un plato nuevo"],
  ["link", "Ver mi plan de la semana"],
  ["sec", "Tu despensa", "Ver todo"],
  ["chips", ["12 disponibles", "3 por vencer"], "3 por vencer"],
  ["note", "3 insumos vencen en menos de 3 días: revísalos hoy."],
  ["card", "Lista de compras", "7 de 12 artículos listos", null, "Ver"],
  ["sec", "💡 ¿Qué puedo cocinar?", "Abrir motor"],
  ["card", "🍽 Lomo Saltado Criollo", "4 porciones · 25 min · S/ 8.50 por porción", null, "Ver"],
  ["stat", "S/ 42", "Ahorro acumulado vs delivery", "+ S/ 12"],
  ["balance", "BALANCE DE LA SEMANA", "78%", "Tu semana va balanceada: 3 proteínas, 5 verduras y 2 frituras.", "Ver resumen nutricional →"],
  ["sec", "📍 Precios e insumos cerca de ti", "Otros distritos"],
]);
setLinks("INI-01", {
  1: "REC-02", 2: "PRE-01", 3: "PLA-01", 4: "PLA-05", 5: "DES-01", 7: "PRE-03",
  8: "COM-01", 9: "REC-01", 10: "REC-02", 12: "SAL-01", 13: "INI-03",
});

/* 19) AJU-04 — sin jerga: OCR -> escaneo */
setItems("AJU-04", [
  ["sec", "Haymax Gratis"],
  ["card", "Escaneo limitado"],
  ["card", "Salud resumida"],
  ["sec", "Haymax Premium"],
  ["banner", "S/ 12.90 al mes"],
  ["row", "Escaneo ilimitado"],
  ["row", "Recomendaciones por distrito"],
  ["row", "Resumen de salud completo"],
  ["btn", "Suscribirme"],
  ["link", "Probar el escaneo ilimitado (Premium)"],
]);

/* 20) PLA-04 — lenguaje cotidiano en vez de "conflicto/reemplazar" */
setItems("PLA-04", [
  ["banner", "Ya tienes Lomo Saltado el martes a las 13:00", "Elige qué hacer con el plato nuevo", "PRIMARY", 56],
  ["radio", "Quitar el plato anterior", "Solo quedará el plato nuevo el martes", true],
  ["radio", "Dejar los dos platos", "Habrá dos platos a la misma hora", false],
  ["note", "Ambas opciones mantienen tus porciones y tu lista."],
  ["btn", "Confirmar"],
  ["link", "Cancelar (demo)", "CENTER"],
]);

/* 17) COM-01 — "Agregar ítem manual" iba a DES-06; el documento lo lleva a DES-03 */
setLinks("COM-01", { 8: "DES-03", 9: "DES-04" });

/* 18) DES-04 — faltaba volver a las opciones (DES-03) y el selector de modo */
setItems("DES-04", [
  ["chips", ["Boleta", "Lista de compras"], "Boleta"],
  ["camera"],
  ["link", "También puedes usar una foto de la galería."],
  ["note", "Consejos: buena luz, plano completo y sin sombras."],
  ["link", "Elegir otro tipo de documento"],
]);
setLinks("DES-04", { 1: "DES-05", 2: "DES-05", 4: "DES-03" });

/* 21) DES-05 — nombre de la pantalla sin jerga (OCR -> escaneo) */
get("DES-05").name = "Revisión del escaneo";

/* ---------- reescribir prototipo/code.js ---------- */
const iS = raw.indexOf("var SCREENS = ");
const iB = raw.indexOf("\nbuild();");
if (iS < 0 || iB < 0) throw new Error("marcadores no encontrados en code.js");
const rebuilt =
  raw.slice(0, iS) +
  "var SCREENS = " + JSON.stringify(S) + ";\n\n" +
  "var LINKS = " + JSON.stringify(L) + ";\n" +
  raw.slice(iB);
fs.writeFileSync(CODE, rebuilt, "utf8");

/* ---------- regenerar metadatos + stubs de la app ---------- */
const meta = {
  screens: S.map((x) => ({
    id: x.id, name: x.name, chrome: x.chrome === undefined ? "normal" : x.chrome,
    tab: x.tab === undefined ? null : x.tab, hasFab: !!x.hasFab, items: (x.items || []).length,
  })),
  links: L,
};
fs.writeFileSync(META, JSON.stringify(meta, null, 1), "utf8");
const gen = spawnSync(process.execPath, [GEN], { stdio: "inherit" });
if (gen.status !== 0) throw new Error("fallo _gen_screens.js");

console.log("OK: code.js parcheado (" + S.length + " pantallas), meta y stubs regenerados.");
