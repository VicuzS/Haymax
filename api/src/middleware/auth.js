// Autenticación JWT compartida por las rutas protegidas, con revocación al cerrar sesión.
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { q } = require("../db");

const SECRETO = () => process.env.JWT_SECRET || "dev-secret";

// Firma el token de sesión (7 días) con los datos mínimos del usuario.
function firmar(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    SECRETO(),
    { expiresIn: "7d" }
  );
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function estaRevocado(token) {
  return !!(await q.get("SELECT token_hash FROM sesiones_revocadas WHERE token_hash = ?", hashToken(token)));
}

// Exige Authorization: Bearer <token> y rechaza JWT revocados.
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ error: "token requerido" });
  let payload;
  try {
    payload = jwt.verify(token, SECRETO());
  } catch (_e) {
    return res.status(401).json({ error: "token inválido o expirado" });
  }
  estaRevocado(token).then((revocado) => {
    if (revocado) return res.status(401).json({ error: "sesión cerrada; inicia sesión nuevamente" });
    req.user = payload;
    req.authToken = token;
    return next();
  }).catch(next);
}

// Permite consultar contenido público; si el JWT es válido, también agrega req.user.
function authOpcional(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
  if (token) {
    try {
      const payload = jwt.verify(token, SECRETO());
      estaRevocado(token).then((revocado) => {
        if (!revocado) req.user = payload;
        next();
      }).catch(next);
      return;
    } catch (_e) {
      // Un token opcional inválido no da acceso a datos personales.
    }
  }
  next();
}

module.exports = { auth, authOpcional, firmar, hashToken };
