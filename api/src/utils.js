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
  WHEN fecha_vencimiento IS NULL OR fecha_vencimiento = '' THEN 'ok'
  WHEN date(fecha_vencimiento) < date('now') THEN 'vencido'
  WHEN date(fecha_vencimiento) <= date('now', '+3 day') THEN 'por-vencer'
  ELSE 'ok' END`;

function bucketUnidad(u) {
  const x = norm(u);
  if (["kg", "kilo", "kilos", "kilogramo", "kilogramos", "g", "gr", "gramo", "gramos"].includes(x)) {
    return "peso";
  }
  if (["l", "lt", "litro", "litros", "ml", "mililitros"].includes(x)) return "volumen";
  return "unidad";
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
  textoIngrediente,
  mapReceta,
};
