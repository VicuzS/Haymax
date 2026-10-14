// Resuelve la imagen de una receta a un asset local (para funcionar sin
// conexión) y, si no hay asset local, deja el enlace remoto del backend.
// El match es por fragmento del nombre del archivo para tolerar cambios de
// ancho en las URLs de Wikimedia (640px -> 800px, etc.).
const LOCALES = [
  { match: "Lomo_Salteado", src: require("../../assets/recetas/lomo.jpg") },
  { match: "Aji_de_gallina", src: require("../../assets/recetas/aji-gallina.jpg") },
  { match: "Papa_a_la_huancaina", src: require("../../assets/recetas/papa-huancaina.jpg") },
];

export function resolverImagen(imagen) {
  if (!imagen) return null;
  if (typeof imagen === "number") return imagen;
  const hit = LOCALES.find((l) => imagen.includes(l.match));
  return hit ? hit.src : imagen;
}
