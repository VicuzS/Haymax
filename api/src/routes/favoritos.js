const express = require("express");
const { q } = require("../db");
const { auth } = require("../auth");

const router = express.Router();
router.use(auth);

router.get("/", (req, res) =>
  res.json(q.all("SELECT * FROM favoritos WHERE usuario_id = ?", req.user.id))
);

router.post("/:recetaId", (req, res) => {
  q.run(
    "INSERT OR IGNORE INTO favoritos (usuario_id, receta_id, guardado_en) VALUES (?, ?, ?)",
    req.user.id,
    req.params.recetaId,
    new Date().toISOString().slice(0, 10)
  );
  res.status(201).json({ recetaId: req.params.recetaId });
});

router.delete("/:recetaId", (req, res) => {
  q.run("DELETE FROM favoritos WHERE usuario_id = ? AND receta_id = ?", req.user.id, req.params.recetaId);
  res.status(204).end();
});

module.exports = router;
