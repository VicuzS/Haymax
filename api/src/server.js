require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { schemaReady } = require("./db");

const authRoutes = require("./routes/auth");
const recetasRoutes = require("./routes/recetas");
const despensaRoutes = require("./routes/despensa");
const insumosRoutes = require("./routes/insumos");
const planesRoutes = require("./routes/planes");
const favoritosRoutes = require("./routes/favoritos");
const comprasRoutes = require("./routes/compras");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/salud", (_req, res) =>
  res.json({ ok: true, servicio: "haymax-api", version: "1.0.0" })
);

app.use("/api/auth", authRoutes);
app.use("/api/recetas", recetasRoutes);
app.use("/api/despensa", despensaRoutes);
app.use("/api/insumos", insumosRoutes);
app.use("/api/planes", planesRoutes);
app.use("/api/favoritos", favoritosRoutes);
app.use("/api/compras", comprasRoutes);

app.use((req, res) => res.status(404).json({ error: "ruta no encontrada" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "error interno del servidor" });
});

const PORT = process.env.PORT || 4000;
if (require.main === module) {
  schemaReady.then(() => {
    app.listen(PORT, () => {
      console.log(`haymax-api escuchando en http://localhost:${PORT}/api/salud`);
    });
  }).catch((error) => {
    console.error("No se pudo conectar a PostgreSQL:", error);
    process.exitCode = 1;
  });
}

module.exports = app;
