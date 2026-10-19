// Persona 2 — Catálogo de productos (insumos) compartido.
const express = require("express");
const { q } = require("../db");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { norm } = require("../utils");

const router = express.Router();

// GET /api/insumos?q=pollo&categoria=Carnes (público: alimenta autocompletado)
router.get("/", asyncHandler(async (req, res) => {
  const term = req.query.q == null ? "" : req.query.q;
  const categoria = req.query.categoria == null ? "" : req.query.categoria;
  if (typeof term !== "string" || typeof categoria !== "string") {
    return res.status(400).json({ error: "q y categoria deben ser valores únicos de texto" });
  }

  const qNormalizada = norm(term);
  const categoriaNormalizada = norm(categoria);
  const productos = await q.all("SELECT * FROM catalogo_productos ORDER BY lower(categoria), lower(nombre), id");
  const resultado = productos.filter((producto) =>
    (!qNormalizada || norm(producto.nombre).includes(qNormalizada)) &&
    (!categoriaNormalizada || norm(producto.categoria) === categoriaNormalizada)
  );
  return res.json(resultado);
}));

// POST /api/insumos (requiere sesión); el catálogo es compartido por todos.
router.post("/", auth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const categoria = typeof body.categoria === "string" ? body.categoria.trim() : "";
  const unidad = body.unidad_medida_base == null ? "und" : body.unidad_medida_base;

  if (!nombre || !categoria) {
    return res.status(400).json({ error: "nombre y categoria son obligatorios" });
  }
  if (nombre.length > 100) return res.status(400).json({ error: "nombre no puede superar 100 caracteres" });
  if (categoria.length > 60) return res.status(400).json({ error: "categoria no puede superar 60 caracteres" });
  if (typeof unidad !== "string" || !unidad.trim() || unidad.trim().length > 30) {
    return res.status(400).json({ error: "unidad_medida_base debe ser un texto de 1 a 30 caracteres" });
  }

  const existente = (await q.all("SELECT * FROM catalogo_productos")).find((producto) => norm(producto.nombre) === norm(nombre));
  if (existente) return res.json(existente);

  const r = await q.run(
    "INSERT INTO catalogo_productos (nombre, categoria, unidad_medida_base) VALUES (?, ?, ?) RETURNING *",
    nombre,
    categoria,
    unidad.trim()
  );
  return res.status(201).json(r.row);
}));

module.exports = router;
