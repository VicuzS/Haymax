// app/src/lib/distritos.js
export const DISTRITOS_LIMA = [
  "Lima Cercado", "Barranco", "Breña", "Chorrillos", "El Agustino",
  "Independencia", "Jesús María", "La Molina", "La Victoria", "Lince",
  "Los Olivos", "Magdalena del Mar", "Miraflores", "Pueblo Libre",
  "Rímac", "San Borja", "San Isidro", "San Juan de Lurigancho",
  "San Juan de Miraflores", "San Luis", "San Martín de Porres",
  "San Miguel", "Santa Anita", "Santiago de Surco", "Surquillo",
  "Villa El Salvador", "Villa María del Triunfo",
  "Callao", "Bellavista", "Carmen de la Legua", "La Perla", "La Punta",
  "Mi Perú", "Ventanilla",
].sort((a, b) => a.localeCompare(b, "es"));

export function normalizarTexto(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function buscarDistritos(query) {
  const q = normalizarTexto(query).trim();
  if (!q) return DISTRITOS_LIMA;
  return DISTRITOS_LIMA.filter((d) => normalizarTexto(d).includes(q));
}