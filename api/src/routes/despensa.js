// Persona 2 — Despensa del hogar.
const express = require("express");
const { q, hogarDe, productoId } = require("../db");
const { auth } = require("../middleware/auth");
const { ESTADO_SQL, hoy } = require("../utils");

const router = express.Router();
router.use(auth);

const SELECT = `
  SELECT d.*, c.categoria AS categoria, c.unidad_medida_base,
         ${ESTADO_SQL} AS estado
  FROM despensa d
  LEFT JOIN catalogo_productos c ON c.id = d.producto_id
  WHERE d.hogar_id = ?`;

// BD -> forma que espera el frontend (unidad, estado, categoria...).
function aInsumo(r) {
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria || "Otros",
    cantidad: r.cantidad,
    unidad: r.unidad_medida,
    unidad_medida: r.unidad_medida,
    fecha_vencimiento: r.fecha_vencimiento,
    ubicacion: r.ubicacion,
    producto_id: r.producto_id,
    estado: r.estado,
  };
}

// GET /api/despensa
router.get("/", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  res.json(q.all(`${SELECT} ORDER BY d.nombre`, hogarId).map(aInsumo));
});

// GET /api/despensa/por-vencer  (por-vencer + vencidos)
router.get("/por-vencer", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  const rows = q
    .all(`${SELECT} ORDER BY d.fecha_vencimiento`, hogarId)
    .filter((r) => r.estado !== "ok");
  res.json(rows.map(aInsumo));
});

// POST /api/despensa
router.post("/", (req, res) => {
  const p = req.body || {};
  if (!p.nombre) return res.status(400).json({ error: "nombre es obligatorio" });
  const hogarId = hogarDe(req.user.id);
  const unidad = p.unidad || p.unidad_medida || "und";
  const pid = productoId(p.nombre, p.categoria, unidad);
  const r = q.run(
    `INSERT INTO despensa (hogar_id, producto_id, nombre, cantidad, unidad_medida, fecha_vencimiento, ubicacion)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    hogarId,
    pid,
    p.nombre,
    p.cantidad != null ? p.cantidad : 0,
    unidad,
    p.fecha_vencimiento || hoy(),
    p.ubicacion || "Despensa"
  );
  res.status(201).json(aInsumo(q.get(`${SELECT} AND d.id = ?`, hogarId, Number(r.lastInsertRowid))));
});

// PUT /api/despensa/:id
router.put("/:id", (req, res) => {
  const p = req.body || {};
  const hogarId = hogarDe(req.user.id);
  const r = q.run(
    `UPDATE despensa SET
       cantidad          = COALESCE(?, cantidad),
       unidad_medida     = COALESCE(?, unidad_medida),
       fecha_vencimiento = COALESCE(?, fecha_vencimiento),
       ubicacion         = COALESCE(?, ubicacion),
       actualizado_en    = datetime('now')
     WHERE id = ? AND hogar_id = ?`,
    p.cantidad ?? null,
    p.unidad ?? p.unidad_medida ?? null,
    p.fecha_vencimiento ?? null,
    p.ubicacion ?? null,
    req.params.id,
    hogarId
  );
  if (!r.changes) return res.status(404).json({ error: "producto no encontrado" });
  res.json(aInsumo(q.get(`${SELECT} AND d.id = ?`, hogarId, Number(req.params.id))));
});

// DELETE /api/despensa/:id
router.delete("/:id", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  const r = q.run("DELETE FROM despensa WHERE id = ? AND hogar_id = ?", req.params.id, hogarId);
  if (!r.changes) return res.status(404).json({ error: "producto no encontrado" });
  res.status(204).end();
});

module.exports = router;
