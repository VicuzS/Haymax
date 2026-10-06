import { recipesMock, pantryMock, mealPlanMock, favoritesMock } from "./mock";

// Fase 1: mock local. Fase 2: poner USE_API = true y definir EXPO_PUBLIC_API_URL.
const USE_API = false;
const BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";

async function http(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} en ${path}`);
  return res.json();
}

const withFlag = (mockValue, path, options) =>
  USE_API ? http(path, options) : Promise.resolve(mockValue);

export const auth = {
  signIn: (email, password) =>
    withFlag(
      { id: "U-01", nombre: "Rosa Ticlla", email },
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) }
    ),
  signOut: () => withFlag({ ok: true }, "/auth/logout", { method: "POST" }),
};

export const recipes = {
  list: () => withFlag(recipesMock, "/recetas"),
  getById: (id) =>
    withFlag(recipesMock.find((r) => r.id === id) || null, `/recetas/${id}`),
  search: (q) =>
    withFlag(
      recipesMock.filter((r) => r.nombre.toLowerCase().includes(String(q).toLowerCase())),
      `/recetas?q=${encodeURIComponent(q)}`
    ),
};

export const pantry = {
  list: () => withFlag(pantryMock, "/despensa"),
  add: (item) =>
    withFlag(item, "/despensa", { method: "POST", body: JSON.stringify(item) }),
  remove: (id) => withFlag({ id }, `/despensa/${id}`, { method: "DELETE" }),
};

export const mealPlan = {
  list: () => withFlag(mealPlanMock, "/planes"),
  save: (plan) =>
    withFlag(plan, "/planes", { method: "POST", body: JSON.stringify(plan) }),
};

export const favorites = {
  list: () => withFlag(favoritesMock, "/favoritos"),
  add: (recetaId) =>
    withFlag({ recetaId }, "/favoritos", { method: "POST", body: JSON.stringify({ recetaId }) }),
  remove: (recetaId) =>
    withFlag({ recetaId }, `/favoritos/${recetaId}`, { method: "DELETE" }),
};
