// Preferencias locales del hogar (notificaciones, exclusiones, tipos de plato).
// Se guardan en AsyncStorage en el dispositivo. Cuando el backend exponga un
// endpoint de preferencias, este módulo será el único punto a cambiar.
const CLAVE = "haymax.preferencias";

let memoria = {
  notificaciones: true,
  exclusiones: [],
  tiposExcluidos: [],
};

async function obtenerStorage() {
  try {
    return (await import("@react-native-async-storage/async-storage")).default;
  } catch (_e) {
    return null;
  }
}

export async function leerPreferencias() {
  const AS = await obtenerStorage();
  if (!AS) return { ...memoria };
  try {
    const raw = await AS.getItem(CLAVE);
    if (raw) {
      const parsed = JSON.parse(raw);
      memoria = {
        ...memoria,
        ...parsed,
        exclusiones: Array.isArray(parsed.exclusiones) ? parsed.exclusiones : memoria.exclusiones,
        tiposExcluidos: Array.isArray(parsed.tiposExcluidos) ? parsed.tiposExcluidos : memoria.tiposExcluidos,
      };
    }
    return { ...memoria };
  } catch (_e) {
    return { ...memoria };
  }
}

export async function guardarPreferencias(cambios = {}) {
  const actual = await leerPreferencias();
  memoria = { ...actual, ...cambios };
  const AS = await obtenerStorage();
  if (AS) {
    try {
      await AS.setItem(CLAVE, JSON.stringify(memoria));
    } catch (_e) {
      // Si falla el storage, la copia en memoria sigue viva durante la sesión
    }
  }
  return { ...memoria };
}