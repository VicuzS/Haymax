// Contenido de la Fase 1 (sin backend). Sustituir por haymax-api en Fase 2.

export const recipesMock = [
  {
    id: "REC-LOMO",
    nombre: "Lomo saltado",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Lomo_Salteado.jpg/640px-Lomo_Salteado.jpg",
    minutos: 35,
    porciones: 2,
    calorias: 520,
    ingredientes: ["400 g de lomo", "1 cebolla roja", "2 tomates", "1 ají amarillo", "salsa de soya", "papas fritas"],
    pasos: ["Sellar la carne", "Agregar verduras", "Sazonar con soya", "Servir con arroz y papas"],
    dificultad: "facil",
    precioEstimado: 28.5,
  },
  {
    id: "REC-AGALLINA",
    nombre: "Ají de gallina",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Aji_de_gallina_10.jpg/640px-Aji_de_gallina_10.jpg",
    minutos: 55,
    porciones: 4,
    calorias: 610,
    ingredientes: ["600 g de pollo deshuesado", "3 ajíes amarillos", "galletas de agua", "leche evaporada", "nueces"],
    pasos: ["Cocer el pollo", "Preparar la crema", "Integrar y cocinar", "Servir con arroz y papa"],
    dificultad: "media",
    precioEstimado: 32,
  },
  {
    id: "REC-HUANCaina",
    nombre: "Papa a la huancaína",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Papa_a_la_huancaina.jpg/640px-Papa_a_la_huancaina.jpg",
    minutos: 25,
    porciones: 4,
    calorias: 380,
    ingredientes: ["4 papas amarillas", "2 ajíes amarillos", "queso fresco", "galletas", "leche"],
    pasos: ["Hervir las papas", "Licuar la salsa", "Emplatar y decorar"],
    dificultad: "facil",
    precioEstimado: 14,
  },
];

export const pantryMock = [
  { id: "P01", nombre: "Papa amarilla", categoria: "Verduras", cantidad: 8, unidad: "und", fechaVencimiento: "2026-10-20", estado: "ok" },
  { id: "P02", nombre: "Pollo", categoria: "Carnes", cantidad: 600, unidad: "gr", fechaVencimiento: "2026-10-04", estado: "por-vencer" },
  { id: "P03", nombre: "Leche evaporada", categoria: "Lácteos", cantidad: 2, unidad: "lata", fechaVencimiento: "2026-11-12", estado: "ok" },
  { id: "P04", nombre: "Ají amarillo", categoria: "Verduras", cantidad: 5, unidad: "und", fechaVencimiento: "2026-10-08", estado: "ok" },
  { id: "P05", nombre: "Queso fresco", categoria: "Lácteos", cantidad: 300, unidad: "gr", fechaVencimiento: "2026-10-01", estado: "vencido" },
  { id: "P06", nombre: "Lomo fino", categoria: "Carnes", cantidad: 400, unidad: "gr", fechaVencimiento: "2026-10-12", estado: "ok" },
  { id: "P07", nombre: "Cebolla roja", categoria: "Verduras", cantidad: 2, unidad: "und", fechaVencimiento: "2026-10-18", estado: "ok" },
  { id: "P08", nombre: "Tomate italiano", categoria: "Verduras", cantidad: 4, unidad: "und", fechaVencimiento: "2026-10-15", estado: "ok" },
  { id: "P09", nombre: "Salsa de soya", categoria: "Secos", cantidad: 1, unidad: "botella", fechaVencimiento: "2027-01-30", estado: "ok" },
  { id: "P10", nombre: "Arroz", categoria: "Secos", cantidad: 1, unidad: "kg", fechaVencimiento: "2026-12-30", estado: "ok" },
  { id: "P11", nombre: "Palta", categoria: "Verduras", cantidad: 3, unidad: "und", fechaVencimiento: "2026-10-05", estado: "por-vencer" },
  { id: "P12", nombre: "Huevo", categoria: "Secos", cantidad: 6, unidad: "und", fechaVencimiento: "2026-10-25", estado: "ok" },
];

export const mealPlanMock = [
  { id: "M01", dia: "lunes", comida: "almuerzo", recetaId: "REC-LOMO", porciones: 2 },
  { id: "M02", dia: "martes", comida: "almuerzo", recetaId: "REC-AGALLINA", porciones: 4 },
  { id: "M03", dia: "miercoles", comida: "cena", recetaId: "REC-HUANCaina", porciones: 4 },
];

export const favoritesMock = [{ recetaId: "REC-LOMO", guardadoEn: "2026-09-30" }];

export const shoppingMock = [
  { id: "C01", nombre: "Arroz Costeño 5 kg", seccion: "Supermercado", cantidad: "1", listo: true },
  { id: "C02", nombre: "Aceite Primor 1 L", seccion: "Supermercado", cantidad: "1", listo: true },
  { id: "C03", nombre: "Leche Gloria x6", seccion: "Supermercado", cantidad: "1", listo: true },
  { id: "C04", nombre: "Galletas de agua", seccion: "Supermercado", cantidad: "2", listo: false },
  { id: "C05", nombre: "Nueces 200 g", seccion: "Supermercado", cantidad: "1", listo: false },
  { id: "C06", nombre: "Lomo fino de res", seccion: "Mercado de abastos", cantidad: "500 g", listo: false },
  { id: "C07", nombre: "Cebolla roja", seccion: "Mercado de abastos", cantidad: "2 kg", listo: true },
  { id: "C08", nombre: "Tomate italiano", seccion: "Mercado de abastos", cantidad: "1 kg", listo: true },
  { id: "C09", nombre: "Ají amarillo", seccion: "Mercado de abastos", cantidad: "1 atado", listo: false },
  { id: "C10", nombre: "Papa amarilla", seccion: "Mercado de abastos", cantidad: "3 kg", listo: true },
  { id: "C11", nombre: "Queso fresco", seccion: "Mercado de abastos", cantidad: "300 g", listo: true },
  { id: "C12", nombre: "Huevo", seccion: "Mercado de abastos", cantidad: "1 docena", listo: false },
];

// Fase 2 — escaneo y alta de insumos (DES-04..DES-08).
export const scanMock = [
  { id: "S01", nombre: "Arroz Costeño 5 kg", precio: "S/ 24.90", revisar: false },
  { id: "S02", nombre: "Aceite Primor 1 L", precio: "S/ 12.50", revisar: false },
  { id: "S03", nombre: "Tomate italiano", precio: "?", revisar: true },
  { id: "S04", nombre: "Leche Gloria x6", precio: "S/ 27.60", revisar: false },
];

export const manualAddsMock = [
  { id: "A01", nombre: "Cebolla roja", cantidad: "2 kg" },
  { id: "A02", nombre: "Papa amarilla", cantidad: "3 kg" },
  { id: "A03", nombre: "Ají amarillo", cantidad: "0.250 kg" },
];

// Lo que la última operación agregó (lo muestra DES-08 y pasa a la despensa).
export const lastAddedMock = [
  { id: "L01", nombre: "Tomate italiano", cantidad: "3 und" },
  { id: "L02", nombre: "Leche evaporada", cantidad: "6 und" },
  { id: "L03", nombre: "Fideos tallarín", cantidad: "1 paquete" },
];

export function addLastAdded(items) {
  lastAddedMock.splice(0, lastAddedMock.length, ...items);
  items.forEach((it) => {
    const existe = pantryMock.some((p) => p.nombre === it.nombre);
    if (!existe) {
      pantryMock.push({
        id: "PX" + (pantryMock.length + 1),
        nombre: it.nombre,
        categoria: "Secos",
        cantidad: 1,
        unidad: "und",
        fechaVencimiento: "2026-12-31",
        estado: "ok",
      });
    }
  });
}

// Fase 3 — manda faltantes de una receta a la lista de compras (sin duplicar).
export function agregarALista(ings) {
  ings.forEach((raw) => {
    const limpio = raw.replace(/^[0-9.,]+\s*(g|kg|ml|l|und|unid|atado|docena)?\s*(de\s+)?/i, "").trim();
    const key = (limpio || raw).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const ya = shoppingMock.some(
      (s) => s.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === key
    );
    if (!ya && limpio) {
      shoppingMock.push({
        id: "CL" + (shoppingMock.length + 1),
        nombre: limpio.charAt(0).toUpperCase() + limpio.slice(1),
        seccion: "Mercado de abastos",
        cantidad: "1",
        listo: false,
      });
    }
  });
}
