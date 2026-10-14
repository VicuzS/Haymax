// Persona 3 — Recetas, ingredientes y motor de disponibilidad.
const express = require("express");
const { db, q, hogarDe } = require("../db");
const { authOpcional, auth } = require("../middleware/auth");
const { mapReceta, aBase, mismoProducto, textoIngrediente } = require("../utils");

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

function favoritosDe(usuarioId) {
  if (!usuarioId) return new Set();
  return new Set(
    q.all("SELECT receta_id FROM favoritos WHERE usuario_id = ?", usuarioId).map((f) => f.receta_id)
  );
}

// Reemplaza los ingredientes de una receta de forma atómica.
// Si se envía un `producto_id` que no existe en el catálogo, se ignora (queda null)
// para no romper la llave foránea.
const insertarIngredientes = db.transaction((recetaId, lista) => {
  q.run("DELETE FROM receta_ingredientes WHERE receta_id = ?", recetaId);
  (lista || []).forEach((it, idx) => {
    const obj = typeof it === "string"
      ? { nombre: it, cantidad: 1, unidad_medida: "und" }
      : {
          nombre: it.nombre,
          cantidad: it.cantidad,
          unidad_medida: it.unidad_medida || it.unidad,
        };
    let productoId = (typeof it === "object" && it && it.producto_id) || null;
    if (productoId != null && !q.get("SELECT 1 FROM catalogo_productos WHERE id = ?", productoId)) {
      productoId = null;
    }
    q.run(
      `INSERT INTO receta_ingredientes (receta_id, producto_id, nombre, cantidad, unidad_medida, opcional, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      recetaId,
      productoId,
      obj.nombre,
      obj.cantidad != null ? obj.cantidad : 1,
      obj.unidad_medida || "und",
      typeof it === "object" && it && it.opcional ? 1 : 0,
      idx
    );
  });
});

// GET /api/recetas?q=pollo&distrito=Surquillo&dificultad=facil&orden=precio&dir=asc&page=1&limit=20
// Devuelve un array (compatible con el app); el total va en la cabecera X-Total-Count.
router.get("/", authOpcional, (req, res) => {
  const { q: term, distrito, dificultad } = req.query;
  const filtros = ["publica = 1"];
  const args = [];
  if (term) {
    filtros.push("(titulo LIKE ? OR descripcion LIKE ?)");
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
  const total = q.get(`SELECT COUNT(*) AS c FROM recetas WHERE ${where}`, ...args).c;

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

  const rows = q.all(
    `SELECT * FROM recetas WHERE ${where} ORDER BY ${col} ${dir}${paginado}`,
    ...args,
    ...paginaArgs
  );

  res.set("X-Total-Count", String(total));
  res.set("X-Page", String(page));
  res.set("X-Limit", String(limit));

  const favs = favoritosDe(req.user && req.user.id);
  const porReceta = new Map();
  for (const i of q.all("SELECT * FROM receta_ingredientes ORDER BY receta_id, orden, id")) {
    if (!porReceta.has(i.receta_id)) porReceta.set(i.receta_id, []);
    porReceta.get(i.receta_id).push(i);
  }
  res.json(
    rows.map((r) =>
      mapReceta(r, { ingredientes: porReceta.get(r.id) || [], favorito: favs.has(r.id) })
    )
  );
});

// — Motor de disponibilidad —

// Despensa del hogar indexada por producto y por nombre.
function despensaDelHogar(hogarId) {
  const lista = hogarId
    ? q.all(
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
router.get("/disponibilidad", authOpcional, (req, res) => {
  const hogarId = req.user ? hogarDe(req.user.id) : null;
  const casa = despensaDelHogar(hogarId);
  const recetas = q.all("SELECT * FROM recetas WHERE publica = 1");

  let salida = recetas.map((r) => {
    const ings = ingredientesDe(r.id).filter((i) => !i.opcional);
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
  });

  if (String(req.query.solo || "") === "disponibles") {
    salida = salida.filter((x) => x.disponible);
  }
  const criterio = String(req.query.orden || "cobertura");
  if (criterio === "precio") salida.sort((a, b) => a.precio - b.precio);
  else if (criterio === "tiempo") salida.sort((a, b) => a.minutos - b.minutos);
  else salida.sort((a, b) => b.cobertura - a.cobertura || a.nombre.localeCompare(b.nombre));

  res.json(salida);
});

// GET /api/recetas/:id
router.get("/:id", authOpcional, (req, res) => {
  const r = q.get("SELECT * FROM recetas WHERE id = ?", req.params.id);
  if (!r) return res.status(404).json({ error: "receta no encontrada" });
  const fav = !!(req.user && q.get(
    "SELECT 1 FROM favoritos WHERE usuario_id = ? AND receta_id = ?",
    req.user.id,
    r.id
  ));
  res.json(mapReceta(r, { ingredientes: ingredientesDe(r.id), favorito: fav }));
});

// POST /api/recetas  (crea la receta y sus ingredientes)
router.post("/", auth, (req, res) => {
  const r = req.body || {};
  const titulo = r.titulo || r.nombre;
  if (!r.id || !titulo) {
    return res.status(400).json({ error: "id y titulo son obligatorios" });
  }
  if (q.get("SELECT id FROM recetas WHERE id = ?", r.id)) {
    return res.status(409).json({ error: "ya existe una receta con ese id" });
  }
  q.run(
    `INSERT INTO recetas
       (id, titulo, descripcion, imagen, porciones, tiempo_preparacion_min, dificultad,
        precio, distrito, nutri_calorias, nutri_proteinas, nutri_carbohidratos, nutri_grasas,
        nutri_fibra, pasos, autor_id, publica)
     VALUES
       (@id, @titulo, @descripcion, @imagen, @porciones, @minutos, @dificultad,
        @precio, @distrito, @calorias, @proteinas, @carbohidratos, @grasas,
        @fibra, @pasos, @autor_id, @publica)`,
    {
      id: r.id,
      titulo,
      descripcion: r.descripcion || null,
      imagen: r.imagen || null,
      porciones: r.porciones || 1,
      minutos: r.tiempo_preparacion_min || r.minutos || 0,
      dificultad: r.dificultad || "facil",
      precio: r.precio || 0,
      distrito: r.distrito || null,
      calorias: r.nutri_calorias || r.calorias || 0,
      proteinas: r.nutri_proteinas || 0,
      carbohidratos: r.nutri_carbohidratos || 0,
      grasas: r.nutri_grasas || 0,
      fibra: r.nutri_fibra || 0,
      pasos: JSON.stringify(r.pasos || []),
      autor_id: req.user.id,
      publica: r.publica === false ? 0 : 1,
    }
  );
  insertarIngredientes(r.id, r.ingredientes);
  res.status(201).json(mapReceta(q.get("SELECT * FROM recetas WHERE id = ?", r.id), {
    ingredientes: ingredientesDe(r.id),
    favorito: false,
  }));
});

// PUT /api/recetas/:id  (edición parcial, incluida la imagen; reemplaza ingredientes si se envían)
router.put("/:id", auth, (req, res) => {
  const existente = q.get("SELECT * FROM recetas WHERE id = ?", req.params.id);
  if (!existente) return res.status(404).json({ error: "receta no encontrada" });
  const r = req.body || {};
  q.run(
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
    r.publica == null ? null : r.publica ? 1 : 0,
    req.params.id
  );
  if (Array.isArray(r.ingredientes)) insertarIngredientes(req.params.id, r.ingredientes);

  const fav = !!(req.user && q.get(
    "SELECT 1 FROM favoritos WHERE usuario_id = ? AND receta_id = ?",
    req.user.id,
    req.params.id
  ));
  res.json(mapReceta(q.get("SELECT * FROM recetas WHERE id = ?", req.params.id), {
    ingredientes: ingredientesDe(req.params.id),
    favorito: fav,
  }));
});

module.exports = router;
