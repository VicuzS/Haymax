// Persona 3 — Favoritos por usuario.
const express = require("express");
const { q } = require("../db");
const { auth } = require("../middleware/auth");
const { mapReceta } = require("../utils");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();
router.use(auth);

function ingredientesDe(recetaId) {
  return q.all(
    "SELECT * FROM receta_ingredientes WHERE receta_id = ? ORDER BY orden, id",
    recetaId
  );
}

async function agregar(usuarioId, recetaId, res) {
  if (!recetaId) return res.status(400).json({ error: "receta_id es obligatorio" });
  if (!await q.get("SELECT id FROM recetas WHERE id = ?", recetaId)) {
    return res.status(404).json({ error: "receta no encontrada" });
  }
  await q.run(
    "INSERT INTO favoritos (usuario_id, receta_id) VALUES (?, ?) ON CONFLICT (usuario_id, receta_id) DO NOTHING",
    usuarioId,
    recetaId
  );
  res.status(201).json({ receta_id: recetaId, esFavorito: true });
}

// GET /api/favoritos/ids  -> solo los ids (ligero, para marcar corazones)
router.get("/ids", asyncHandler(async (req, res) => {
  const ids = (await q
    .all("SELECT receta_id FROM favoritos WHERE usuario_id = ? ORDER BY guardado_en DESC", req.user.id))
    .map((f) => f.receta_id);
  res.json(ids);
}));

// GET /api/favoritos  -> recetas completas favoritas del usuario
router.get("/", asyncHandler(async (req, res) => {
  const recetas = await q.all(
    `SELECT r.* FROM favoritos f
     JOIN recetas r ON r.id = f.receta_id
     WHERE f.usuario_id = ?
     ORDER BY f.guardado_en DESC`,
    req.user.id
  );
  const salida = await Promise.all(recetas.map(async (r) => mapReceta(r, { ingredientes: await ingredientesDe(r.id), favorito: true })));
  res.json(salida);
}));

// POST /api/favoritos  { receta_id }
router.post("/", asyncHandler((req, res) => agregar(req.user.id, req.body && req.body.receta_id, res)));

// Alias compatible: POST /api/favoritos/:recetaId
router.post("/:recetaId", asyncHandler((req, res) => agregar(req.user.id, req.params.recetaId, res)));

// DELETE /api/favoritos/:recetaId
router.delete("/:recetaId", asyncHandler(async (req, res) => {
  await q.run(
    "DELETE FROM favoritos WHERE usuario_id = ? AND receta_id = ?",
    req.user.id,
    req.params.recetaId
  );
  res.status(204).end();
}));

module.exports = router;
