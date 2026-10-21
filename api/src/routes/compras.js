// Persona 4 — Lista de compras.
const express = require("express");
const { q, hogarDe, productoId } = require("../db");
const { auth } = require("../middleware/auth");
const { norm, hoy, lunesDe, sumarDias } = require("../utils");

const router = express.Router();
router.use(auth);

// BD -> forma del app (expone `listo` además de `comprado`).
function aCompra(r) {
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    cantidad: r.cantidad,
    unidad_medida: r.unidad_medida,
    seccion: r.seccion,
    listo: !!r.comprado,
    comprado: !!r.comprado,
    producto_id: r.producto_id,
  };
}

// GET /api/compras
router.get("/", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  res.json(
    q.all("SELECT * FROM compras WHERE hogar_id = ? ORDER BY seccion, comprado, nombre", hogarId)
      .map(aCompra)
  );
});

// POST /api/compras
router.post("/", (req, res) => {
  const p = req.body || {};
  if (!p.nombre) return res.status(400).json({ error: "nombre es obligatorio" });
  const hogarId = hogarDe(req.user.id);
  const pid = p.producto_id || productoId(p.nombre, p.categoria, p.unidad_medida || p.unidad);
  const r = q.run(
    `INSERT INTO compras (hogar_id, producto_id, nombre, cantidad, unidad_medida, seccion, comprado)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    hogarId,
    pid,
    p.nombre,
    p.cantidad != null ? String(p.cantidad) : "1",
    p.unidad_medida || p.unidad || null,
    p.seccion || "Mercado de abastos",
    p.comprado || p.listo ? 1 : 0
  );
  res.status(201).json(aCompra(q.get("SELECT * FROM compras WHERE id = ?", Number(r.lastInsertRowid))));
});

// POST /api/compras/generar  -> agrega faltantes del plan de la semana
router.post("/generar", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  const base = (req.body && req.body.fecha) || hoy();
  const desde = lunesDe(base);
  const hasta = sumarDias(desde, 6);

  const planes = q.all(
    "SELECT receta_id FROM planes WHERE hogar_id = ? AND fecha BETWEEN ? AND ? AND completado = 0",
    hogarId,
    desde,
    hasta
  );
  const enCasa = new Set(q.all("SELECT nombre FROM despensa WHERE hogar_id = ?", hogarId).map((d) => norm(d.nombre)));
  const existentes = new Set(q.all("SELECT nombre FROM compras WHERE hogar_id = ?", hogarId).map((c) => norm(c.nombre)));

  let creados = 0;
  const vistos = new Set();
  for (const p of planes) {
    const ings = q.all("SELECT * FROM receta_ingredientes WHERE receta_id = ?", p.receta_id);
    for (const i of ings) {
      const clave = norm(i.nombre);
      if (enCasa.has(clave) || existentes.has(clave) || vistos.has(clave)) continue;
      vistos.add(clave);
      q.run(
        `INSERT INTO compras (hogar_id, producto_id, nombre, cantidad, unidad_medida, seccion, comprado)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        hogarId,
        i.producto_id,
        i.nombre,
        String(i.cantidad),
        i.unidad_medida,
        "Mercado de abastos"
      );
      creados += 1;
    }
  }
  res.status(201).json({ creados });
});

// PUT /api/compras/:id  (alterna comprado/listo; si el cuerpo trae un valor
// explícito `comprado` o `listo`, se fija ese valor en lugar de alternar).
router.put("/:id", (req, res) => {
  const p = req.body || {};
  const hogarId = hogarDe(req.user.id);
  const expl = p.comprado != null ? !!p.comprado : p.listo != null ? !!p.listo : null;
  const r = q.run(
    expl == null
      ? "UPDATE compras SET comprado = 1 - comprado WHERE id = ? AND hogar_id = ?"
      : "UPDATE compras SET comprado = ? WHERE id = ? AND hogar_id = ?",
    ...(expl == null ? [] : [expl ? 1 : 0]),
    req.params.id,
    hogarId
  );
  if (!r.changes) return res.status(404).json({ error: "ítem no encontrado" });
  res.json(aCompra(q.get("SELECT * FROM compras WHERE id = ?", Number(req.params.id))));
});

// DELETE /api/compras/:id
router.delete("/:id", (req, res) => {
  const hogarId = hogarDe(req.user.id);
  const r = q.run("DELETE FROM compras WHERE id = ? AND hogar_id = ?", req.params.id, hogarId);
  if (!r.changes) return res.status(404).json({ error: "ítem no encontrado" });
  res.status(204).end();
});

module.exports = router;
