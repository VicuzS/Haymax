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
    dificultad: "media",
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
];

export const mealPlanMock = [
  { id: "M01", dia: "lunes", comida: "almuerzo", recetaId: "REC-LOMO", porciones: 2 },
  { id: "M02", dia: "martes", comida: "almuerzo", recetaId: "REC-AGALLINA", porciones: 4 },
  { id: "M03", dia: "miercoles", comida: "cena", recetaId: "REC-HUANCaina", porciones: 4 },
];

export const favoritesMock = [{ recetaId: "REC-LOMO", guardadoEn: "2026-09-30" }];
