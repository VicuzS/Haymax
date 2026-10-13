// Persona 3 — Recetas y motor de disponibilidad.
const express = require("express");
const { q, hogarDe } = require("../db");
const { authOpcional, auth } = require("../middleware/auth");
const { mapReceta, norm, textoIngrediente } = require("../utils");

const router = express.Router();

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

// GET /api/recetas?q=pollo&distrito=Surquillo
router.get("/", authOpcional, (req, res) => {
  const { q: term, distrito } = req.query;
  const filtros = ["publica = 1"];
  const args = [];
  if (term) {
    filtros.push("titulo LIKE ?");
    args.push(`%${term}%`);
  }
  if (distrito) {
    filtros.push("(distrito IS NULL OR distrito = ?)");
    args.push(distrito);
  }
  const rows = q.all(
    `SELECT * FROM recetas WHERE ${filtros.join(" AND ")} ORDER BY titulo`,
    ...args
  );
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

// GET /api/recetas/disponibilidad  (cruza recetas con la despensa del hogar)
router.get("/disponibilidad", authOpcional, (req, res) => {
  const hogarId = req.user ? hogarDe(req.user.id) : null;
  const enCasa = [];
  if (hogarId) {
    for (const d of q.all("SELECT nombre, cantidad, unidad_medida FROM despensa WHERE hogar_id = ?", hogarId)) {
      enCasa.push({ clave: norm(d.nombre), cantidad: Number(d.cantidad || 0), unidad: d.unidad_medida });
    }
  }
  const recetas = q.all("SELECT * FROM recetas WHERE publica = 1 ORDER BY titulo");
  res.json(
    recetas.map((r) => {
      const ings = ingredientesDe(r.id);
      const faltantes = [];
      let tengo = 0;
      for (const i of ings) {
        const clave = norm(i.nombre);
        const hay = enCasa.some((e) => e.clave === clave || e.clave.includes(clave) || clave.includes(e.clave));
        if (hay) tengo += 1;
        else faltantes.push(textoIngrediente(i));
      }
      return {
        id: r.id,
        nombre: r.titulo,
        imagen: r.imagen,
        minutos: r.tiempo_preparacion_min,
        porciones: r.porciones,
        precio: r.precio,
        disponible: faltantes.length === 0,
        cobertura: ings.length ? Math.round((tengo / ings.length) * 100) : 100,
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
    })
  );
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
  q.run(
    `INSERT OR REPLACE INTO recetas
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

  q.run("DELETE FROM receta_ingredientes WHERE receta_id = ?", r.id);
  const ings = r.ingredientes || [];
  ings.forEach((it, idx) => {
    const obj = typeof it === "string"
      ? { nombre: it, cantidad: 1, unidad_medida: "und" }
      : { nombre: it.nombre, cantidad: it.cantidad, unidad_medida: it.unidad_medida || it.unidad };
    q.run(
      `INSERT INTO receta_ingredientes (receta_id, producto_id, nombre, cantidad, unidad_medida, opcional, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      r.id,
      it.producto_id || null,
      obj.nombre,
      obj.cantidad != null ? obj.cantidad : 1,
      obj.unidad_medida || "und",
      it.opcional ? 1 : 0,
      idx
    );
  });

  res.status(201).json(mapReceta(q.get("SELECT * FROM recetas WHERE id = ?", r.id), {
    ingredientes: ingredientesDe(r.id),
  }));
});

module.exports = router;
