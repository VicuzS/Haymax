import { router } from "expo-router";

// Solo estas cuatro raíces aparecen como pestañas reales.
export const TAB_ROOTS = ["INI-01", "DES-01", "PLA-05", "AJU-01"];
export const AUTH_SCREEN_IDS = ["ACC-01", "ACC-02", "ACC-03"];

export const TAB_ROUTES = {
  "INI-01": "/(tabs)",
  "DES-01": "/(tabs)/despensa",
  "PLA-05": "/(tabs)/planificar",
  "AJU-01": "/(tabs)/ajustes",
};

export function isTabScreen(id) {
  return TAB_ROOTS.indexOf(id) !== -1;
}

export function isAuthScreenPath(pathname) {
  const match = String(pathname || "").match(/(?:^|\/)screen\/(ACC-0[123])\/?$/);
  return !!(match && AUTH_SCREEN_IDS.includes(match[1]));
}

export function routeFor(id) {
  return TAB_ROUTES[id] || "/screen/" + id;
}

// Navegación única del app: siempre se invoca con el ID del inventario.
export function go(id, params) {
  if (!id) return;
  const route = routeFor(id);
  const nav = router.navigate || router.push;
  if (params && Object.keys(params).length > 0) nav({ pathname: route, params });
  else nav(route);
}

// Reemplaza la ruta actual; útil al cerrar sesión para que Atrás no reabra Ajustes.
export function replaceTo(id, params) {
  if (!id) return;
  const route = routeFor(id);
  if (params && Object.keys(params).length > 0) router.replace({ pathname: route, params });
  else router.replace(route);
}

export function canGoBack() {
  return typeof router.canGoBack === "function" ? router.canGoBack() : false;
}
