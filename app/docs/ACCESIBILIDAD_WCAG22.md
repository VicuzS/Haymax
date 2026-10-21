# Evaluación de accesibilidad WCAG 2.2 — Haymax (app Expo / React Native)

Alcance: componentes base (`app/src/components`), pantallas de acceso (ACC-02/03), inicio (INI-01),
alertas de vencimiento (PRE-03) y preparación/descuento (PRE-01/02). Nivel objetivo: **AA**.
Estado: ✅ implementado en este cambio · 🟡 parcial / requiere verificación manual · ⬜ pendiente.

| Criterio | Qué se evaluó | Estado | Dónde |
|---|---|---|---|
| 1.1.1 Contenido no textual | Iconos y fotos eran anunciados o sin alternativa | ✅ Iconos decorativos ocultos; imágenes de receta decorativas (el título las describe) | `Icon.js`, `kit.js` |
| 1.3.1 Información y relaciones | Títulos sin rol de encabezado; filas sin texto combinado | ✅ `accessibilityRole="header"`, filas/tarjetas con etiqueta combinada | `kit.js` |
| 1.3.4 Orientación | `orientation: "portrait"` bloqueaba la rotación | ✅ `"default"` (probar layouts en horizontal) | `app.json` |
| 1.3.5 Identificar el propósito de la entrada | Campos sin `autoComplete` | ✅ email, name, current/new-password | `kit.js`, `ACC-02/03` |
| 1.4.1 Uso del color | Estado de vencimiento solo por color | ✅ Texto explícito ("Vence hoy", "Venció hace 2 días") + color | `PRE-03.js`, `fechas.js` |
| 1.4.3 Contraste mínimo | `muted` 2,68:1; `sub` 4,37:1; `amber` 3,99:1 | ✅ `muted #666666` (5,45), `sub #5C5C5C`, `amber #8F5400` (5,75) | `tokens/index.js` |
| 1.4.4 Cambio de tamaño del texto | Alturas fijas y `numberOfLines={1}` recortaban | ✅ `minHeight` en Button/AppBar/Input/Stepper; Row y PhotoCard sin truncar | `Button.js`, `kit.js` |
| 1.4.10 Reflow | Contenido en `ScrollView` | 🟡 Verificar a 200 % de fuente y en horizontal | manual |
| 1.4.11 Contraste no textual | Bordes de campos `#E6E6E6` sobre blanco | ⬜ Subir `colors.border` de los inputs a ≥ 3:1 | `tokens` |
| 2.1.1 / 2.4.3 Teclado y orden de foco (web) | Pressable focusables por defecto | 🟡 Probar con `npm run web` y Tab | manual |
| 2.4.2 Página titulada | Título de ruta = "DES-05" | ✅ Título = nombre de pantalla; se anuncia al abrir | `[id].js`, `Screen.js` |
| 2.4.6 Encabezados y etiquetas | Sin encabezados en lectores de pantalla | ✅ | `kit.js` |
| 2.4.7 / 2.4.13 Foco visible | Sin estilo de foco | ✅ Contorno de 3 px en todos los controles | `a11y.js` |
| 2.4.11 Foco no oculto (WCAG 2.2) | Barra inferior fija | ✅ `paddingBottom: 96` del contenido | `Screen.js` |
| 2.5.3 Etiqueta en el nombre | Etiquetas accesibles distintas al texto visible | ✅ La etiqueta siempre contiene el texto visible | `Button.js`, `kit.js` |
| 2.5.8 Tamaño del objetivo (WCAG 2.2) | "−/+" y atrás < 24 px | ✅ 44×44 en steppers, atrás, campana, acciones de sección, enlaces | `kit.js`, `AppBar.js` |
| 3.2.6 Ayuda consistente (WCAG 2.2) | Icono "?" sin acción en el encabezado | 🟡 Se retiró el icono inerte; falta una pantalla de ayuda | `kit.js` |
| 3.3.2 Etiquetas o instrucciones | Solo `placeholder` | ✅ `label` visible en login y registro | `kit.js` |
| 3.3.7 Entrada redundante (WCAG 2.2) | Se pide la clave dos veces | ✅ Permitido (seguridad); ver 3.3.8 | `ACC-03` |
| 3.3.8 Autenticación accesible (WCAG 2.2) | Clave sin gestor de contraseñas | ✅ `autoComplete`/`textContentType`; no se bloquea el pegado | `ACC-02/03` |
| 4.1.2 Nombre, función, valor | Pressable sin rol ni estado | ✅ roles `button/link/tab/radio`, `selected`, `checked`, `disabled`, `busy` | `kit.js`, `_layout.js` |
| 4.1.3 Mensajes de estado | Errores y resultados sin anuncio | ✅ `alert`/`liveRegion` en Banner, Note(alerta), Loading, Stepper y `anunciar()` | `kit.js`, `a11y.js` |

## Integración corregida (alertas de vencimiento y preparación/descuento)

| Problema | Corrección |
|---|---|
| El descuento restaba 400 gr a 1 kg sin convertir → dejaba 0 | `descontarConReporte` convierte kg↔g y l↔ml |
| "Ya lo preparé" abría la 1.ª receta, no la de hoy | INI-01 pasa `receta` y PRE-01 elige el plan de **hoy** |
| "Hoy" se detectaba por nombre de día ("lunes" de otra semana) | Se compara por **fecha** |
| Si fallaba marcar el plan, el reintento descontaba dos veces | PRE-01 no repite el descuento ya aplicado |
| PRE-01 y PRE-02 escalaban distinto (`max(1)` vs `max(0)`) | Una sola función: `escalarIngredientes` |
| Falla a mitad de los `PUT /despensa` dejaba la despensa inconsistente | Reversión compensatoria + mensaje claro |
| Insumo no encontrado / stock insuficiente pasaba en silencio | Reporte en PRE-02 (CU-05) |
| Sin "Deshacer" tras marcar preparado | `deshacerPreparacion` (PRE-02) |
| "Marcar como descartado" solo navegaba | Acciones reales Usado / Descartar / Editar por insumo (HU-05) |
| La alerta no mostraba recetas que usan el insumo | `getRecetasConInsumos` (CU-04) |
| Descuento no priorizaba lo que vence antes | FEFO: primero el lote con vencimiento más cercano |

## Pendiente (requiere decisión o datos del backend)

- Reserva de insumos mientras el plato no se marca, aviso de las 9 pm y descuento automático a medianoche (CU-05): requiere esquema (`reservado`, `estimado`) y notificaciones push/cron.
- Umbral de aviso configurable (hoy fijo en 3 días en `api/src/utils.js`, HU-05 pide 1–2 días).
- Las exclusiones (AJU-02) son estado local: no filtran el motor ni el planificador (HU-07).
- Verificación con TalkBack / VoiceOver en dispositivo real (no se puede automatizar aquí).
