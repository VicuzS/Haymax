const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { q } = require("../db");
const { auth } = require("../auth");

const router = express.Router();

function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email, nombre: user.nombre },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

router.post("/registro", (req, res) => {
  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "nombre, email y password son obligatorios" });
  }
  try {
    const hash = bcrypt.hashSync(password, 10);
    const r = q.run(
      "INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)",
      nombre, email, hash
    );
    const user = { id: r.lastInsertRowid, nombre, email };
    res.status(201).json({ token: sign(user), user });
  } catch (e) {
    res.status(409).json({ error: "el email ya está registrado" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const user = q.get("SELECT * FROM usuarios WHERE email = ?", email || "");
  if (!user || !bcrypt.compareSync(password || "", user.password_hash)) {
    return res.status(401).json({ error: "credenciales inválidas" });
  }
  const safe = { id: user.id, nombre: user.nombre, email: user.email, foto: user.foto };
  res.json({ token: sign(safe), user: safe });
});

router.get("/yo", auth, (req, res) => res.json({ user: req.user }));

module.exports = router;
