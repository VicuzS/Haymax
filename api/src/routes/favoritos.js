// Persona 3 — Favoritos por usuario.
const express = require("express");
const { q } = require("../db");
const { auth } = require("../middleware/auth");
const { mapReceta } = require("../utils");

const router = express.Router();
router.use(auth);

function ingredientesDe(recetaId) {
  return q.all(
    "SELECT * FROM receta_ingredientes WHERE receta_id = ? ORDER BY orden, id",
    recetaId
  );
}

function agregar(usuarioId, recetaId, res) {
  if (!recetaId) return res.status(400).json({ error: "receta_id es obligatorio" });
  if (!q.get("SELECT id FROM recetas WHERE id = ?", recetaId)) {
    return res.status(404).json({ error: "receta no encontrada" });
  }
  q.run(
    "INSERT OR IGNORE INTO favoritos (usuario_id, receta_id) VALUES (?, ?)",
    usuarioId,
    recetaId
  );
  res.status(201).json({ receta_id: recetaId, esFavorito: true });
}

// GET /api/favoritos/ids  -> solo los ids (ligero, para marcar corazones)
router.get("/ids", (req, res) => {
  const ids = q
    .all("SELECT receta_id FROM favoritos WHERE usuario_id = ? ORDER BY guardado_en DESC", req.user.id)
    .map((f) => f.receta_id);
  res.json(ids);
});

// GET /api/favoritos  -> recetas completas favoritas del usuario
router.get("/", (req, res) => {
  const recetas = q.all(
    `SELECT r.* FROM favoritos f
     JOIN recetas r ON r.id = f.receta_id
     WHERE f.usuario_id = ?
     ORDER BY f.guardado_en DESC`,
    req.user.id
  );
  res.json(recetas.map((r) => mapReceta(r, { ingredientes: ingredientesDe(r.id), favorito: true })));
});

// POST /api/favoritos  { receta_id }
router.post("/", (req, res) => agregar(req.user.id, req.body && req.body.receta_id, res));

// Alias compatible: POST /api/favoritos/:recetaId
router.post("/:recetaId", (req, res) => agregar(req.user.id, req.params.recetaId, res));

// DELETE /api/favoritos/:recetaId
router.delete("/:recetaId", (req, res) => {
  q.run(
    "DELETE FROM favoritos WHERE usuario_id = ? AND receta_id = ?",
    req.user.id,
    req.params.recetaId
  );
  res.status(204).end();
});

module.exports = router;
