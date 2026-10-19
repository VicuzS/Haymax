// Persona 2 — Despensa del hogar.
const express = require("express");
const { db, q, hogarDe } = require("../db");
const { auth } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/asyncHandler");
const { ESTADO_SQL, norm } = require("../utils");

const router = express.Router();
router.use(auth);

const SELECT = `
  SELECT d.*, c.categoria AS categoria, c.unidad_medida_base,
         ${ESTADO_SQL} AS estado
  FROM despensa d
  LEFT JOIN catalogo_productos c ON c.id = d.producto_id
  WHERE d.hogar_id = ?`;

function aInsumo(r) {
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    categoria: r.categoria || "Otros",
    cantidad: r.cantidad,
    unidad: r.unidad_medida,
    unidad_medida: r.unidad_medida,
    unidad_medida_base: r.unidad_medida_base || null,
    fecha_vencimiento: r.fecha_vencimiento,
    ubicacion: r.ubicacion,
    producto_id: r.producto_id,
    estado: r.estado,
  };
}

function fechaValida(valor) {
  if (valor == null || valor === "") return null;
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return undefined;
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return Number.isFinite(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
    ? valor
    : undefined;
}

function cantidadValida(valor) {
  if (typeof valor === "boolean" || valor == null || String(valor).trim() === "") return undefined;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function aplicarFiltros(rows, req, soloAlertas = false) {
  const categoria = typeof req.query.categoria === "string" ? norm(req.query.categoria) : "";
  const estado = typeof req.query.estado === "string" ? norm(req.query.estado) : "";
  if (estado && !["ok", "por-vencer", "vencido"].includes(estado)) {
    return { error: "estado debe ser ok, por-vencer o vencido" };
  }
  return {
    rows: rows.filter((row) => {
      const item = aInsumo(row);
      if (categoria && norm(item.categoria) !== categoria) return false;
      if (soloAlertas && item.estado === "ok") return false;
      return !estado || item.estado === estado;
    }),
  };
}

async function listar(req, res, soloAlertas = false) {
  const hogarId = await hogarDe(req.user.id);
  const rows = await q.all(`${SELECT} ORDER BY lower(d.nombre), d.id`, hogarId);
  const filtrados = aplicarFiltros(rows, req, soloAlertas);
  if (filtrados.error) return res.status(400).json({ error: filtrados.error });
  return res.json(filtrados.rows.map(aInsumo));
}

// GET /api/despensa?categoria=Verduras&estado=por-vencer
router.get("/", asyncHandler((req, res) => listar(req, res)));

// GET /api/despensa/por-vencer (por-vencer + vencidos)
router.get("/por-vencer", asyncHandler((req, res) => listar(req, res, true)));

// POST /api/despensa — registra una unidad en la despensa y crea el producto
// compartido si todavía no está en el catálogo.
router.post("/", asyncHandler(async (req, res) => {
  const p = req.body || {};
  const nombre = typeof p.nombre === "string" ? p.nombre.trim() : "";
  if (!nombre) return res.status(400).json({ error: "nombre es obligatorio" });
  if (nombre.length > 100) return res.status(400).json({ error: "nombre no puede superar 100 caracteres" });
  if (p.categoria != null && (typeof p.categoria !== "string" || !p.categoria.trim())) {
    return res.status(400).json({ error: "categoria debe ser un texto no vacío" });
  }

  const cantidad = p.cantidad == null ? 0 : cantidadValida(p.cantidad);
  if (cantidad === undefined) return res.status(400).json({ error: "cantidad debe ser un número mayor o igual a 0" });

  const unidadEntrada = p.unidad ?? p.unidad_medida ?? "und";
  if (typeof unidadEntrada !== "string" || !unidadEntrada.trim() || unidadEntrada.trim().length > 30) {
    return res.status(400).json({ error: "unidad debe ser un texto de 1 a 30 caracteres" });
  }
  const unidad = unidadEntrada.trim();
  const fecha = p.fecha_vencimiento == null ? null : fechaValida(p.fecha_vencimiento);
  if (fecha === undefined) return res.status(400).json({ error: "fecha_vencimiento debe tener formato YYYY-MM-DD" });
  if (p.ubicacion != null && (typeof p.ubicacion !== "string" || !p.ubicacion.trim() || p.ubicacion.trim().length > 80)) {
    return res.status(400).json({ error: "ubicacion debe ser un texto de 1 a 80 caracteres" });
  }

  const hogarId = await hogarDe(req.user.id);
  const result = await db.transaction(async (tx) => {
    // Evita crear duplicados si el nombre solo cambia en acentos o mayúsculas.
    const productos = await tx.all("SELECT id, nombre FROM catalogo_productos");
    const producto = productos.find((item) => norm(item.nombre) === norm(nombre));
    const pid = producto
      ? producto.id
      : (await tx.run(
          "INSERT INTO catalogo_productos (nombre, categoria, unidad_medida_base) VALUES (?, ?, ?) RETURNING id",
          nombre,
          p.categoria || "Otros",
          unidad
        )).row.id;
    const r = await tx.run(
      `INSERT INTO despensa (hogar_id, producto_id, nombre, cantidad, unidad_medida, fecha_vencimiento, ubicacion)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      hogarId,
      pid,
      nombre,
      cantidad,
      unidad,
      fecha,
      p.ubicacion == null ? "Despensa" : p.ubicacion.trim()
    );
    return tx.get(`${SELECT} AND d.id = ?`, hogarId, r.row.id);
  });
  return res.status(201).json(aInsumo(result));
}));

// PUT /api/despensa/:id — actualiza únicamente los campos enviados.
router.put("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "id inválido" });

  const p = req.body || {};
  const cambios = [];
  const valores = [];

  if (Object.hasOwn(p, "cantidad")) {
    const cantidad = cantidadValida(p.cantidad);
    if (cantidad === undefined) return res.status(400).json({ error: "cantidad debe ser un número mayor o igual a 0" });
    cambios.push("cantidad = ?");
    valores.push(cantidad);
  }
  const unidadEnviada = Object.hasOwn(p, "unidad") || Object.hasOwn(p, "unidad_medida");
  if (unidadEnviada) {
    const unidad = p.unidad ?? p.unidad_medida;
    if (typeof unidad !== "string" || !unidad.trim() || unidad.trim().length > 30) {
      return res.status(400).json({ error: "unidad debe ser un texto de 1 a 30 caracteres" });
    }
    cambios.push("unidad_medida = ?");
    valores.push(unidad.trim());
  }
  if (Object.hasOwn(p, "fecha_vencimiento")) {
    const fecha = fechaValida(p.fecha_vencimiento);
    if (fecha === undefined) return res.status(400).json({ error: "fecha_vencimiento debe tener formato YYYY-MM-DD" });
    cambios.push("fecha_vencimiento = ?");
    valores.push(fecha);
  }
  if (Object.hasOwn(p, "ubicacion")) {
    if (typeof p.ubicacion !== "string" || !p.ubicacion.trim() || p.ubicacion.trim().length > 80) {
      return res.status(400).json({ error: "ubicacion debe ser un texto de 1 a 80 caracteres" });
    }
    cambios.push("ubicacion = ?");
    valores.push(p.ubicacion.trim());
  }
  if (!cambios.length) return res.status(400).json({ error: "envía al menos un campo para actualizar" });

  const hogarId = await hogarDe(req.user.id);
  valores.push(id, hogarId);
  const r = await q.run(
    `UPDATE despensa SET ${cambios.join(", ")}, actualizado_en = CURRENT_TIMESTAMP WHERE id = ? AND hogar_id = ?`,
    ...valores
  );
  if (!r.changes) return res.status(404).json({ error: "producto no encontrado" });
  return res.json(aInsumo(await q.get(`${SELECT} AND d.id = ?`, hogarId, id)));
}));

// DELETE /api/despensa/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "id inválido" });
  const hogarId = await hogarDe(req.user.id);
  const r = await q.run("DELETE FROM despensa WHERE id = ? AND hogar_id = ?", id, hogarId);
  if (!r.changes) return res.status(404).json({ error: "producto no encontrado" });
  return res.status(204).end();
}));

module.exports = router;
