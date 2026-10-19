// Persona 3 — Recetas, ingredientes y motor de disponibilidad.
const express = require("express");
const { db, q, hogarDe } = require("../db");
const { authOpcional, auth } = require("../middleware/auth");
const { mapReceta, aBase, mismoProducto, textoIngrediente } = require("../utils");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

// Columnas blancas para ordenar (evita inyección en ORDER BY).
const ORDEN = {
  nombre: "titulo",
  titulo: "titulo",
  precio: "precio",
  tiempo: "tiempo_preparacion_min",
  minutos: "tiempo_preparacion_min",
  dificultad: "dificultad",
  calorias: "nutri_calorias",
};

function ingredientesDe(recetaId) {
  return q.all(
    "SELECT * FROM receta_ingredientes WHERE receta_id = ? ORDER BY orden, id",
    recetaId
  );
}

async function favoritosDe(usuarioId) {
  if (!usuarioId) return new Set();
  return new Set(
    (await q.all("SELECT receta_id FROM favoritos WHERE usuario_id = ?", usuarioId)).map((f) => f.receta_id)
  );
}

// Reemplaza los ingredientes de una receta de forma atómica.
// Si se envía un `producto_id` que no existe en el catálogo, se ignora (queda null)
// para no romper la llave foránea.
async function insertarIngredientes(tx, recetaId, lista) {
  await tx.run("DELETE FROM receta_ingredientes WHERE receta_id = ?", recetaId);
  for (const [idx, it] of (lista || []).entries()) {
    const obj = typeof it === "string"
      ? { nombre: it, cantidad: 1, unidad_medida: "und" }
      : {
          nombre: it.nombre,
          cantidad: it.cantidad,
          unidad_medida: it.unidad_medida || it.unidad,
        };
    let productoId = (typeof it === "object" && it && it.producto_id) || null;
    if (productoId != null && !await tx.get("SELECT 1 FROM catalogo_productos WHERE id = ?", productoId)) {
      productoId = null;
    }
    await tx.run(
      `INSERT INTO receta_ingredientes (receta_id, producto_id, nombre, cantidad, unidad_medida, opcional, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      recetaId,
      productoId,
      obj.nombre,
      obj.cantidad != null ? obj.cantidad : 1,
      obj.unidad_medida || "und",
      typeof it === "object" && it && it.opcional ? true : false,
      idx
    );
  }
}

// GET /api/recetas?q=pollo&distrito=Surquillo&dificultad=facil&orden=precio&dir=asc&page=1&limit=20
// Devuelve un array (compatible con el app); el total va en la cabecera X-Total-Count.
router.get("/", authOpcional, asyncHandler(async (req, res) => {
  const { q: term, distrito, dificultad } = req.query;
  const filtros = ["publica = TRUE"];
  const args = [];
  if (term) {
    filtros.push("(titulo ILIKE ? OR descripcion ILIKE ?)");
    args.push(`%${term}%`, `%${term}%`);
  }
  if (distrito) {
    filtros.push("(distrito IS NULL OR distrito = ?)");
    args.push(distrito);
  }
  if (dificultad) {
    filtros.push("dificultad = ?");
    args.push(dificultad);
  }
  const where = filtros.join(" AND ");
  const total = (await q.get(`SELECT COUNT(*) AS c FROM recetas WHERE ${where}`, ...args)).c;

  const col = ORDEN[String(req.query.orden || "").toLowerCase()] || "titulo";
  const dir = String(req.query.dir || "").toLowerCase() === "desc" ? "DESC" : "ASC";
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 0, 0), 100);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

  let paginado = "";
  const paginaArgs = [];
  if (limit > 0) {
    paginado = " LIMIT ? OFFSET ?";
    paginaArgs.push(limit, (page - 1) * limit);
  }

  const rows = await q.all(
    `SELECT * FROM recetas WHERE ${where} ORDER BY ${col} ${dir}${paginado}`,
    ...args,
    ...paginaArgs
  );

  res.set("X-Total-Count", String(total));
  res.set("X-Page", String(page));
  res.set("X-Limit", String(limit));

  const favs = await favoritosDe(req.user && req.user.id);
  const porReceta = new Map();
  for (const i of await q.all("SELECT * FROM receta_ingredientes ORDER BY receta_id, orden, id")) {
    if (!porReceta.has(i.receta_id)) porReceta.set(i.receta_id, []);
    porReceta.get(i.receta_id).push(i);
  }
  res.json(
    rows.map((r) =>
      mapReceta(r, { ingredientes: porReceta.get(r.id) || [], favorito: favs.has(r.id) })
    )
  );
}));

// — Motor de disponibilidad —

// Despensa del hogar indexada por producto y por nombre.
async function despensaDelHogar(hogarId) {
  const lista = hogarId
    ? await q.all(
        "SELECT producto_id, nombre, cantidad, unidad_medida FROM despensa WHERE hogar_id = ?",
        hogarId
      )
    : [];
  const porProducto = new Map();
  for (const d of lista) {
    if (d.producto_id != null && !porProducto.has(d.producto_id)) porProducto.set(d.producto_id, d);
  }
  return { porProducto, lista };
}

function buscarEnCasa(ing, casa) {
  if (ing.producto_id != null && casa.porProducto.has(ing.producto_id)) {
    return casa.porProducto.get(ing.producto_id);
  }
  return casa.lista.find((d) => mismoProducto(d.nombre, ing.nombre)) || null;
}

// Cuánto de un ingrediente está cubierto (0..1) según la despensa.
function evaluarIngrediente(ing, casa) {
  const enCasa = buscarEnCasa(ing, casa);
  if (!enCasa) return { cubierto: 0, falta: textoIngrediente(ing) };

  const req = aBase(ing.cantidad, ing.unidad_medida);
  const disp = aBase(enCasa.cantidad, enCasa.unidad_medida);

  // Unidad no cuantificable o distinta: basta con que exista.
  if (req.bucket !== disp.bucket || req.base <= 0) {
    return { cubierto: 1, falta: null };
  }
  const ratio = Math.min(1, disp.base / req.base);
  return { cubierto: ratio, falta: ratio >= 1 ? null : textoIngrediente(ing) };
}

// GET /api/recetas/disponibilidad?orden=cobertura&solo=disponibles
router.get("/disponibilidad", authOpcional, asyncHandler(async (req, res) => {
  const hogarId = req.user ? await hogarDe(req.user.id) : null;
  const casa = await despensaDelHogar(hogarId);
  const recetas = await q.all("SELECT * FROM recetas WHERE publica = TRUE");

  let salida = await Promise.all(recetas.map(async (r) => {
    const ings = (await ingredientesDe(r.id)).filter((i) => !i.opcional);
    let cubierto = 0;
    const faltantes = [];
    for (const i of ings) {
      const e = evaluarIngrediente(i, casa);
      cubierto += e.cubierto;
      if (e.falta) faltantes.push(e.falta);
    }
    const cobertura = ings.length ? Math.round((cubierto / ings.length) * 100) : 100;
    return {
      id: r.id,
      nombre: r.titulo,
      imagen: r.imagen,
      minutos: r.tiempo_preparacion_min,
      porciones: r.porciones,
      precio: r.precio,
      disponible: faltantes.length === 0,
      cobertura,
      faltantes,
      faltantes_count: faltantes.length,
      nutricion: {
        calorias: r.nutri_calorias,
        proteinas: r.nutri_proteinas,
        carbohidratos: r.nutri_carbohidratos,
        grasas: r.nutri_grasas,
        fibra: r.nutri_fibra,
      },
    };
  }));

  if (String(req.query.solo || "") === "disponibles") {
    salida = salida.filter((x) => x.disponible);
  }
  const criterio = String(req.query.orden || "cobertura");
  if (criterio === "precio") salida.sort((a, b) => a.precio - b.precio);
  else if (criterio === "tiempo") salida.sort((a, b) => a.minutos - b.minutos);
  else salida.sort((a, b) => b.cobertura - a.cobertura || a.nombre.localeCompare(b.nombre));

  res.json(salida);
}));

// GET /api/recetas/:id
router.get("/:id", authOpcional, asyncHandler(async (req, res) => {
  const r = await q.get("SELECT * FROM recetas WHERE id = ?", req.params.id);
  if (!r) return res.status(404).json({ error: "receta no encontrada" });
  const fav = !!(req.user && await q.get(
    "SELECT 1 FROM favoritos WHERE usuario_id = ? AND receta_id = ?",
    req.user.id,
    r.id
  ));
  res.json(mapReceta(r, { ingredientes: await ingredientesDe(r.id), favorito: fav }));
}));

// POST /api/recetas  (crea la receta y sus ingredientes)
router.post("/", auth, asyncHandler(async (req, res) => {
  const r = req.body || {};
  const titulo = r.titulo || r.nombre;
  if (!r.id || !titulo) {
    return res.status(400).json({ error: "id y titulo son obligatorios" });
  }
  if (await q.get("SELECT id FROM recetas WHERE id = ?", r.id)) {
    return res.status(409).json({ error: "ya existe una receta con ese id" });
  }
  const creada = await db.transaction(async (tx) => {
    await tx.run(
      `INSERT INTO recetas
         (id, titulo, descripcion, imagen, porciones, tiempo_preparacion_min, dificultad,
          precio, distrito, nutri_calorias, nutri_proteinas, nutri_carbohidratos, nutri_grasas,
          nutri_fibra, pasos, autor_id, publica)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      r.id,
      titulo,
      r.descripcion || null,
      r.imagen || null,
      r.porciones || 1,
      r.tiempo_preparacion_min || r.minutos || 0,
      r.dificultad || "facil",
      r.precio || 0,
      r.distrito || null,
      r.nutri_calorias || r.calorias || 0,
      r.nutri_proteinas || 0,
      r.nutri_carbohidratos || 0,
      r.nutri_grasas || 0,
      r.nutri_fibra || 0,
      JSON.stringify(r.pasos || []),
      req.user.id,
      r.publica === false ? false : true
    );
    await insertarIngredientes(tx, r.id, r.ingredientes);
    return {
      receta: await tx.get("SELECT * FROM recetas WHERE id = ?", r.id),
      ingredientes: await tx.all("SELECT * FROM receta_ingredientes WHERE receta_id = ? ORDER BY orden, id", r.id),
    };
  });
  res.status(201).json(mapReceta(creada.receta, { ingredientes: creada.ingredientes, favorito: false }));
}));

// PUT /api/recetas/:id  (edición parcial, incluida la imagen; reemplaza ingredientes si se envían)
router.put("/:id", auth, asyncHandler(async (req, res) => {
  const existente = await q.get("SELECT * FROM recetas WHERE id = ?", req.params.id);
  if (!existente) return res.status(404).json({ error: "receta no encontrada" });
  const r = req.body || {};
  const actualizado = await db.transaction(async (tx) => {
    const update = await tx.run(
    `UPDATE recetas SET
       titulo                 = COALESCE(?, titulo),
       descripcion            = COALESCE(?, descripcion),
       imagen                 = COALESCE(?, imagen),
       porciones              = COALESCE(?, porciones),
       tiempo_preparacion_min = COALESCE(?, tiempo_preparacion_min),
       dificultad             = COALESCE(?, dificultad),
       precio                 = COALESCE(?, precio),
       distrito               = COALESCE(?, distrito),
       nutri_calorias         = COALESCE(?, nutri_calorias),
       nutri_proteinas        = COALESCE(?, nutri_proteinas),
       nutri_carbohidratos    = COALESCE(?, nutri_carbohidratos),
       nutri_grasas           = COALESCE(?, nutri_grasas),
       nutri_fibra            = COALESCE(?, nutri_fibra),
       pasos                  = COALESCE(?, pasos),
       publica                = COALESCE(?, publica)
     WHERE id = ?`,
    r.titulo ?? r.nombre ?? null,
    r.descripcion ?? null,
    r.imagen ?? null,
    r.porciones ?? null,
    (r.tiempo_preparacion_min ?? r.minutos) ?? null,
    r.dificultad ?? null,
    r.precio ?? null,
    r.distrito ?? null,
    (r.nutri_calorias ?? r.calorias) ?? null,
    r.nutri_proteinas ?? null,
    r.nutri_carbohidratos ?? null,
    r.nutri_grasas ?? null,
    r.nutri_fibra ?? null,
    r.pasos ? JSON.stringify(r.pasos) : null,
     r.publica == null ? null : !!r.publica,
     req.params.id
    );
    if (!update.changes) return null;
    if (Array.isArray(r.ingredientes)) await insertarIngredientes(tx, req.params.id, r.ingredientes);
    return {
      receta: await tx.get("SELECT * FROM recetas WHERE id = ?", req.params.id),
      ingredientes: await tx.all("SELECT * FROM receta_ingredientes WHERE receta_id = ? ORDER BY orden, id", req.params.id),
    };
  });
  if (!actualizado) return res.status(404).json({ error: "receta no encontrada" });

  const fav = !!(req.user && await q.get(
    "SELECT 1 FROM favoritos WHERE usuario_id = ? AND receta_id = ?",
    req.user.id,
    req.params.id
  ));
  res.json(mapReceta(actualizado.receta, {
    ingredientes: actualizado.ingredientes,
    favorito: fav,
  }));
}));

module.exports = router;
