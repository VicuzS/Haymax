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

* **Frontend Móvil:** Flutter / React Native
* **Backend:** Node.js (Express) / Python (FastAPI)
* **Base de Datos:** PostgreSQL + Redis
* **Servicios OCR:** Google Cloud Vision API / Tesseract
* **Diseño:** Figma

---

## 🚀 Inicio Rápido

1. Clonar repositorio:
```bash
   git clone https://github.com/tu-usuario/haymax-app.git
   cd haymax-app
```
2. Backend:
```bash
   cd src/backend
   npm install
   npm run dev
```

3. Frontend Móvil:
```bash
   cd src/mobile
   flutter pub get
   flutter run
```
