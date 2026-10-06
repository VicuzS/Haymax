import { router } from "expo-router";

// Las 4 pestañas de la barra inferior (raíces del prototipo Figma).
export const TAB_ROOTS = ["INI-01", "DES-01", "PLA-05", "AJU-01"];

export const TAB_ROUTES = {
  "INI-01": "/(tabs)",
  "DES-01": "/(tabs)/despensa",
  "PLA-05": "/(tabs)/planificar",
  "AJU-01": "/(tabs)/ajustes",
};

export function isTabScreen(id) {
  return TAB_ROOTS.indexOf(id) !== -1;
}

export function routeFor(id) {
  return TAB_ROUTES[id] || "/screen/" + id;
}

// Navegación única del app: siempre se invoca con el ID del inventario (ACC-03, DES-05...).
// `params` permite pasar datos a la pantalla (p. ej. go("REC-02", { receta: id })).
export function go(id, params) {
  if (!id) return;
  const route = routeFor(id);
  const nav = router.navigate || router.push;
  if (params && Object.keys(params).length > 0) {
    nav({ pathname: route, params });
  } else {
    nav(route);
  }
}

export function canGoBack() {
  return typeof router.canGoBack === "function" ? router.canGoBack() : false;
}
