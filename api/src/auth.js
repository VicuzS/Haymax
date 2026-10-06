const jwt = require("jsonwebtoken");

// Protege las rutas privadas: Authorization: Bearer <token>
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "token requerido" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    next();
  } catch {
    res.status(401).json({ error: "token inválido o expirado" });
  }
}

module.exports = { auth };
