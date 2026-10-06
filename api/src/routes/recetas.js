const express = require("express");
const { q, parseReceta } = require("../db");
const { auth } = require("../auth");

const router = express.Router();

// GET /api/recetas?q=pollo  → listado o búsqueda
router.get("/", (req, res) => {
  const { q: term } = req.query;
  const rows = term
    ? q.all("SELECT * FROM recetas WHERE nombre LIKE ? ORDER BY nombre", `%${term}%`)
    : q.all("SELECT * FROM recetas ORDER BY nombre");
  res.json(rows.map(parseReceta));
});

router.get("/:id", (req, res) => {
  const row = q.get("SELECT * FROM recetas WHERE id = ?", req.params.id);
  if (!row) return res.status(404).json({ error: "receta no encontrada" });
  res.json(parseReceta(row));
});

// POST /api/recetas → requiere sesión (Fase 2: alta de recetas)
router.post("/", auth, (req, res) => {
  const r = req.body || {};
  if (!r.id || !r.nombre) return res.status(400).json({ error: "id y nombre son obligatorios" });
  q.run(
    `INSERT INTO recetas (id, nombre, imagen, minutos, porciones, calorias, ingredientes, pasos, dificultad, precio)
     VALUES (@id, @nombre, @imagen, @minutos, @porciones, @calorias, @ingredientes, @pasos, @dificultad, @precio)`,
    {
      id: r.id,
      nombre: r.nombre,
      imagen: r.imagen || "",
      minutos: r.minutos || 0,
      porciones: r.porciones || 1,
      calorias: r.calorias || 0,
      ingredientes: JSON.stringify(r.ingredientes || []),
      pasos: JSON.stringify(r.pasos || []),
      dificultad: r.dificultad || "facil",
      precio: r.precio || 0,
    }
  );
  res.status(201).json(parseReceta(q.get("SELECT * FROM recetas WHERE id = ?", r.id)));
});

module.exports = router;
