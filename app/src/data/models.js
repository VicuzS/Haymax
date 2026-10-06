/**
 * Modelos de dominio (JSDoc — se migran a TypeScript si el equipo lo decide).
 * Trazabilidad: entidades inferidas de las 31 pantallas del inventario.
 */

/**
 * @typedef {Object} Usuario
 * @property {string} id
 * @property {string} nombre
 * @property {string} email
 * @property {string} [foto]
 */

/**
 * @typedef {Object} Receta
 * @property {string} id            // REC-01... (pantalla de origen)
 * @property {string} nombre
 * @property {string} imagen
 * @property {number} minutos
 * @property {number} porciones
 * @property {number} calorias
 * @property {string[]} ingredientes
 * @property {string[]} pasos
 * @property {"facil"|"media"|"dificil"} dificultad
 * @property {number} precioEstimado // S/
 */

/**
 * @typedef {Object} ProductoDespensa
 * @property {string} id
 * @property {string} nombre
 * @property {string} categoria     // verduras, lácteos, carnes...
 * @property {number} cantidad
 * @property {string} unidad        // und, gr, ml, paq
 * @property {string} fechaVencimiento  // ISO yyyy-mm-dd
 * @property {"ok"|"por-vencer"|"vencido"} estado
 */

/**
 * @typedef {Object} PlanComida
 * @property {string} id
 * @property {"lunes"|"martes"|"miercoles"|"jueves"|"viernes"|"sabado"|"domingo"} dia
 * @property {"desayuno"|"almuerzo"|"cena"} comida
 * @property {string} recetaId
 * @property {number} porciones
 */

/**
 * @typedef {Object} Preferido
 * @property {string} recetaId
 * @property {string} guardadoEn    // ISO fecha
 */

export {};
