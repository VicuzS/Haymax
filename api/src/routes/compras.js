const express = require("express");
const { q } = require("../db");
const { auth } = require("../auth");

const router = express.Router();
router.use(auth);

router.get("/", (_req, res) =>
  res.json(q.all("SELECT * FROM compras ORDER BY seccion, nombre"))
);

router.post("/", (req, res) => {
  const p = req.body || {};
  if (!p.id || !p.nombre) {
    return res.status(400).json({ error: "id y nombre son obligatorios" });
  }
  q.run(
    `INSERT OR IGNORE INTO compras (id, nombre, cantidad, seccion, listo)
     VALUES (@id, @nombre, @cantidad, @seccion, @listo)`,
    {
      id: p.id,
      nombre: p.nombre,
      cantidad: p.cantidad || "1",
      seccion: p.seccion || "Mercado de abastos",
      listo: p.listo ? 1 : 0,
    }
  );
  res.status(201).json(q.get("SELECT * FROM compras WHERE id = ?", p.id));
});

// Marca/desmarca "listo" (alterna en el servidor; el cliente solo avisa).
router.put("/:id", (req, res) => {
  const r = q.run("UPDATE compras SET listo = 1 - listo WHERE id = ?", req.params.id);
  if (!r.changes) return res.status(404).json({ error: "ítem no encontrado" });
  res.json(q.get("SELECT * FROM compras WHERE id = ?", req.params.id));
});

router.delete("/:id", (req, res) => {
  const r = q.run("DELETE FROM compras WHERE id = ?", req.params.id);
  if (!r.changes) return res.status(404).json({ error: "ítem no encontrado" });
  res.status(204).end();
});

module.exports = router;
