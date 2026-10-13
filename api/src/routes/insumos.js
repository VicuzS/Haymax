// Persona 2 — Catálogo de productos (insumos) compartido.
const express = require("express");
const { q } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// GET /api/insumos?q=pollo  (público: alimenta autocompletado)
router.get("/", (req, res) => {
  const { q: term, categoria } = req.query;
  const filtros = [];
  const args = [];
  if (term) {
    filtros.push("nombre LIKE ?");
    args.push(`%${term}%`);
  }
  if (categoria) {
    filtros.push("categoria = ?");
    args.push(categoria);
  }
  const where = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";
  res.json(q.all(`SELECT * FROM catalogo_productos ${where} ORDER BY categoria, nombre`, ...args));
});

// POST /api/insumos  (requiere sesión)
router.post("/", auth, (req, res) => {
  const { nombre, categoria, unidad_medida_base } = req.body || {};
  if (!nombre || !categoria) {
    return res.status(400).json({ error: "nombre y categoria son obligatorios" });
  }
  const existente = q.get("SELECT * FROM catalogo_productos WHERE nombre = ? COLLATE NOCASE", nombre);
  if (existente) return res.json(existente);
  const r = q.run(
    "INSERT INTO catalogo_productos (nombre, categoria, unidad_medida_base) VALUES (?, ?, ?)",
    nombre,
    categoria,
    unidad_medida_base || "und"
  );
  res.status(201).json(q.get("SELECT * FROM catalogo_productos WHERE id = ?", Number(r.lastInsertRowid)));
});

module.exports = router;
