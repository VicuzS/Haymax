// Configuración global del app (Fase 5).
// SHOW_DEV_TAGS: etiquetas de desarrollo (crumb INI-01, nombre de pantalla en
// el AppBar y el chip del wireframe). En la demo final van en false; para
// validar de nuevo contra el DOCX, volver a true.
export const SHOW_DEV_TAGS = false;

// URL base de haymax-api. Se puede sobreescribir con EXPO_PUBLIC_API_URL
// (por ejemplo, la IP de la máquina si se prueba desde el celular).
export const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
