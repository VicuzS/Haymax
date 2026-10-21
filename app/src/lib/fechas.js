// Utilidades de fecha en local (evita el desfase UTC de toISOString) para el
// calendario de planificación. Compone fechas 'YYYY-MM-DD' desde componentes
// locales y las muestra en español.

export const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const DIAS_CORTOS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Sin acento: coincide con lo que espera la API (`comida`, `dia`).
export const DIAS_LARGOS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];
const DIAS_LARGOS_BONITOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const pad = (n) => String(n).padStart(2, "0");

// Date local -> 'YYYY-MM-DD'.
export function isoDe(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 'YYYY-MM-DD' -> Date local (medianoche).
export function deIso(s) {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function hoyIso() {
  return isoDe(new Date());
}

export function sumarDiasIso(s, n) {
  const d = deIso(s);
  d.setDate(d.getDate() + Number(n));
  return isoDe(d);
}

// Lunes de la semana a la que pertenece `s` (lunes = primer día).
export function lunesDeIso(s) {
  const d = deIso(s);
  const dow = d.getDay(); // 0 = domingo
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return isoDe(d);
}

// "miercoles" -> "miércoles" (bonito para mostrar).
export function diaBonito(dia) {
  const i = DIAS_LARGOS.indexOf(dia);
  return i >= 0 ? DIAS_LARGOS_BONITOS[i] : String(dia);
}

// "miércoles 20 de octubre".
export function fechaLarga(s) {
  const d = deIso(s);
  return `${DIAS_LARGOS_BONITOS[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
}

// "20 de octubre".
export function fechaCorta(s) {
  const d = deIso(s);
  return `${d.getDate()} de ${MESES_ES[d.getMonth()]}`;
}

// Número de semana ISO (para la etiqueta "Semana 47").
export function semanaNumero(s) {
  const d = deIso(s);
  const objetivo = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  // Jueves de esta semana define el año ISO.
  objetivo.setDate(objetivo.getDate() + 3 - ((objetivo.getDay() + 6) % 7));
  const primerJueves = new Date(objetivo.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((objetivo - primerJueves) / 86400000 - 3 + ((primerJueves.getDay() + 6) % 7)) / 7
    )
  );
}

// Cuadrícula del mes: 6 semanas x 7 días, empezando en lunes.
// Cada celda: { iso, dia, fuera } (fuera = pertenece al mes contiguo).
export function cuadriculaMes(anio, mes0) {
  const primero = new Date(anio, mes0, 1);
  const offset = (primero.getDay() + 6) % 7; // lunes=0
  const celdas = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(anio, mes0, 1 - offset + i);
    celdas.push({
      iso: isoDe(d),
      dia: d.getDate(),
      fuera: d.getMonth() !== mes0,
    });
  }
  return celdas;
}

// Días enteros desde hoy hasta `s` (negativo = ya venció). Usa fechas locales.
export function diasHasta(s) {
  return Math.round((deIso(s) - deIso(hoyIso())) / 86400000);
}

// Texto de vencimiento legible (no depende solo del color: 1.4.1).
export function textoVencimiento(dias) {
  if (dias < 0) return dias === -1 ? "Venció ayer" : `Venció hace ${-dias} días`;
  if (dias === 0) return "Vence hoy";
  if (dias === 1) return "Vence mañana";
  return `Vence en ${dias} días`;
}
