// Carga inicial de datos de demostración: npm run seed
const bcrypt = require("bcryptjs");
const { q } = require("./db");

const recetas = [
  {
    id: "REC-LOMO", nombre: "Lomo saltado",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Lomo_Salteado.jpg/640px-Lomo_Salteado.jpg",
    minutos: 35, porciones: 2, calorias: 520, dificultad: "media", precio: 28.5,
    ingredientes: ["400 g de lomo", "1 cebolla roja", "2 tomates", "1 ají amarillo", "salsa de soya", "papas fritas"],
    pasos: ["Sellar la carne", "Agregar verduras", "Sazonar con soya", "Servir con arroz y papas"],
  },
  {
    id: "REC-AGALLINA", nombre: "Ají de gallina",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Aji_de_gallina_10.jpg/640px-Aji_de_gallina_10.jpg",
    minutos: 55, porciones: 4, calorias: 610, dificultad: "media", precio: 32,
    ingredientes: ["600 g de pollo", "3 ajíes amarillos", "galletas de agua", "leche evaporada", "nueces"],
    pasos: ["Cocer el pollo", "Preparar la crema", "Integrar y cocinar", "Servir con arroz y papa"],
  },
  {
    id: "REC-HUANCaina", nombre: "Papa a la huancaína",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Papa_a_la_huancaina.jpg/640px-Papa_a_la_huancaina.jpg",
    minutos: 25, porciones: 4, calorias: 380, dificultad: "facil", precio: 14,
    ingredientes: ["4 papas amarillas", "2 ajíes amarillos", "queso fresco", "galletas", "leche"],
    pasos: ["Hervir las papas", "Licuar la salsa", "Emplatar y decorar"],
  },
];

const despensa = [
  { id: "P01", nombre: "Papa amarilla", categoria: "Verduras", cantidad: 8, unidad: "und", fecha_vencimiento: "2026-10-20", estado: "ok" },
  { id: "P02", nombre: "Pollo", categoria: "Carnes", cantidad: 600, unidad: "gr", fecha_vencimiento: "2026-10-04", estado: "por-vencer" },
  { id: "P03", nombre: "Leche evaporada", categoria: "Lácteos", cantidad: 2, unidad: "lata", fecha_vencimiento: "2026-11-12", estado: "ok" },
  { id: "P04", nombre: "Ají amarillo", categoria: "Verduras", cantidad: 5, unidad: "und", fecha_vencimiento: "2026-10-08", estado: "ok" },
  { id: "P05", nombre: "Queso fresco", categoria: "Lácteos", cantidad: 300, unidad: "gr", fecha_vencimiento: "2026-10-01", estado: "vencido" },
];

const planes = [
  { id: "M01", dia: "lunes", comida: "almuerzo", receta_id: "REC-LOMO", porciones: 2 },
  { id: "M02", dia: "martes", comida: "almuerzo", receta_id: "REC-AGALLINA", porciones: 4 },
  { id: "M03", dia: "miercoles", comida: "cena", receta_id: "REC-HUANCaina", porciones: 4 },
];

const insertReceta = `INSERT OR IGNORE INTO recetas
  (id, nombre, imagen, minutos, porciones, calorias, ingredientes, pasos, dificultad, precio)
  VALUES (@id, @nombre, @imagen, @minutos, @porciones, @calorias, @ingredientes, @pasos, @dificultad, @precio)`;

for (const r of recetas) {
  q.run(insertReceta, { ...r, ingredientes: JSON.stringify(r.ingredientes), pasos: JSON.stringify(r.pasos) });
}

const insertItem = `INSERT OR IGNORE INTO despensa
  (id, nombre, categoria, cantidad, unidad, fecha_vencimiento, estado)
  VALUES (@id, @nombre, @categoria, @cantidad, @unidad, @fecha_vencimiento, @estado)`;
for (const d of despensa) q.run(insertItem, d);

for (const p of planes) {
  q.run(
    "INSERT OR IGNORE INTO planes (id, dia, comida, receta_id, porciones) VALUES (@id, @dia, @comida, @receta_id, @porciones)",
    p
  );
}

if (!q.get("SELECT id FROM usuarios WHERE email = ?", "rosa@haymax.pe")) {
  q.run(
    "INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)",
    "Rosa Ticlla",
    "rosa@haymax.pe",
    bcrypt.hashSync("haymax123", 10)
  );
}

console.log("Seed completado: 3 recetas, 5 productos, 3 planes, 1 usuario (rosa@haymax.pe / haymax123)");
