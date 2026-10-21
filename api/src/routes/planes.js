// Persona 4 — Planificación semanal.
const express = require("express");
const { q, hogarDe } = require("../db");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { diaSemana, fechaDeDia, hoy } = require("../utils");

const router = express.Router();
router.use(auth);

// BD -> forma del app (agrega `dia` derivado de la fecha).
function aPlan(r) {
  if (!r) return null;
  return {
    id: r.id,
    fecha: r.fecha,
    dia: diaSemana(r.fecha),
    comida: r.comida,
    receta_id: r.receta_id,
    porciones: r.porciones,
    completado: !!r.completado,
  };
}

// GET /api/planes?desde=2026-10-13&hasta=2026-10-19
router.get("/", asyncHandler(async (req, res) => {
  const hogarId = await hogarDe(req.user.id);
  const { desde, hasta } = req.query;
  let rows;
  if (desde && hasta) {
    rows = await q.all(
      "SELECT * FROM planes WHERE hogar_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha, comida",
      hogarId,
      desde,
      hasta
    );
  } else {
    rows = await q.all("SELECT * FROM planes WHERE hogar_id = ? ORDER BY fecha, comida", hogarId);
  }
  res.json(rows.map(aPlan));
}));

const COMIDAS = ["desayuno", "almuerzo", "cena"];

// POST /api/planes  (acepta `fecha` ISO o `dia` tipo "lunes")
router.post("/", asyncHandler(async (req, res) => {
  const p = req.body || {};
  if (!p.receta_id || !p.comida) {
    return res.status(400).json({ error: "receta_id y comida son obligatorios" });
  }
  if (COMIDAS.indexOf(p.comida) === -1) {
    return res.status(400).json({ error: "comida inválida: usa desayuno, almuerzo o cena" });
  }
  // Validamos la receta ANTES de insertar (la llave foránea mandaría un 500).
  const receta = await q.get("SELECT id FROM recetas WHERE id = ?", p.receta_id);
  if (!receta) {
    return res.status(400).json({ error: "la receta no existe" });
  }
  const fecha = p.fecha || (p.dia ? fechaDeDia(p.dia) : hoy());
  const hogarId = await hogarDe(req.user.id);
  // RETURNING * reemplaza al lastInsertRowid de SQLite (no existe en PostgreSQL).
  const r = await q.run(
    `INSERT INTO planes (hogar_id, receta_id, fecha, comida, porciones, completado)
     VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    hogarId,
    p.receta_id,
    fecha,
    p.comida,
    p.porciones || 1,
    p.completado ? 1 : 0
  );
  res.status(201).json(aPlan(r.row));
}));

// PUT /api/planes/:id
router.put("/:id", asyncHandler(async (req, res) => {
  const p = req.body || {};
  const hogarId = await hogarDe(req.user.id);
  if (p.receta_id) {
    const receta = await q.get("SELECT id FROM recetas WHERE id = ?", p.receta_id);
    if (!receta) return res.status(400).json({ error: "la receta no existe" });
  }
  // Conversión dia↔fecha también al editar (guía: p. ej. mover el plato al sábado).
  if (!p.fecha && p.dia) p.fecha = fechaDeDia(p.dia);
  const r = await q.run(
    `UPDATE planes SET
       receta_id  = COALESCE(?, receta_id),
       fecha      = COALESCE(?, fecha),
       comida     = COALESCE(?, comida),
       porciones  = COALESCE(?, porciones),
       completado = COALESCE(?, completado)
     WHERE id = ? AND hogar_id = ?`,
    p.receta_id ?? null,
    p.fecha ?? null,
    p.comida ?? null,
    p.porciones ?? null,
    p.completado == null ? null : p.completado ? 1 : 0,
    req.params.id,
    hogarId
  );
  if (!r.changes) return res.status(404).json({ error: "plan no encontrado" });
  res.json(aPlan(await q.get("SELECT * FROM planes WHERE id = ?", Number(req.params.id))));
}));

// DELETE /api/planes/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  const hogarId = await hogarDe(req.user.id);
  const r = await q.run("DELETE FROM planes WHERE id = ? AND hogar_id = ?", req.params.id, hogarId);
  if (!r.changes) return res.status(404).json({ error: "plan no encontrado" });
  res.status(204).end();
}));

module.exports = router;
