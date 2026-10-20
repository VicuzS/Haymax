// Persona 4 — Lista de compras.
const express = require("express");
const { db, q, hogarDe, productoId } = require("../db");
const { auth } = require("../middleware/auth");
const { norm, aBase, hoy, lunesDe, sumarDias } = require("../utils");
const { asyncHandler } = require("../middleware/asyncHandler");

const router = express.Router();
router.use(auth);

// BD -> forma del app (expone `listo` además de `comprado`).
function aCompra(r) {
  if (!r) return null;
  return {
    id: r.id,
    nombre: r.nombre,
    cantidad: r.cantidad,
    unidad_medida: r.unidad_medida,
    seccion: r.seccion,
    listo: !!r.comprado,
    comprado: !!r.comprado,
    producto_id: r.producto_id,
  };
}

function medida(unidad) {
  const normalizada = norm(unidad || "und");
  const aliases = {
    unid: "und", unidad: "und", unidades: "und",
    gramo: "gr", gramos: "gr", kilo: "kg", kilos: "kg", kilogramo: "kg", kilogramos: "kg",
    litro: "l", litros: "l", lt: "l", mililitro: "ml", mililitros: "ml",
    paquetes: "paquete", latas: "lata", botellas: "botella", atados: "atado", docenas: "docena",
    tazas: "taza", cucharadas: "cda", cucharaditas: "cdta",
  };
  const canonica = aliases[normalizada] || normalizada;
  const base = aBase(1, canonica);
  if (base.bucket === "peso" || base.bucket === "volumen") {
    return { clave: base.bucket, factor: base.base };
  }
  return { clave: `unidad:${canonica}`, factor: 1 };
}

function productoCoincide(a, b) {
  if (a.producto_id != null && b.producto_id != null) return Number(a.producto_id) === Number(b.producto_id);
  return norm(a.nombre) !== "" && norm(a.nombre) === norm(b.nombre);
}

// GET /api/compras
router.get("/", asyncHandler(async (req, res) => {
  const hogarId = await hogarDe(req.user.id);
  res.json(
    (await q.all("SELECT * FROM compras WHERE hogar_id = ? ORDER BY seccion, comprado, nombre", hogarId))
      .map(aCompra)
  );
}));

// POST /api/compras
router.post("/", asyncHandler(async (req, res) => {
  const p = req.body || {};
  const nombre = typeof p.nombre === "string" ? p.nombre.trim() : "";
  if (!nombre) return res.status(400).json({ error: "nombre es obligatorio" });
  if (nombre.length > 100) return res.status(400).json({ error: "nombre no puede superar 100 caracteres" });
  if (p.cantidad != null && !["string", "number"].includes(typeof p.cantidad)) {
    return res.status(400).json({ error: "cantidad debe ser texto o número" });
  }
  if (typeof p.cantidad === "number" && !Number.isFinite(p.cantidad)) {
    return res.status(400).json({ error: "cantidad debe ser un número válido" });
  }
  const cantidad = p.cantidad == null ? "1" : String(p.cantidad).trim();
  if (!cantidad || cantidad.length > 50) return res.status(400).json({ error: "cantidad debe ser un texto de 1 a 50 caracteres" });
  const unidad = p.unidad_medida ?? p.unidad ?? null;
  if (unidad != null && (typeof unidad !== "string" || !unidad.trim() || unidad.trim().length > 30)) {
    return res.status(400).json({ error: "unidad_medida debe ser un texto de 1 a 30 caracteres" });
  }
  const seccion = p.seccion == null ? "Mercado de abastos" : p.seccion;
  if (typeof seccion !== "string" || !seccion.trim() || seccion.trim().length > 80) {
    return res.status(400).json({ error: "seccion debe ser un texto de 1 a 80 caracteres" });
  }
  if (p.categoria != null && (typeof p.categoria !== "string" || !p.categoria.trim())) {
    return res.status(400).json({ error: "categoria debe ser un texto no vacío" });
  }
  if (p.comprado != null && typeof p.comprado !== "boolean") {
    return res.status(400).json({ error: "comprado debe ser booleano" });
  }
  if (p.listo != null && typeof p.listo !== "boolean") {
    return res.status(400).json({ error: "listo debe ser booleano" });
  }
  const hogarId = await hogarDe(req.user.id);
  let pid = null;
  if (p.producto_id != null) {
    pid = Number(p.producto_id);
    if (!Number.isSafeInteger(pid) || pid < 1 || !await q.get("SELECT id FROM catalogo_productos WHERE id = ?", pid)) {
      return res.status(400).json({ error: "producto_id no corresponde a un producto del catálogo" });
    }
  } else {
    pid = await productoId(nombre, p.categoria, unidad);
  }
  const r = await q.run(
    `INSERT INTO compras (hogar_id, producto_id, nombre, cantidad, unidad_medida, seccion, comprado)
     VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    hogarId,
    pid,
    nombre,
    cantidad,
    unidad == null ? null : unidad.trim(),
    seccion.trim(),
    p.comprado ?? p.listo ?? false
  );
  res.status(201).json(aCompra(r.row));
}));

// POST /api/compras/generar  -> agrega faltantes del plan de la semana
router.post("/generar", asyncHandler(async (req, res) => {
  const hogarId = await hogarDe(req.user.id);
  const base = (req.body && req.body.fecha) || hoy();
  const fechaBase = typeof base === "string" && /^\d{4}-\d{2}-\d{2}$/.test(base)
    ? new Date(`${base}T00:00:00.000Z`)
    : null;
  if (!fechaBase || Number.isNaN(fechaBase.getTime()) || fechaBase.toISOString().slice(0, 10) !== base) {
    return res.status(400).json({ error: "fecha debe tener formato YYYY-MM-DD" });
  }
  const desde = lunesDe(base);
  const hasta = sumarDias(desde, 6);

  const creada = await db.transaction(async (tx) => {
    // Serializa generaciones concurrentes del mismo hogar para evitar duplicados.
    await tx.get("SELECT id FROM hogares WHERE id = ? FOR UPDATE", hogarId);
    const planes = await tx.all(
      `SELECT p.receta_id, p.porciones AS porciones_plan, r.porciones AS porciones_receta
       FROM planes p JOIN recetas r ON r.id = p.receta_id
       WHERE p.hogar_id = ? AND p.fecha BETWEEN ? AND ? AND p.completado = FALSE`,
      hogarId,
      desde,
      hasta
    );
    const despensa = await tx.all("SELECT producto_id, nombre, cantidad, unidad_medida FROM despensa WHERE hogar_id = ?", hogarId);
    const compras = await tx.all("SELECT producto_id, nombre FROM compras WHERE hogar_id = ?", hogarId);
    const requerimientos = new Map();

    for (const plan of planes) {
      const ingredientes = await tx.all(
        "SELECT * FROM receta_ingredientes WHERE receta_id = ? AND opcional = FALSE ORDER BY orden, id",
        plan.receta_id
      );
      const porcionesBase = Number(plan.porciones_receta) || 1;
      const factorPlan = (Number(plan.porciones_plan) || porcionesBase) / porcionesBase;
      for (const ing of ingredientes) {
        const unidad = ing.unidad_medida || "und";
        const conversion = medida(unidad);
        const claveProducto = ing.producto_id != null ? `producto:${ing.producto_id}` : `nombre:${norm(ing.nombre)}`;
        const clave = `${claveProducto}|${conversion.clave}`;
        const cantidadBase = (Number(ing.cantidad) || 0) * factorPlan * conversion.factor;
        if (!requerimientos.has(clave)) {
          requerimientos.set(clave, {
            producto_id: ing.producto_id,
            nombre: ing.nombre,
            unidad,
            conversion,
            cantidad_base: 0,
          });
        }
        requerimientos.get(clave).cantidad_base += cantidadBase;
      }
    }

    let creados = 0;
    for (const req of requerimientos.values()) {
      const enLista = compras.some((compra) => productoCoincide(compra, req));
      if (enLista) continue;

      const disponibles = despensa
        .filter((item) => productoCoincide(item, req))
        .reduce((total, item) => {
          const itemMedida = medida(item.unidad_medida);
          return itemMedida.clave === req.conversion.clave
            ? total + (Number(item.cantidad) || 0) * itemMedida.factor
            : total;
        }, 0);
      const faltanteBase = req.cantidad_base - disponibles;
      if (faltanteBase <= 0.000001) continue;

      const cantidadFaltante = Number((faltanteBase / req.conversion.factor).toFixed(3));
      await tx.run(
        `INSERT INTO compras (hogar_id, producto_id, nombre, cantidad, unidad_medida, seccion, comprado)
         VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
        hogarId,
        req.producto_id,
        req.nombre,
        String(cantidadFaltante),
        req.unidad,
        "Mercado de abastos"
      );
      compras.push({ producto_id: req.producto_id, nombre: req.nombre });
      creados += 1;
    }
    return creados;
  });
  res.status(201).json({ creados: creada });
}));

// PUT /api/compras/:id (alternar estado o editar los campos enviados)
router.put("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "id inválido" });
  const p = req.body || {};
  const camposPermitidos = new Set(["nombre", "cantidad", "unidad_medida", "unidad", "seccion", "comprado", "listo"]);
  if (Object.keys(p).some((campo) => !camposPermitidos.has(campo))) {
    return res.status(400).json({ error: "el cuerpo contiene campos no admitidos" });
  }
  const cambios = [];
  const valores = [];

  if (Object.hasOwn(p, "nombre")) {
    const nombre = typeof p.nombre === "string" ? p.nombre.trim() : "";
    if (!nombre || nombre.length > 100) return res.status(400).json({ error: "nombre debe tener entre 1 y 100 caracteres" });
    cambios.push("nombre = ?");
    valores.push(nombre);
  }
  if (Object.hasOwn(p, "cantidad")) {
    if (!["string", "number"].includes(typeof p.cantidad) || (typeof p.cantidad === "number" && !Number.isFinite(p.cantidad))) {
      return res.status(400).json({ error: "cantidad debe ser texto o número válido" });
    }
    const cantidad = String(p.cantidad).trim();
    if (!cantidad || cantidad.length > 50) return res.status(400).json({ error: "cantidad debe tener entre 1 y 50 caracteres" });
    cambios.push("cantidad = ?");
    valores.push(cantidad);
  }
  if (Object.hasOwn(p, "unidad_medida") || Object.hasOwn(p, "unidad")) {
    const unidad = p.unidad_medida ?? p.unidad;
    if (typeof unidad !== "string" || !unidad.trim() || unidad.trim().length > 30) {
      return res.status(400).json({ error: "unidad_medida debe ser un texto de 1 a 30 caracteres" });
    }
    cambios.push("unidad_medida = ?");
    valores.push(unidad.trim());
  }
  if (Object.hasOwn(p, "seccion")) {
    if (typeof p.seccion !== "string" || !p.seccion.trim() || p.seccion.trim().length > 80) {
      return res.status(400).json({ error: "seccion debe ser un texto de 1 a 80 caracteres" });
    }
    cambios.push("seccion = ?");
    valores.push(p.seccion.trim());
  }
  const compradoEnviado = Object.hasOwn(p, "comprado") || Object.hasOwn(p, "listo");
  if (compradoEnviado) {
    const comprado = p.comprado ?? p.listo;
    if (typeof comprado !== "boolean") return res.status(400).json({ error: "comprado debe ser booleano" });
    cambios.push("comprado = ?");
    valores.push(comprado);
  }

  const hogarId = await hogarDe(req.user.id);
  if (!cambios.length) {
    const r = await q.run(
      "UPDATE compras SET comprado = NOT comprado WHERE id = ? AND hogar_id = ?",
      id,
      hogarId
    );
    if (!r.changes) return res.status(404).json({ error: "ítem no encontrado" });
  } else {
    valores.push(id, hogarId);
    const r = await q.run(
      `UPDATE compras SET ${cambios.join(", ")} WHERE id = ? AND hogar_id = ?`,
      ...valores
    );
    if (!r.changes) return res.status(404).json({ error: "ítem no encontrado" });
  }
  res.json(aCompra(await q.get("SELECT * FROM compras WHERE id = ? AND hogar_id = ?", id, hogarId)));
}));

// DELETE /api/compras/:id
router.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: "id inválido" });
  const hogarId = await hogarDe(req.user.id);
  const r = await q.run("DELETE FROM compras WHERE id = ? AND hogar_id = ?", id, hogarId);
  if (!r.changes) return res.status(404).json({ error: "ítem no encontrado" });
  res.status(204).end();
}));

module.exports = router;
