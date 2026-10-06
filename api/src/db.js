const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config();

const file = path.resolve(process.env.DB_FILE || "./haymax.db");
const db = new Database(file);
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  foto TEXT
);

CREATE TABLE IF NOT EXISTS recetas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  imagen TEXT,
  minutos INTEGER NOT NULL,
  porciones INTEGER NOT NULL,
  calorias INTEGER NOT NULL,
  ingredientes TEXT NOT NULL,
  pasos TEXT NOT NULL,
  dificultad TEXT NOT NULL,
  precio REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS despensa (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  categoria TEXT NOT NULL,
  cantidad REAL NOT NULL,
  unidad TEXT NOT NULL,
  fecha_vencimiento TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('ok','por-vencer','vencido'))
);

CREATE TABLE IF NOT EXISTS planes (
  id TEXT PRIMARY KEY,
  dia TEXT NOT NULL,
  comida TEXT NOT NULL CHECK (comida IN ('desayuno','almuerzo','cena')),
  receta_id TEXT NOT NULL REFERENCES recetas(id),
  porciones INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  receta_id TEXT NOT NULL REFERENCES recetas(id),
  guardado_en TEXT NOT NULL,
  PRIMARY KEY (usuario_id, receta_id)
);
`);

// Despachadores reutilizables (evita SQL repetido en las rutas).
const q = {
  all: (sql, ...args) => db.prepare(sql).all(...args),
  get: (sql, ...args) => db.prepare(sql).get(...args),
  run: (sql, ...args) => db.prepare(sql).run(...args),
};

const parseReceta = (r) =>
  r ? { ...r, ingredientes: JSON.parse(r.ingredientes), pasos: JSON.parse(r.pasos) } : null;

module.exports = { db, q, parseReceta };
