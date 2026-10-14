// Sesión de cuenta persistida en el dispositivo. El acceso a la app requiere JWT.
const CLAVE_SESION = "haymax.sesion";
let memoria = null;

async function obtenerStorage() {
  try {
    return (await import("@react-native-async-storage/async-storage")).default;
  } catch (_e) {
    return null;
  }
}

export async function guardarSesion({ token, user, usuario, email, id, foto_url, distrito } = {}) {
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("No se puede guardar una sesión sin un token válido.");
  }

  const perfil = user && typeof user === "object" ? user : {};
  const datos = {
    modo: "cuenta",
    token,
    id: perfil.id ?? id ?? null,
    usuario: perfil.nombre ?? usuario ?? "",
    nombre: perfil.nombre ?? usuario ?? "",
    email: perfil.email ?? email ?? "",
    foto_url: perfil.foto_url ?? foto_url ?? null,
    distrito: perfil.distrito ?? distrito ?? null,
    user: perfil,
    en: Date.now(),
  };
  memoria = datos;

  const AS = await obtenerStorage();
  if (AS) {
    try {
      await AS.setItem(CLAVE_SESION, JSON.stringify(datos));
    } catch (_e) {
      // Si el almacenamiento no está disponible, la sesión vive en memoria.
    }
  }
  return datos;
}

export async function leerSesion() {
  const AS = await obtenerStorage();
  if (!AS) return memoria && memoria.token ? memoria : null;

  try {
    const valor = await AS.getItem(CLAVE_SESION);
    if (!valor) {
      memoria = null;
      return null;
    }
    const datos = JSON.parse(valor);
    if (!datos || datos.modo !== "cuenta" || typeof datos.token !== "string" || !datos.token) {
      memoria = null;
      await AS.removeItem(CLAVE_SESION).catch(() => {});
      return null;
    }
    memoria = datos;
    return datos;
  } catch (_e) {
    // Degrada a memoria solo cuando AsyncStorage falla, no cuando la clave no existe.
    return memoria && memoria.token ? memoria : null;
  }
}

export async function borrarSesion() {
  memoria = null;
  const AS = await obtenerStorage();
  if (!AS) return;
  try {
    await AS.removeItem(CLAVE_SESION);
  } catch (_e) {
    // Intenta invalidar el valor persistido si removeItem falla.
    try {
      await AS.setItem(CLAVE_SESION, "");
    } catch (_ignored) {
      // No se puede persistir el borrado si el propio almacenamiento está caído.
    }
  }
}
