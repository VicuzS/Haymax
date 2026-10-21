// Guarda la foto de perfil elegida por el usuario en AsyncStorage (base64 data URI).
// Cuando el backend exponga un endpoint de upload, este es el único módulo a cambiar.
const CLAVE = "haymax.perfilFoto";

async function obtenerStorage() {
  try {
    return (await import("@react-native-async-storage/async-storage")).default;
  } catch (_e) {
    return null;
  }
}

export async function leerFotoLocal() {
  const AS = await obtenerStorage();
  if (!AS) return null;
  try {
    return await AS.getItem(CLAVE);
  } catch (_e) {
    return null;
  }
}

export async function guardarFotoLocal(dataUri) {
  const AS = await obtenerStorage();
  if (!AS) return;
  try {
    if (dataUri) await AS.setItem(CLAVE, dataUri);
    else await AS.removeItem(CLAVE);
  } catch (_e) {
    // Si falla el storage, la foto sigue viva en memoria durante la sesión
  }
}