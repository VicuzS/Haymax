// Sesión persistente en el dispositivo (Fase 4): cuenta o modo invitado.
// En modo cuenta guarda el token JWT de haymax-api.
// Si AsyncStorage no estuviera disponible (entornos raros), degrada a memoria.
let memoria = null;

async function safe(fn, fallback) {
  try {
    return await fn();
  } catch (_e) {
    return fallback;
  }
}

export async function guardarSesion({
  modo = "invitado",
  usuario = "Rosa Ticlla",
  token = null,
  distrito = null,
} = {}) {
  const datos = { modo, usuario, token, distrito, en: Date.now() };
  memoria = datos;
  await safe(async () => {
    const AS = (await import("@react-native-async-storage/async-storage")).default;
    await AS.setItem("haymax.sesion", JSON.stringify(datos));
  }, null);
  return datos;
}

export async function leerSesion() {
  const v = await safe(async () => {
    const AS = (await import("@react-native-async-storage/async-storage")).default;
    return await AS.getItem("haymax.sesion");
  }, null);
  if (v) {
    try {
      memoria = JSON.parse(v);
    } catch (_e) {
      memoria = null;
    }
  }
  return memoria;
}

export async function borrarSesion() {
  memoria = null;
  await safe(async () => {
    const AS = (await import("@react-native-async-storage/async-storage")).default;
    await AS.removeItem("haymax.sesion");
  }, null);
}
