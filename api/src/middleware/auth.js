// Autenticación JWT compartida por las rutas protegidas.
const jwt = require("jsonwebtoken");

const SECRETO = () => process.env.JWT_SECRET || "dev-secret";

// Firma el token de sesión (7 días) con los datos mínimos del usuario.
function firmar(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    SECRETO(),
    { expiresIn: "7d" }
  );
}

// Exige Authorization: Bearer <token>.
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "token requerido" });
  try {
    req.user = jwt.verify(token, SECRETO());
    next();
  } catch (_e) {
    res.status(401).json({ error: "token inválido o expirado" });
  }
}

// Igual que auth, pero sin bloquear: adjunta req.user si el token es válido.
function authOpcional(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, SECRETO());
    } catch (_e) {
      /* token inválido: se ignora y sigue como invitado */
    }
  }
  next();
}

module.exports = { auth, authOpcional, firmar };
