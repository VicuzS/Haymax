// Helpers compartidos: fechas, normalización de texto y mapeo BD -> API.
// Este módulo NO accede a la base de datos (es puro) para poder reutilizarlo.
const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

// "Ají" y "aji" deben compararse igual.
function norm(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function sumarDias(iso, dias) {
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  d.setDate(d.getDate() + Number(dias));
  return d.toISOString().slice(0, 10);
}

// Lunes ISO de la semana a la que pertenece `iso`.
function lunesDe(iso = hoy()) {
  const d = new Date(String(iso).slice(0, 10) + "T00:00:00");
  const dow = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d.toISOString().slice(0, 10);
}

function diaSemana(fecha) {
  const d = new Date(String(fecha).slice(0, 10) + "T00:00:00");
  return DIAS[d.getDay()];
}

// "lunes" -> fecha ISO de esa ocurrencia dentro de la semana actual.
function fechaDeDia(dia, base = hoy()) {
  const objetivo = DIAS.indexOf(norm(dia));
  if (objetivo < 0) return String(base).slice(0, 10);
  const offset = objetivo === 0 ? 6 : objetivo - 1;
  return sumarDias(lunesDe(base), offset);
}

// Estado de vencimiento calculado por SQLite (3 días de aviso).
const ESTADO_SQL = `CASE
  WHEN fecha_vencimiento IS NULL THEN 'ok'
  WHEN fecha_vencimiento < CURRENT_DATE THEN 'vencido'
  WHEN fecha_vencimiento <= CURRENT_DATE + 3 THEN 'por-vencer'
  ELSE 'ok' END`;

const UNIDADES_PESO_KG = ["kg", "kilo", "kilos", "kilogramo", "kilogramos"];
const UNIDADES_PESO_G = ["g", "gr", "gramo", "gramos"];
const UNIDADES_VOL_L = ["l", "lt", "litro", "litros"];
const UNIDADES_VOL_ML = ["ml", "mililitros"];

function bucketUnidad(u) {
  const x = norm(u);
  if (UNIDADES_PESO_KG.includes(x) || UNIDADES_PESO_G.includes(x)) return "peso";
  if (UNIDADES_VOL_L.includes(x) || UNIDADES_VOL_ML.includes(x)) return "volumen";
  return "unidad";
}

// Convierte (cantidad, unidad) a una base comparable entre sí:
// peso -> gramos, volumen -> mililitros, resto -> unidades.
function aBase(cantidad, unidad) {
  const n = Number(cantidad) || 0;
  const u = norm(unidad);
  if (UNIDADES_PESO_KG.includes(u)) return { bucket: "peso", base: n * 1000 };
  if (UNIDADES_PESO_G.includes(u)) return { bucket: "peso", base: n };
  if (UNIDADES_VOL_L.includes(u)) return { bucket: "volumen", base: n * 1000 };
  if (UNIDADES_VOL_ML.includes(u)) return { bucket: "volumen", base: n };
  return { bucket: "unidad", base: n };
}

// ¿Dos nombres de producto se refieren a lo mismo? (ignora acentos/mayúsculas)
function mismoProducto(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const corto = x.length <= y.length ? x : y;
  const largo = x.length <= y.length ? y : x;
  return corto.length >= 4 && largo.includes(corto);
}

// Texto legible de un ingrediente: "400 gr de lomo".
function textoIngrediente(i) {
  const partes = [i.cantidad != null ? i.cantidad : "", i.unidad_medida || "", "de", i.nombre];
  return partes.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

// Fila de `recetas` + sus ingredientes -> forma que espera el frontend.
function mapReceta(r, { ingredientes = [], favorito = false } = {}) {
  if (!r) return null;
  let pasos = [];
  try {
    pasos = JSON.parse(r.pasos || "[]");
  } catch (_e) {
    pasos = [];
  }
  return {
    id: r.id,
    // nombres que consume el app
    nombre: r.titulo,
    minutos: r.tiempo_preparacion_min,
    calorias: r.nutri_calorias,
    // nombres canónicos de la BD
    titulo: r.titulo,
    descripcion: r.descripcion,
    imagen: r.imagen,
    porciones: r.porciones,
    tiempo_preparacion_min: r.tiempo_preparacion_min,
    dificultad: r.dificultad,
    precio: r.precio,
    distrito: r.distrito,
    nutri_calorias: r.nutri_calorias,
    nutri_proteinas: r.nutri_proteinas,
    nutri_carbohidratos: r.nutri_carbohidratos,
    nutri_grasas: r.nutri_grasas,
    nutri_fibra: r.nutri_fibra,
    ingredientes: ingredientes.map(textoIngrediente),
    ingredientes_detalle: ingredientes,
    pasos,
    esFavorito: !!favorito,
  };
}

module.exports = {
  DIAS,
  norm,
  hoy,
  sumarDias,
  lunesDe,
  diaSemana,
  fechaDeDia,
  ESTADO_SQL,
  bucketUnidad,
  aBase,
  mismoProducto,
  textoIngrediente,
  mapReceta,
};
