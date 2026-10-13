// Carga inicial de datos de demostración. Ejecutar: npm run seed
// Es idempotente: usa ids fijos + INSERT OR IGNORE, se puede repetir sin duplicar.
const bcrypt = require("bcryptjs");
const { db, q, hogarDe } = require("./db");
const { lunesDe, sumarDias } = require("./utils");

// — Catálogo de productos (ids fijos) —
const productos = [
  { id: 1, nombre: "Papa amarilla", categoria: "Verduras", unidad_medida_base: "und" },
  { id: 2, nombre: "Pollo", categoria: "Carnes", unidad_medida_base: "gr" },
  { id: 3, nombre: "Leche evaporada", categoria: "Lácteos", unidad_medida_base: "lata" },
  { id: 4, nombre: "Ají amarillo", categoria: "Verduras", unidad_medida_base: "und" },
  { id: 5, nombre: "Queso fresco", categoria: "Lácteos", unidad_medida_base: "gr" },
  { id: 6, nombre: "Lomo fino", categoria: "Carnes", unidad_medida_base: "gr" },
  { id: 7, nombre: "Cebolla roja", categoria: "Verduras", unidad_medida_base: "und" },
  { id: 8, nombre: "Tomate italiano", categoria: "Verduras", unidad_medida_base: "und" },
  { id: 9, nombre: "Salsa de soya", categoria: "Secos", unidad_medida_base: "botella" },
  { id: 10, nombre: "Arroz", categoria: "Secos", unidad_medida_base: "kg" },
  { id: 11, nombre: "Palta", categoria: "Verduras", unidad_medida_base: "und" },
  { id: 12, nombre: "Huevo", categoria: "Secos", unidad_medida_base: "und" },
  { id: 13, nombre: "Galletas de agua", categoria: "Secos", unidad_medida_base: "paquete" },
  { id: 14, nombre: "Nueces", categoria: "Secos", unidad_medida_base: "gr" },
  { id: 15, nombre: "Papas fritas", categoria: "Congelados", unidad_medida_base: "gr" },
  { id: 16, nombre: "Leche", categoria: "Lácteos", unidad_medida_base: "ml" },
];

// — Recetas —
const recetas = [
  {
    id: "REC-LOMO",
    titulo: "Lomo saltado",
    descripcion: "Clásico salteado de lomo de res con cebolla, tomate y ají amarillo.",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Lomo_Salteado.jpg/640px-Lomo_Salteado.jpg",
    porciones: 2,
    tiempo_preparacion_min: 35,
    dificultad: "facil",
    precio: 28.5,
    distrito: "Surquillo",
    nutri_calorias: 520,
    nutri_proteinas: 32,
    nutri_carbohidratos: 40,
    nutri_grasas: 22,
    nutri_fibra: 4,
    pasos: ["Sellar la carne", "Agregar verduras", "Sazonar con soya", "Servir con arroz y papas"],
  },
  {
    id: "REC-AGALLINA",
    titulo: "Ají de gallina",
    descripcion: "Crema de ají amarillo con pollo deshilachado y galletas de agua.",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Aji_de_gallina_10.jpg/640px-Aji_de_gallina_10.jpg",
    porciones: 4,
    tiempo_preparacion_min: 55,
    dificultad: "media",
    precio: 32,
    distrito: "Surquillo",
    nutri_calorias: 610,
    nutri_proteinas: 35,
    nutri_carbohidratos: 48,
    nutri_grasas: 28,
    nutri_fibra: 3,
    pasos: ["Cocer el pollo", "Preparar la crema", "Integrar y cocinar", "Servir con arroz y papa"],
  },
  {
    id: "REC-HUANCAINA",
    titulo: "Papa a la huancaína",
    descripcion: "Papas amarillas bañadas en salsa huancaína de ají y queso fresco.",
    imagen: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Papa_a_la_huancaina.jpg/640px-Papa_a_la_huancaina.jpg",
    porciones: 4,
    tiempo_preparacion_min: 25,
    dificultad: "facil",
    precio: 14,
    distrito: "Surquillo",
    nutri_calorias: 380,
    nutri_proteinas: 12,
    nutri_carbohidratos: 42,
    nutri_grasas: 18,
    nutri_fibra: 5,
    pasos: ["Hervir las papas", "Licuar la salsa", "Emplatar y decorar"],
  },
];

// — Ingredientes de cada receta (ids fijos) —
const ingredientes = [
  { id: 1, receta_id: "REC-LOMO", producto_id: 6, nombre: "Lomo fino", cantidad: 400, unidad_medida: "gr", orden: 0 },
  { id: 2, receta_id: "REC-LOMO", producto_id: 7, nombre: "Cebolla roja", cantidad: 1, unidad_medida: "und", orden: 1 },
  { id: 3, receta_id: "REC-LOMO", producto_id: 8, nombre: "Tomate italiano", cantidad: 2, unidad_medida: "und", orden: 2 },
  { id: 4, receta_id: "REC-LOMO", producto_id: 4, nombre: "Ají amarillo", cantidad: 1, unidad_medida: "und", orden: 3 },
  { id: 5, receta_id: "REC-LOMO", producto_id: 9, nombre: "Salsa de soya", cantidad: 3, unidad_medida: "cda", orden: 4 },
  { id: 6, receta_id: "REC-LOMO", producto_id: 15, nombre: "Papas fritas", cantidad: 200, unidad_medida: "gr", orden: 5 },
  { id: 7, receta_id: "REC-LOMO", producto_id: 10, nombre: "Arroz", cantidad: 200, unidad_medida: "gr", orden: 6 },
  { id: 8, receta_id: "REC-AGALLINA", producto_id: 2, nombre: "Pollo", cantidad: 600, unidad_medida: "gr", orden: 0 },
  { id: 9, receta_id: "REC-AGALLINA", producto_id: 4, nombre: "Ají amarillo", cantidad: 3, unidad_medida: "und", orden: 1 },
  { id: 10, receta_id: "REC-AGALLINA", producto_id: 13, nombre: "Galletas de agua", cantidad: 6, unidad_medida: "und", orden: 2 },
  { id: 11, receta_id: "REC-AGALLINA", producto_id: 3, nombre: "Leche evaporada", cantidad: 1, unidad_medida: "lata", orden: 3 },
  { id: 12, receta_id: "REC-AGALLINA", producto_id: 14, nombre: "Nueces", cantidad: 50, unidad_medida: "gr", orden: 4 },
  { id: 13, receta_id: "REC-AGALLINA", producto_id: 10, nombre: "Arroz", cantidad: 300, unidad_medida: "gr", orden: 5 },
  { id: 14, receta_id: "REC-HUANCAINA", producto_id: 1, nombre: "Papa amarilla", cantidad: 4, unidad_medida: "und", orden: 0 },
  { id: 15, receta_id: "REC-HUANCAINA", producto_id: 4, nombre: "Ají amarillo", cantidad: 2, unidad_medida: "und", orden: 1 },
  { id: 16, receta_id: "REC-HUANCAINA", producto_id: 5, nombre: "Queso fresco", cantidad: 200, unidad_medida: "gr", orden: 2 },
  { id: 17, receta_id: "REC-HUANCAINA", producto_id: 13, nombre: "Galletas de agua", cantidad: 4, unidad_medida: "und", orden: 3 },
  { id: 18, receta_id: "REC-HUANCAINA", producto_id: 16, nombre: "Leche", cantidad: 100, unidad_medida: "ml", orden: 4 },
];

// — Despensa inicial (espejo de pantryMock; ids fijos) —
const despensa = [
  { id: 1, producto_id: 1, nombre: "Papa amarilla", cantidad: 8, unidad_medida: "und", fecha_vencimiento: "2026-10-20", ubicacion: "Despensa" },
  { id: 2, producto_id: 2, nombre: "Pollo", cantidad: 600, unidad_medida: "gr", fecha_vencimiento: "2026-10-04", ubicacion: "Refrigerador" },
  { id: 3, producto_id: 3, nombre: "Leche evaporada", cantidad: 2, unidad_medida: "lata", fecha_vencimiento: "2026-11-12", ubicacion: "Despensa" },
  { id: 4, producto_id: 4, nombre: "Ají amarillo", cantidad: 5, unidad_medida: "und", fecha_vencimiento: "2026-10-08", ubicacion: "Refrigerador" },
  { id: 5, producto_id: 5, nombre: "Queso fresco", cantidad: 300, unidad_medida: "gr", fecha_vencimiento: "2026-10-01", ubicacion: "Refrigerador" },
  { id: 6, producto_id: 6, nombre: "Lomo fino", cantidad: 400, unidad_medida: "gr", fecha_vencimiento: "2026-10-12", ubicacion: "Refrigerador" },
  { id: 7, producto_id: 7, nombre: "Cebolla roja", cantidad: 2, unidad_medida: "und", fecha_vencimiento: "2026-10-18", ubicacion: "Despensa" },
  { id: 8, producto_id: 8, nombre: "Tomate italiano", cantidad: 4, unidad_medida: "und", fecha_vencimiento: "2026-10-15", ubicacion: "Refrigerador" },
  { id: 9, producto_id: 9, nombre: "Salsa de soya", cantidad: 1, unidad_medida: "botella", fecha_vencimiento: "2027-01-30", ubicacion: "Despensa" },
  { id: 10, producto_id: 10, nombre: "Arroz", cantidad: 1, unidad_medida: "kg", fecha_vencimiento: "2026-12-30", ubicacion: "Despensa" },
  { id: 11, producto_id: 11, nombre: "Palta", cantidad: 3, unidad_medida: "und", fecha_vencimiento: "2026-10-05", ubicacion: "Refrigerador" },
  { id: 12, producto_id: 12, nombre: "Huevo", cantidad: 6, unidad_medida: "und", fecha_vencimiento: "2026-10-25", ubicacion: "Refrigerador" },
];

// — Lista de compras inicial (espejo de shoppingMock) —
const compras = [
  { id: 1, nombre: "Arroz Costeño 5 kg", cantidad: "1", unidad_medida: "paquete", seccion: "Supermercado", comprado: 1 },
  { id: 2, nombre: "Aceite Primor 1 L", cantidad: "1", unidad_medida: "botella", seccion: "Supermercado", comprado: 1 },
  { id: 3, nombre: "Leche Gloria x6", cantidad: "1", unidad_medida: "paquete", seccion: "Supermercado", comprado: 1 },
  { id: 4, nombre: "Galletas de agua", cantidad: "2", unidad_medida: "paquete", seccion: "Supermercado", comprado: 0 },
  { id: 5, nombre: "Nueces 200 g", cantidad: "1", unidad_medida: "paquete", seccion: "Supermercado", comprado: 0 },
  { id: 6, nombre: "Lomo fino de res", cantidad: "500 g", unidad_medida: "gr", seccion: "Mercado de abastos", comprado: 0 },
  { id: 7, nombre: "Cebolla roja", cantidad: "2 kg", unidad_medida: "kg", seccion: "Mercado de abastos", comprado: 1 },
  { id: 8, nombre: "Tomate italiano", cantidad: "1 kg", unidad_medida: "kg", seccion: "Mercado de abastos", comprado: 1 },
  { id: 9, nombre: "Ají amarillo", cantidad: "1 atado", unidad_medida: "atado", seccion: "Mercado de abastos", comprado: 0 },
  { id: 10, nombre: "Papa amarilla", cantidad: "3 kg", unidad_medida: "kg", seccion: "Mercado de abastos", comprado: 1 },
  { id: 11, nombre: "Queso fresco", cantidad: "300 g", unidad_medida: "gr", seccion: "Mercado de abastos", comprado: 1 },
  { id: 12, nombre: "Huevo", cantidad: "1 docena", unidad_medida: "docena", seccion: "Mercado de abastos", comprado: 0 },
];

const lunes = lunesDe();

const seed = db.transaction(() => {
  // 1) Usuario demo
  let rosa = q.get("SELECT * FROM usuarios WHERE email = ?", "rosa@haymax.pe");
  if (!rosa) {
    const r = q.run(
      "INSERT INTO usuarios (email, password_hash, nombre, foto_url, distrito) VALUES (?, ?, ?, ?, ?)",
      "rosa@haymax.pe",
      bcrypt.hashSync("haymax123", 10),
      "Rosa Ticlla",
      null,
      "Surquillo"
    );
    rosa = q.get("SELECT * FROM usuarios WHERE id = ?", Number(r.lastInsertRowid));
  }

  // 2) Hogar de Rosa + membresía
  const hogar = hogarDe(rosa.id);
  q.run(
    "INSERT OR IGNORE INTO hogar_integrantes (hogar_id, usuario_id, rol) VALUES (?, ?, 'admin')",
    hogar,
    rosa.id
  );

  // 3) Catálogo
  const insProducto = db.prepare(
    "INSERT OR IGNORE INTO catalogo_productos (id, nombre, categoria, unidad_medida_base) VALUES (@id, @nombre, @categoria, @unidad_medida_base)"
  );
  for (const p of productos) insProducto.run(p);

  // 4) Recetas
  const insReceta = db.prepare(
    `INSERT OR IGNORE INTO recetas
       (id, titulo, descripcion, imagen, porciones, tiempo_preparacion_min, dificultad, precio,
        distrito, nutri_calorias, nutri_proteinas, nutri_carbohidratos, nutri_grasas, nutri_fibra,
        pasos, autor_id, publica)
     VALUES
       (@id, @titulo, @descripcion, @imagen, @porciones, @tiempo_preparacion_min, @dificultad, @precio,
        @distrito, @nutri_calorias, @nutri_proteinas, @nutri_carbohidratos, @nutri_grasas, @nutri_fibra,
        @pasos, @autor_id, 1)`
  );
  for (const r of recetas) {
    insReceta.run({ ...r, pasos: JSON.stringify(r.pasos), autor_id: rosa.id });
  }

  // 5) Ingredientes de recetas
  const insIng = db.prepare(
    `INSERT OR IGNORE INTO receta_ingredientes
       (id, receta_id, producto_id, nombre, cantidad, unidad_medida, opcional, orden)
     VALUES (@id, @receta_id, @producto_id, @nombre, @cantidad, @unidad_medida, 0, @orden)`
  );
  for (const i of ingredientes) insIng.run(i);

  // 6) Despensa del hogar
  const insDespensa = db.prepare(
    `INSERT OR IGNORE INTO despensa
       (id, hogar_id, producto_id, nombre, cantidad, unidad_medida, fecha_vencimiento, ubicacion)
     VALUES (@id, @hogar_id, @producto_id, @nombre, @cantidad, @unidad_medida, @fecha_vencimiento, @ubicacion)`
  );
  for (const d of despensa) insDespensa.run({ ...d, hogar_id: hogar });

  // 7) Planes de la semana actual (lunes, martes, miércoles)
  const insPlan = db.prepare(
    `INSERT OR IGNORE INTO planes
       (id, hogar_id, receta_id, fecha, comida, porciones, completado)
     VALUES (@id, @hogar_id, @receta_id, @fecha, @comida, @porciones, 0)`
  );
  insPlan.run({ id: 1, hogar_id: hogar, receta_id: "REC-LOMO", fecha: lunes, comida: "almuerzo", porciones: 2 });
  insPlan.run({ id: 2, hogar_id: hogar, receta_id: "REC-AGALLINA", fecha: sumarDias(lunes, 1), comida: "almuerzo", porciones: 4 });
  insPlan.run({ id: 3, hogar_id: hogar, receta_id: "REC-HUANCAINA", fecha: sumarDias(lunes, 2), comida: "cena", porciones: 4 });

  // 8) Lista de compras
  const insCompra = db.prepare(
    `INSERT OR IGNORE INTO compras
       (id, hogar_id, nombre, cantidad, unidad_medida, seccion, comprado)
     VALUES (@id, @hogar_id, @nombre, @cantidad, @unidad_medida, @seccion, @comprado)`
  );
  for (const c of compras) insCompra.run({ ...c, hogar_id: hogar });

  // 9) Favorito de ejemplo
  q.run("INSERT OR IGNORE INTO favoritos (usuario_id, receta_id) VALUES (?, ?)", rosa.id, "REC-LOMO");

  return { hogar, usuario: rosa.email };
});

const info = seed();
console.log(
  `Seed completado: usuario ${info.usuario} / haymax123, hogar #${info.hogar}, ` +
    `${productos.length} productos, ${recetas.length} recetas, ${despensa.length} insumos, ` +
    `${compras.length} compras, 3 planes, 1 favorito`
);
