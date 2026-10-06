const express = require("express");
const { q } = require("../db");
const { auth } = require("../auth");

const router = express.Router();
router.use(auth);

router.get("/", (_req, res) => res.json(q.all("SELECT * FROM despensa ORDER BY nombre")));

router.post("/", (req, res) => {
  const p = req.body || {};
  if (!p.id || !p.nombre || !p.categoria) {
    return res.status(400).json({ error: "id, nombre y categoria son obligatorios" });
  }
  q.run(
    `INSERT INTO despensa (id, nombre, categoria, cantidad, unidad, fecha_vencimiento, estado)
     VALUES (@id, @nombre, @categoria, @cantidad, @unidad, @fecha_vencimiento, @estado)`,
    {
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria,
      cantidad: p.cantidad || 0,
      unidad: p.unidad || "und",
      fecha_vencimiento: p.fecha_vencimiento || new Date().toISOString().slice(0, 10),
      estado: p.estado || "ok",
    }
  );
  res.status(201).json(q.get("SELECT * FROM despensa WHERE id = ?", p.id));
});

router.put("/:id", (req, res) => {
  const p = req.body || {};
  const r = q.run(
    `UPDATE despensa SET cantidad = COALESCE(@cantidad, cantidad),
      estado = COALESCE(@estado, estado),
      fecha_vencimiento = COALESCE(@fecha_vencimiento, fecha_vencimiento)
      WHERE id = @id`,
    {
      id: req.params.id,
      cantidad: p.cantidad ?? null,
      estado: p.estado ?? null,
      fecha_vencimiento: p.fecha_vencimiento ?? null,
    }
  );
  if (!r.changes) return res.status(404).json({ error: "producto no encontrado" });
  res.json(q.get("SELECT * FROM despensa WHERE id = ?", req.params.id));
});

router.delete("/:id", (req, res) => {
  const r = q.run("DELETE FROM despensa WHERE id = ?", req.params.id);
  if (!r.changes) return res.status(404).json({ error: "producto no encontrado" });
  res.status(204).end();
});

module.exports = router;
