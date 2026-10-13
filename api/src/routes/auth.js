// Persona 1 — Autenticación y perfil.
const express = require("express");
const bcrypt = require("bcryptjs");
const { q, hogarDe } = require("../db");
const { auth, firmar } = require("../middleware/auth");

const router = express.Router();

function publico(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    foto_url: u.foto_url,
    distrito: u.distrito,
  };
}

// POST /api/auth/registro
router.post("/registro", (req, res) => {
  const { nombre, email, password, distrito } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "nombre, email y password son obligatorios" });
  }
  if (q.get("SELECT id FROM usuarios WHERE email = ?", email)) {
    return res.status(409).json({ error: "el email ya está registrado" });
  }
  const hash = bcrypt.hashSync(password, 10);
  const r = q.run(
    "INSERT INTO usuarios (nombre, email, password_hash, distrito) VALUES (?, ?, ?, ?)",
    nombre,
    email,
    hash,
    distrito || null
  );
  const id = Number(r.lastInsertRowid);
  hogarDe(id); // cada usuario nuevo arranca con su hogar personal
  const user = publico(q.get("SELECT * FROM usuarios WHERE id = ?", id));
  res.status(201).json({ token: firmar(user), user });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = q.get("SELECT * FROM usuarios WHERE email = ?", email || "");
  if (!u || !bcrypt.compareSync(password || "", u.password_hash)) {
    return res.status(401).json({ error: "credenciales inválidas" });
  }
  res.json({ token: firmar(u), user: publico(u) });
});

// GET /api/auth/yo
router.get("/yo", auth, (req, res) => {
  const u = q.get("SELECT * FROM usuarios WHERE id = ?", req.user.id);
  if (!u) return res.status(404).json({ error: "usuario no encontrado" });
  res.json({ user: publico(u) });
});

// PUT /api/auth/perfil
router.put("/perfil", auth, (req, res) => {
  const { nombre, foto_url, distrito } = req.body || {};
  q.run(
    `UPDATE usuarios SET
       nombre   = COALESCE(?, nombre),
       foto_url = COALESCE(?, foto_url),
       distrito = COALESCE(?, distrito)
     WHERE id = ?`,
    nombre ?? null,
    foto_url ?? null,
    distrito ?? null,
    req.user.id
  );
  res.json({ user: publico(q.get("SELECT * FROM usuarios WHERE id = ?", req.user.id)) });
});

module.exports = router;
