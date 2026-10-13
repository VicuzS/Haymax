// Conexión SQLite (better-sqlite3) y creación del esquema.
//
// Decisiones de diseño:
//  - Los datos de despensa, plan y compras se agrupan por HOGAR (multiusuario).
//  - El catálogo de productos es compartido y sirve de base para la despensa,
//    los ingredientes de recetas y la lista de compras.
//  - Los nombres de columnas viven en snake_case; las rutas los traducen a la
//    forma que consumo el frontend (ver app/src/lib/api.js).
const path = require("path");
const Database = require("better-sqlite3");
require("dotenv").config();

const file = path.resolve(process.env.DB_FILE || "./haymax.db");
const db = new Database(file);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
CREATE TABLE IF NOT EXISTS usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  foto_url      TEXT,
  distrito      TEXT,
  creado_en     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hogares (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL,
  distrito  TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS hogar_integrantes (
  hogar_id   INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol        TEXT NOT NULL DEFAULT 'miembro' CHECK (rol IN ('admin','miembro')),
  PRIMARY KEY (hogar_id, usuario_id)
);

CREATE TABLE IF NOT EXISTS catalogo_productos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre             TEXT NOT NULL UNIQUE,
  categoria          TEXT NOT NULL,
  unidad_medida_base TEXT NOT NULL DEFAULT 'und'
);

CREATE TABLE IF NOT EXISTS despensa (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  hogar_id          INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  producto_id       INTEGER REFERENCES catalogo_productos(id),
  nombre            TEXT NOT NULL,
  cantidad          REAL NOT NULL DEFAULT 0,
  unidad_medida     TEXT NOT NULL DEFAULT 'und',
  fecha_vencimiento TEXT,
  ubicacion         TEXT NOT NULL DEFAULT 'Despensa',
  creado_en         TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en    TEXT
);

CREATE TABLE IF NOT EXISTS recetas (
  id                   TEXT PRIMARY KEY,
  titulo               TEXT NOT NULL,
  descripcion          TEXT,
  imagen               TEXT,
  porciones            INTEGER NOT NULL DEFAULT 1,
  tiempo_preparacion_min INTEGER NOT NULL DEFAULT 0,
  dificultad           TEXT NOT NULL DEFAULT 'facil' CHECK (dificultad IN ('facil','media','dificil')),
  precio               REAL NOT NULL DEFAULT 0,
  distrito             TEXT,
  nutri_calorias       INTEGER NOT NULL DEFAULT 0,
  nutri_proteinas      REAL NOT NULL DEFAULT 0,
  nutri_carbohidratos  REAL NOT NULL DEFAULT 0,
  nutri_grasas         REAL NOT NULL DEFAULT 0,
  nutri_fibra          REAL NOT NULL DEFAULT 0,
  pasos                TEXT NOT NULL DEFAULT '[]',
  autor_id             INTEGER REFERENCES usuarios(id),
  publica              INTEGER NOT NULL DEFAULT 1,
  creado_en            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS receta_ingredientes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  receta_id    TEXT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  producto_id  INTEGER REFERENCES catalogo_productos(id),
  nombre       TEXT NOT NULL,
  cantidad     REAL NOT NULL DEFAULT 1,
  unidad_medida TEXT NOT NULL DEFAULT 'und',
  opcional     INTEGER NOT NULL DEFAULT 0,
  orden        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS planes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  hogar_id   INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  receta_id  TEXT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  fecha      TEXT NOT NULL,
  comida     TEXT NOT NULL CHECK (comida IN ('desayuno','almuerzo','cena')),
  porciones  INTEGER NOT NULL DEFAULT 1,
  completado INTEGER NOT NULL DEFAULT 0,
  creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS compras (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  hogar_id     INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  producto_id  INTEGER REFERENCES catalogo_productos(id),
  nombre       TEXT NOT NULL,
  cantidad     TEXT NOT NULL DEFAULT '1',
  unidad_medida TEXT,
  seccion      TEXT NOT NULL DEFAULT 'Mercado de abastos',
  comprado     INTEGER NOT NULL DEFAULT 0,
  creado_en    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favoritos (
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  receta_id   TEXT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  guardado_en TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (usuario_id, receta_id)
);

CREATE INDEX IF NOT EXISTS idx_despensa_hogar  ON despensa(hogar_id);
CREATE INDEX IF NOT EXISTS idx_planes_hogar    ON planes(hogar_id, fecha);
CREATE INDEX IF NOT EXISTS idx_compras_hogar   ON compras(hogar_id);
CREATE INDEX IF NOT EXISTS idx_ingredientes    ON receta_ingredientes(receta_id);
`);

// Despachadores reutilizables (evita repetir prepare/all/get/run en las rutas).
const q = {
  all: (sql, ...args) => db.prepare(sql).all(...args),
  get: (sql, ...args) => db.prepare(sql).get(...args),
  run: (sql, ...args) => db.prepare(sql).run(...args),
};

// Devuelve el hogar principal del usuario; si no tiene, crea uno y lo asocia.
function hogarDe(usuarioId) {
  const fila = q.get(
    "SELECT hogar_id FROM hogar_integrantes WHERE usuario_id = ? ORDER BY hogar_id LIMIT 1",
    usuarioId
  );
  if (fila) return fila.hogar_id;

  const u = q.get("SELECT nombre FROM usuarios WHERE id = ?", usuarioId);
  const r = q.run("INSERT INTO hogares (nombre) VALUES (?)", `Hogar de ${(u && u.nombre) || "usuario"}`);
  const hogarId = Number(r.lastInsertRowid);
  q.run(
    "INSERT INTO hogar_integrantes (hogar_id, usuario_id, rol) VALUES (?, ?, 'admin')",
    hogarId,
    usuarioId
  );
  return hogarId;
}

// Devuelve el id de catálogo del producto, creándolo si no existe.
function productoId(nombre, categoria, unidad) {
  if (!nombre) return null;
  const existente = q.get(
    "SELECT id FROM catalogo_productos WHERE nombre = ? COLLATE NOCASE",
    nombre
  );
  if (existente) return existente.id;
  const r = q.run(
    "INSERT INTO catalogo_productos (nombre, categoria, unidad_medida_base) VALUES (?, ?, ?)",
    nombre,
    categoria || "Otros",
    unidad || "und"
  );
  return Number(r.lastInsertRowid);
}

module.exports = { db, q, hogarDe, productoId };
