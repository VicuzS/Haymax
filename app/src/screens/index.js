// Registro maestro de las 31 pantallas del inventario (cobertura 31/31).
import { createElement } from "react";

export const SCREEN_IDS = [
  "ACC-01",
  "ACC-02",
  "ACC-03",
  "ACC-04",
  "INI-01",
  "INI-02",
  "INI-03",
  "REC-01",
  "REC-02",
  "DES-01",
  "DES-02",
  "DES-03",
  "DES-04",
  "DES-05",
  "DES-06",
  "DES-07",
  "DES-08",
  "PLA-01",
  "PLA-02",
  "PLA-03",
  "PLA-04",
  "PLA-05",
  "COM-01",
  "PRE-01",
  "PRE-02",
  "PRE-03",
  "SAL-01",
  "AJU-01",
  "AJU-02",
  "AJU-03",
  "AJU-04"
];

export const SCREEN_META = {
  "ACC-01": {
    "name": "Splash",
    "tab": null,
    "hasFab": false
  },
  "ACC-02": {
    "name": "Iniciar sesión / Registrarse",
    "tab": null,
    "hasFab": false
  },
  "ACC-03": {
    "name": "Onboarding: bienvenida y permisos",
    "tab": null,
    "hasFab": false
  },
  "ACC-04": {
    "name": "Configuración inicial: distrito e integrantes",
    "tab": null,
    "hasFab": false
  },
  "INI-01": {
    "name": "Inicio: plato planeado hoy",
    "tab": 0,
    "hasFab": true
  },
  "INI-02": {
    "name": "Inicio: estado vacío (primera vez)",
    "tab": 0,
    "hasFab": false
  },
  "INI-03": {
    "name": "Recetas cerca de ti (por distrito)",
    "tab": 0,
    "hasFab": false
  },
  "REC-01": {
    "name": "¿Qué puedo cocinar? (motor)",
    "tab": 0,
    "hasFab": true
  },
  "REC-02": {
    "name": "Detalle de receta",
    "tab": 0,
    "hasFab": false
  },
  "DES-01": {
    "name": "Mi Despensa",
    "tab": 1,
    "hasFab": true
  },
  "DES-02": {
    "name": "Detalle de insumo: editar o eliminar",
    "tab": 1,
    "hasFab": false
  },
  "DES-03": {
    "name": "Agregar insumos: opciones",
    "tab": 1,
    "hasFab": false
  },
  "DES-04": {
    "name": "Cámara de escaneo (boleta o lista)",
    "tab": null,
    "hasFab": false
  },
  "DES-05": {
    "name": "Revisión del escaneo",
    "tab": 1,
    "hasFab": false
  },
  "DES-06": {
    "name": "Alta manual: Paso 1, producto y cantidad",
    "tab": 1,
    "hasFab": false
  },
  "DES-07": {
    "name": "Alta manual: Paso 2, revisar y confirmar",
    "tab": 1,
    "hasFab": false
  },
  "DES-08": {
    "name": "Insumos agregados (confirmación)",
    "tab": 1,
    "hasFab": false
  },
  "PLA-01": {
    "name": "Planificar: Paso 1, selector de porciones",
    "tab": 2,
    "hasFab": false
  },
  "PLA-02": {
    "name": "Planificar: Paso 2A, confirmación exitosa",
    "tab": 2,
    "hasFab": false
  },
  "PLA-03": {
    "name": "Planificar: Paso 2B, faltan insumos",
    "tab": 2,
    "hasFab": false
  },
  "PLA-04": {
    "name": "Planificar: Paso 2C, conflicto de platos",
    "tab": 2,
    "hasFab": false
  },
  "PLA-05": {
    "name": "Plan semanal (7 días)",
    "tab": 2,
    "hasFab": false
  },
  "COM-01": {
    "name": "Lista de compras",
    "tab": 0,
    "hasFab": false
  },
  "PRE-01": {
    "name": "Modal: ¿Ya preparaste el plato?",
    "tab": null,
    "hasFab": false
  },
  "PRE-02": {
    "name": "Despensa actualizada: insumos descontados",
    "tab": null,
    "hasFab": false
  },
  "PRE-03": {
    "name": "Alerta de vencimiento",
    "tab": null,
    "hasFab": false
  },
  "SAL-01": {
    "name": "Resumen de salud",
    "tab": 0,
    "hasFab": false
  },
  "AJU-01": {
    "name": "Ajustes",
    "tab": 3,
    "hasFab": false
  },
  "AJU-02": {
    "name": "Exclusiones de ingredientes",
    "tab": 3,
    "hasFab": false
  },
  "AJU-03": {
    "name": "Integrantes del hogar / despensa compartida (Fase 2)",
    "tab": 3,
    "hasFab": false
  },
  "AJU-04": {
    "name": "Plan de suscripción (freemium)",
    "tab": 3,
    "hasFab": false
  }
};

const LOADERS = {
  "ACC-01": () => require("./ACC-01").default,
  "ACC-02": () => require("./ACC-02").default,
  "ACC-03": () => require("./ACC-03").default,
  "ACC-04": () => require("./ACC-04").default,
  "INI-01": () => require("./INI-01").default,
  "INI-02": () => require("./INI-02").default,
  "INI-03": () => require("./INI-03").default,
  "REC-01": () => require("./REC-01").default,
  "REC-02": () => require("./REC-02").default,
  "DES-01": () => require("./DES-01").default,
  "DES-02": () => require("./DES-02").default,
  "DES-03": () => require("./DES-03").default,
  "DES-04": () => require("./DES-04").default,
  "DES-05": () => require("./DES-05").default,
  "DES-06": () => require("./DES-06").default,
  "DES-07": () => require("./DES-07").default,
  "DES-08": () => require("./DES-08").default,
  "PLA-01": () => require("./PLA-01").default,
  "PLA-02": () => require("./PLA-02").default,
  "PLA-03": () => require("./PLA-03").default,
  "PLA-04": () => require("./PLA-04").default,
  "PLA-05": () => require("./PLA-05").default,
  "COM-01": () => require("./COM-01").default,
  "PRE-01": () => require("./PRE-01").default,
  "PRE-02": () => require("./PRE-02").default,
  "PRE-03": () => require("./PRE-03").default,
  "SAL-01": () => require("./SAL-01").default,
  "AJU-01": () => require("./AJU-01").default,
  "AJU-02": () => require("./AJU-02").default,
  "AJU-03": () => require("./AJU-03").default,
  "AJU-04": () => require("./AJU-04").default,
};

export function getScreen(id) {
  const load = LOADERS[id];
  return load ? load() : null;
}

export function hasScreen(id) {
  return !!LOADERS[id];
}

// Devuelve el elemento de la pantalla (o null si el ID no existe).
export function renderScreen(id, props) {
  const load = LOADERS[id];
  return load ? createElement(load(), props) : null;
}
