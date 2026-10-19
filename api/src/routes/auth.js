// Autenticación, sesión y perfil de usuario.
const express = require("express");
const bcrypt = require("bcryptjs");
const { db, q } = require("../db");
const { auth, firmar, hashToken } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();

function publico(u) {
  if (!u) return null;
  return {
    id: u.id,
    nombre: u.nombre,
    email: u.email,
    foto_url: u.foto_url,
    distrito: u.distrito,
  };
}

function textoOpcional(valor, maximo, campo) {
  if (valor == null || valor === "") return null;
  if (typeof valor !== "string") throw new Error(`${campo} debe ser texto`);
  const limpio = valor.trim();
  if (limpio.length > maximo) throw new Error(`${campo} no puede superar ${maximo} caracteres`);
  return limpio || null;
}

function correoNormalizado(valor) {
  return typeof valor === "string" ? valor.trim().toLowerCase() : "";
}

function correoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

// POST /api/auth/registro — crea usuario, hogar personal y sesión autenticada.
router.post("/registro", asyncHandler(async (req, res) => {
  const body = req.body || {};
  const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
  const email = correoNormalizado(body.email);
  const password = body.password;
  let distrito;

  try {
    distrito = textoOpcional(body.distrito, 80, "distrito");
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!nombre || !email || typeof password !== "string") {
    return res.status(400).json({ error: "nombre, email y password son obligatorios" });
  }
  if (nombre.length > 100) return res.status(400).json({ error: "nombre no puede superar 100 caracteres" });
  if (!correoValido(email) || email.length > 254) {
    return res.status(400).json({ error: "correo electrónico inválido" });
  }
  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: "la contraseña debe tener entre 8 y 128 caracteres" });
  }
  if (await q.get("SELECT id FROM usuarios WHERE lower(email) = lower(?)", email)) {
    return res.status(409).json({ error: "el email ya está registrado" });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const user = await db.transaction(async (tx) => {
      const creado = await tx.run(
        "INSERT INTO usuarios (nombre, email, password_hash, distrito) VALUES (?, ?, ?, ?) RETURNING *",
        nombre,
        email,
        hash,
        distrito
      );
      const hogar = await tx.run("INSERT INTO hogares (nombre) VALUES (?) RETURNING id", `Hogar de ${nombre}`);
      await tx.run(
        "INSERT INTO hogar_integrantes (hogar_id, usuario_id, rol) VALUES (?, ?, 'admin')",
        hogar.row.id,
        creado.row.id
      );
      return publico(creado.row);
    });
    return res.status(201).json({ token: firmar(user), user });
  } catch (error) {
    if (error && error.code === "23505") {
      return res.status(409).json({ error: "el email ya está registrado" });
    }
    throw error;
  }
}));

// POST /api/auth/login
router.post("/login", asyncHandler(async (req, res) => {
  const body = req.body || {};
  const email = correoNormalizado(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const u = email ? await q.get("SELECT * FROM usuarios WHERE lower(email) = lower(?)", email) : null;
  if (!u || !bcrypt.compareSync(password, u.password_hash)) {
    return res.status(401).json({ error: "correo o contraseña incorrectos" });
  }
  return res.json({ token: firmar(u), user: publico(u) });
}));

// GET /api/auth/yo — perfil autenticado actual.
router.get("/yo", auth, asyncHandler(async (req, res) => {
  const u = await q.get("SELECT * FROM usuarios WHERE id = ?", req.user.id);
  if (!u) return res.status(404).json({ error: "usuario no encontrado" });
  return res.json({ user: publico(u) });
}));

// PUT /api/auth/perfil — actualiza únicamente los campos del perfil permitidos.
router.put("/perfil", auth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const campos = [];
  const valores = [];

  if (Object.prototype.hasOwnProperty.call(body, "nombre")) {
    const nombre = typeof body.nombre === "string" ? body.nombre.trim() : "";
    if (!nombre) return res.status(400).json({ error: "nombre no puede estar vacío" });
    if (nombre.length > 100) return res.status(400).json({ error: "nombre no puede superar 100 caracteres" });
    campos.push("nombre = ?");
    valores.push(nombre);
  }

  if (Object.prototype.hasOwnProperty.call(body, "distrito")) {
    try {
      const distrito = textoOpcional(body.distrito, 80, "distrito");
      campos.push("distrito = ?");
      valores.push(distrito);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "foto_url")) {
    const raw = body.foto_url;
    let foto = null;
    if (raw != null && raw !== "") {
      if (typeof raw !== "string" || raw.trim().length > 2048) {
        return res.status(400).json({ error: "foto_url debe ser una URL válida" });
      }
      try {
        const url = new URL(raw.trim());
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocolo inválido");
        foto = url.toString();
      } catch (_e) {
        return res.status(400).json({ error: "foto_url debe ser una URL http o https válida" });
      }
    }
    campos.push("foto_url = ?");
    valores.push(foto);
  }

  if (campos.length) {
    valores.push(req.user.id);
    const actualizado = await q.run(`UPDATE usuarios SET ${campos.join(", ")} WHERE id = ?`, ...valores);
    if (!actualizado.changes) return res.status(404).json({ error: "usuario no encontrado" });
  }
  const user = publico(await q.get("SELECT * FROM usuarios WHERE id = ?", req.user.id));
  if (!user) return res.status(404).json({ error: "usuario no encontrado" });
  return res.json({ user });
}));

// POST /api/auth/logout — invalida el JWT en el servidor.
router.post("/logout", auth, asyncHandler(async (req, res) => {
  const expira = Number(req.user.exp) || Math.floor(Date.now() / 1000);
  const ahora = Math.floor(Date.now() / 1000);
  await q.run("DELETE FROM sesiones_revocadas WHERE expires_at <= ?", ahora);
  if (expira > ahora) {
    await q.run(
      `INSERT INTO sesiones_revocadas (token_hash, expires_at) VALUES (?, ?)
       ON CONFLICT (token_hash) DO UPDATE SET expires_at = EXCLUDED.expires_at`,
      hashToken(req.authToken),
      expira
    );
  }
  return res.status(204).end();
}));

module.exports = router;
