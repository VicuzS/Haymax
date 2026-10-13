// Persona 4 — Planificación semanal.
const express = require("express");
const { q, hogarDe } = require("../db");
const { auth } = require("../middleware/auth");
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
router.get("/", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  const { desde, hasta } = req.query;
  let rows;
  if (desde && hasta) {
    rows = q.all(
      "SELECT * FROM planes WHERE hogar_id = ? AND fecha BETWEEN ? AND ? ORDER BY fecha, comida",
      hogarId,
      desde,
      hasta
    );
  } else {
    rows = q.all("SELECT * FROM planes WHERE hogar_id = ? ORDER BY fecha, comida", hogarId);
  }
  res.json(rows.map(aPlan));
});

// POST /api/planes  (acepta `fecha` ISO o `dia` tipo "lunes")
router.post("/", (req, res) => {
  const p = req.body || {};
  if (!p.receta_id || !p.comida) {
    return res.status(400).json({ error: "receta_id y comida son obligatorios" });
  }
  const fecha = p.fecha || (p.dia ? fechaDeDia(p.dia) : hoy());
  const hogarId = hogarDe(req.user.id);
  const r = q.run(
    `INSERT INTO planes (hogar_id, receta_id, fecha, comida, porciones, completado)
     VALUES (?, ?, ?, ?, ?, ?)`,
    hogarId,
    p.receta_id,
    fecha,
    p.comida,
    p.porciones || 1,
    p.completado ? 1 : 0
  );
  res.status(201).json(aPlan(q.get("SELECT * FROM planes WHERE id = ?", Number(r.lastInsertRowid))));
});

// PUT /api/planes/:id
router.put("/:id", (req, res) => {
  const p = req.body || {};
  const hogarId = hogarDe(req.user.id);
  const r = q.run(
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
  res.json(aPlan(q.get("SELECT * FROM planes WHERE id = ?", Number(req.params.id))));
});

// DELETE /api/planes/:id
router.delete("/:id", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  const r = q.run("DELETE FROM planes WHERE id = ? AND hogar_id = ?", req.params.id, hogarId);
  if (!r.changes) return res.status(404).json({ error: "plan no encontrado" });
  res.status(204).end();
});

module.exports = router;
