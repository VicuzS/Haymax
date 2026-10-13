# Haymax 🥑 - Cocina Inteligente sin Desperdicio

Es una aplicación móvil diseñada para el hogar peruano que reduce el desperdicio de alimentos y resuelve la indecisión diaria sobre qué cocinar. Transforma la despensa actual en un menú semanal optimizado mediante escaneo inteligente de boletas/listas y sugerencias por disponibilidad real e insumos del distrito.

---

## 🎯 Características Principales (MVP)

* **📸 Registro Dual (OCR + Manual):** Escaneo automático de boletas de supermercado/listas manuscritas mediante OCR e ingreso manual flexible en unidades locales (kilos, atados, piezas) para compras de mercado.
* **🍲 Motor de Recetas por Disponibilidad:** Sugiere platos usando únicamente lo que hay en casa, indicando precios promedio e insumos faltantes si la receta es parcial.
* **🗓️ Planificador Semanal & Lista Automática:** Genera el menú de la semana priorizando insumos perecibles y consolida la lista exacta de lo que falta comprar.
* **⏰ Alertas de Vencimiento:** Notificaciones preventivas con sugerencias directas de recetas para evitar mermas.
* **🍳 Registro de Plato Preparado:** Descuento automático de insumos al cocinar y balance nutricional en el resumen de salud.

---

## 👥 Público Objetivo

* **Segmento Principal (85%):** Administradores de la cocina en hogares familiares (Ej. Rosa, 50 años).
* **Segmento Secundario (15%):** Jóvenes independientes o universitarios (Ej. Diego, 32 años).

---

## 🔬 Evaluación de Calidad (UX & Accesibilidad)

* **Usabilidad (Método UsabVEP):**
  * **Fase 1 (Experta):** Inspección heurística (H1–H11) en Figma evaluando estética, visibilidad de estado en OCR y prevención de errores.
  * **Fase 2 (Usuarios):** Pruebas empíricas midiendo tasa de éxito en tareas, curva de aprendizaje y nivel de satisfacción.
* **Accesibilidad (WCAG 2.1/2.2):**
  * Interfaz perceptible (alto contraste, escalado de texto a 200%).
  * Zonas de toque amplias y compatibilidad con lectores de pantalla (TalkBack/VoiceOver) e interacción por voz.

---

## 🛠️ Stack Tecnológico

* **Frontend Móvil:** React Native + Expo (Expo Router)
* **Backend:** Node.js (Express) + JWT
* **Base de Datos:** SQLite (`better-sqlite3`)
* **Servicios OCR:** pendiente de integración (Google Cloud Vision API / Tesseract previstos)
* **Diseño:** Figma

---

## 🚀 Inicio Rápido

Requisitos: **Node.js 18+** y **npm**. El repositorio tiene dos carpetas: `api/`
(backend) y `app/` (frontend móvil).

> En Windows, si PowerShell bloquea `npm`/`npx`, antepón `cmd /c` a cada comando.

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/haymax-app.git
cd haymax-app
```

### 2. Backend (API)

```bash
cd api
cp .env.example .env        # en Windows: copy .env.example .env
npm install
npm run seed                # carga datos de demostración (idempotente)
npm run dev                 # API en http://localhost:4000/api/salud
```

### 3. Frontend móvil (Expo)

En otra terminal:

```bash
cd app
npm install
npx expo start              # `w` = web, `a` = Android, `i` = iOS
```

Por defecto el app apunta a `http://localhost:4000/api`. Para probarlo en un
celular físico, crea `app/.env` con `EXPO_PUBLIC_API_URL=http://<IP-LOCAL>:4000/api`.

### 4. Usuario de demostración

```
usuario: rosa@haymax.pe
clave:   haymax123
```

Guía detallada del backend: [`documentos/GUIA_EQUIPO_BACKEND.md`](documentos/GUIA_EQUIPO_BACKEND.md).
