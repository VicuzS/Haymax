const express = require("express");
const { q } = require("../db");
const { auth } = require("../auth");

const router = express.Router();
router.use(auth);

router.get("/", (_req, res) => res.json(q.all("SELECT * FROM planes ORDER BY dia, comida")));

router.post("/", (req, res) => {
  const p = req.body || {};
  if (!p.id || !p.dia || !p.comida || !p.receta_id) {
    return res.status(400).json({ error: "id, dia, comida y receta_id son obligatorios" });
  }
  q.run(
    `INSERT INTO planes (id, dia, comida, receta_id, porciones) VALUES (@id, @dia, @comida, @receta_id, @porciones)`,
    { id: p.id, dia: p.dia, comida: p.comida, receta_id: p.receta_id, porciones: p.porciones || 1 }
  );
  res.status(201).json(q.get("SELECT * FROM planes WHERE id = ?", p.id));
});

router.delete("/:id", (req, res) => {
  const r = q.run("DELETE FROM planes WHERE id = ?", req.params.id);
  if (!r.changes) return res.status(404).json({ error: "plan no encontrado" });
  res.status(204).end();
});

module.exports = router;
