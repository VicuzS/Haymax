// Importa el archivo SQLite existente a PostgreSQL, preservando IDs y relaciones.
const path = require("path");
const fs = require("fs");
const SQLite = require("better-sqlite3");
const { db, schemaReady } = require("./db");

const sqliteFile = path.resolve(process.env.SQLITE_FILE || "./haymax.db");

const TABLES = [
  {
    name: "usuarios",
    columns: ["id", "email", "password_hash", "nombre", "foto_url", "distrito", "creado_en"],
    map: (r) => [r.id, r.email, r.password_hash, r.nombre, r.foto_url, r.distrito, r.creado_en],
  },
  {
    name: "sesiones_revocadas",
    columns: ["token_hash", "expires_at", "revocado_en"],
    map: (r) => [r.token_hash, r.expires_at, r.revocado_en],
  },
  {
    name: "hogares",
    columns: ["id", "nombre", "distrito", "creado_en"],
    map: (r) => [r.id, r.nombre, r.distrito, r.creado_en],
  },
  {
    name: "hogar_integrantes",
    columns: ["hogar_id", "usuario_id", "rol"],
    map: (r) => [r.hogar_id, r.usuario_id, r.rol],
  },
  {
    name: "catalogo_productos",
    columns: ["id", "nombre", "categoria", "unidad_medida_base"],
    map: (r) => [r.id, r.nombre, r.categoria, r.unidad_medida_base],
  },
  {
    name: "recetas",
    columns: ["id", "titulo", "descripcion", "imagen", "porciones", "tiempo_preparacion_min", "dificultad", "precio", "distrito", "nutri_calorias", "nutri_proteinas", "nutri_carbohidratos", "nutri_grasas", "nutri_fibra", "pasos", "autor_id", "publica", "creado_en"],
    map: (r) => [r.id, r.titulo, r.descripcion, r.imagen, r.porciones, r.tiempo_preparacion_min, r.dificultad, r.precio, r.distrito, r.nutri_calorias, r.nutri_proteinas, r.nutri_carbohidratos, r.nutri_grasas, r.nutri_fibra, r.pasos, r.autor_id, Boolean(r.publica), r.creado_en],
  },
  {
    name: "receta_ingredientes",
    columns: ["id", "receta_id", "producto_id", "nombre", "cantidad", "unidad_medida", "opcional", "orden"],
    map: (r) => [r.id, r.receta_id, r.producto_id, r.nombre, r.cantidad, r.unidad_medida, Boolean(r.opcional), r.orden],
  },
  {
    name: "despensa",
    columns: ["id", "hogar_id", "producto_id", "nombre", "cantidad", "unidad_medida", "fecha_vencimiento", "ubicacion", "creado_en", "actualizado_en"],
    map: (r) => [r.id, r.hogar_id, r.producto_id, r.nombre, r.cantidad, r.unidad_medida, r.fecha_vencimiento || null, r.ubicacion, r.creado_en, r.actualizado_en],
  },
  {
    name: "planes",
    columns: ["id", "hogar_id", "receta_id", "fecha", "comida", "porciones", "completado", "creado_en"],
    map: (r) => [r.id, r.hogar_id, r.receta_id, r.fecha, r.comida, r.porciones, Boolean(r.completado), r.creado_en],
  },
  {
    name: "compras",
    columns: ["id", "hogar_id", "producto_id", "nombre", "cantidad", "unidad_medida", "seccion", "comprado", "creado_en"],
    map: (r) => [r.id, r.hogar_id, r.producto_id, r.nombre, r.cantidad, r.unidad_medida, r.seccion, Boolean(r.comprado), r.creado_en],
  },
  {
    name: "favoritos",
    columns: ["usuario_id", "receta_id", "guardado_en"],
    map: (r) => [r.usuario_id, r.receta_id, r.guardado_en],
  },
];
const IDENTITY_TABLES = new Set([
  "usuarios", "hogares", "catalogo_productos", "receta_ingredientes", "despensa", "planes", "compras",
]);

async function migrate() {
  await schemaReady;
  if (!fs.existsSync(sqliteFile)) throw new Error(`No se encontró la base SQLite: ${sqliteFile}`);
  const sqlite = new SQLite(sqliteFile, { readonly: true, fileMustExist: true });
  try {
    const conteos = await db.transaction(async (tx) => {
      const resultado = {};
      for (const table of TABLES) {
        const filas = sqlite.prepare(`SELECT * FROM ${table.name}`).all();
        const columnas = table.columns.join(", ");
        const marcadores = table.columns.map(() => "?").join(", ");
        const insert = `INSERT INTO ${table.name} (${columnas}) VALUES (${marcadores}) ON CONFLICT DO NOTHING`;
        let migradas = 0;
        for (const fila of filas) {
          const r = await tx.run(insert, ...table.map(fila));
          migradas += r.changes;
        }
        resultado[table.name] = { origen: filas.length, insertadas: migradas };
      }

      for (const table of TABLES.filter((t) => IDENTITY_TABLES.has(t.name))) {
        const max = await tx.get(`SELECT MAX(id) AS max_id FROM ${table.name}`);
        if (max.max_id != null) {
          await tx.run(
            "SELECT setval(pg_get_serial_sequence(?, 'id'), ?, TRUE)",
            `public.${table.name}`,
            Number(max.max_id)
          );
        }
      }
      return resultado;
    });
    console.log(`Importación desde ${sqliteFile} completada:`);
    for (const [tabla, conteo] of Object.entries(conteos)) {
      console.log(`- ${tabla}: ${conteo.insertadas}/${conteo.origen} filas importadas`);
    }
  } finally {
    sqlite.close();
  }
}

migrate().then(() => db.pool.end()).catch(async (error) => {
  console.error(error);
  await db.pool.end();
  process.exitCode = 1;
});
