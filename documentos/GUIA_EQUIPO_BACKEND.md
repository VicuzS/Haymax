# Haymax — Guía del equipo de backend

Documento de trabajo para el equipo de 5 personas que mantiene la API de Haymax.

- **Stack:** Node.js + Express + SQLite (`better-sqlite3`).
- **Carpeta:** `api/` (la app móvil Expo vive en `app/`).
- **Auth:** JWT (`Authorization: Bearer <token>`).
- **Persistencia:** un único archivo `api/haymax.db` (se crea solo; no se versiona).

---

## 1. Arranque rápido

Requisitos: Node.js 18+ (probado con 20/22) y npm.

```bash
# 1) Copiar variables de entorno
copy api\.env.example api\.env      # PowerShell
# (o)  cp api/.env.example api/.env

# 2) Instalar dependencias
cd api
npm install

# 3) Crear datos de demostración (idempotente)
npm run seed

# 4) Levantar la API
npm run dev      # con recarga automática (node --watch)
# o  npm start
```

Comprobación: `GET http://localhost:4000/api/salud` → `{ "ok": true, ... }`.

**Usuario demo:** `rosa@haymax.pe` / `haymax123`.

### Reset de la base de datos

El esquema se crea con `CREATE TABLE IF NOT EXISTS`; por eso, **si cambia el
esquema hay que borrar el archivo** y volver a sembrar:

```powershell
Remove-Item api\haymax.db, api\haymax.db-shm, api\haymax.db-wal -ErrorAction SilentlyContinue
npm run seed
```

> El archivo `.db` está en `api/.gitignore`: nunca se sube al repositorio.

---

## 2. Estructura de archivos

```
api/
├── .env.example
├── package.json
└── src/
    ├── server.js              # arranque Express + montaje de rutas (infra)
    ├── db.js                  # conexión + esquema + helpers de BD (infra)
    ├── utils.js               # fechas, normalización y mapReceta (infra)
    ├── seed.js                # datos de demo idempotentes (infra/compartido)
    ├── middleware/
    │   └── auth.js            # auth JWT (Persona 1)
    └── routes/
        ├── auth.js            # Persona 1
        ├── despensa.js        # Persona 2
        ├── insumos.js         # Persona 2
        ├── recetas.js         # Persona 3
        ├── favoritos.js       # Persona 3
        ├── planes.js          # Persona 4
        └── compras.js         # Persona 4
```

**Infra compartida** (`server.js`, `db.js`, `utils.js`, `seed.js`): la tocan
todos, pero cualquier cambio debe anunciarse al equipo para evitar conflictos.
Cada persona es dueña de sus archivos de rutas.

---

## 3. Esquema de la base de datos (DDL)

Los datos de **despensa, plan y compras se agrupan por hogar** (`hogar_id`), lo
que permite varios usuarios por vivienda. El **catálogo de productos** es
compartido y alimenta a la despensa, los ingredientes de recetas y la lista de
compras.

```sql
CREATE TABLE usuarios (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  nombre        TEXT NOT NULL,
  foto_url      TEXT,
  distrito      TEXT,
  creado_en     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE hogares (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre    TEXT NOT NULL,
  distrito  TEXT,
  creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE hogar_integrantes (
  hogar_id   INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  rol        TEXT NOT NULL DEFAULT 'miembro' CHECK (rol IN ('admin','miembro')),
  PRIMARY KEY (hogar_id, usuario_id)
);

CREATE TABLE catalogo_productos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre             TEXT NOT NULL UNIQUE,
  categoria          TEXT NOT NULL,
  unidad_medida_base TEXT NOT NULL DEFAULT 'und'
);

CREATE TABLE despensa (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  hogar_id          INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  producto_id       INTEGER REFERENCES catalogo_productos(id),
  nombre            TEXT NOT NULL,
  cantidad          REAL NOT NULL DEFAULT 0,
  unidad_medida     TEXT NOT NULL DEFAULT 'und',
  fecha_vencimiento TEXT,
  ubicacion         TEXT NOT NULL DEFAULT 'Despensa',
  creado_en         TEXT NOT NULL DEFAULT (datetime('now')),
  actualizado_en    TEXT
);

CREATE TABLE recetas (
  id                    TEXT PRIMARY KEY,
  titulo                TEXT NOT NULL,
  descripcion           TEXT,
  imagen                TEXT,
  porciones             INTEGER NOT NULL DEFAULT 1,
  tiempo_preparacion_min INTEGER NOT NULL DEFAULT 0,
  dificultad            TEXT NOT NULL DEFAULT 'facil' CHECK (dificultad IN ('facil','media','dificil')),
  precio                REAL NOT NULL DEFAULT 0,
  distrito              TEXT,
  nutri_calorias        INTEGER NOT NULL DEFAULT 0,
  nutri_proteinas       REAL NOT NULL DEFAULT 0,
  nutri_carbohidratos   REAL NOT NULL DEFAULT 0,
  nutri_grasas          REAL NOT NULL DEFAULT 0,
  nutri_fibra           REAL NOT NULL DEFAULT 0,
  pasos                 TEXT NOT NULL DEFAULT '[]',   -- JSON: ["Sellar la carne", ...]
  autor_id              INTEGER REFERENCES usuarios(id),
  publica               INTEGER NOT NULL DEFAULT 1,
  creado_en             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE receta_ingredientes (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  receta_id     TEXT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  producto_id   INTEGER REFERENCES catalogo_productos(id),
  nombre        TEXT NOT NULL,
  cantidad      REAL NOT NULL DEFAULT 1,
  unidad_medida TEXT NOT NULL DEFAULT 'und',
  opcional      INTEGER NOT NULL DEFAULT 0,
  orden         INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE planes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  hogar_id   INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  receta_id  TEXT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  fecha      TEXT NOT NULL,                              -- 'YYYY-MM-DD'
  comida     TEXT NOT NULL CHECK (comida IN ('desayuno','almuerzo','cena')),
  porciones  INTEGER NOT NULL DEFAULT 1,
  completado INTEGER NOT NULL DEFAULT 0,
  creado_en  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE compras (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  hogar_id      INTEGER NOT NULL REFERENCES hogares(id) ON DELETE CASCADE,
  producto_id   INTEGER REFERENCES catalogo_productos(id),
  nombre        TEXT NOT NULL,
  cantidad      TEXT NOT NULL DEFAULT '1',
  unidad_medida TEXT,
  seccion       TEXT NOT NULL DEFAULT 'Mercado de abastos',
  comprado      INTEGER NOT NULL DEFAULT 0,
  creado_en     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE favoritos (
  usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  receta_id   TEXT NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
  guardado_en TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (usuario_id, receta_id)
);
```

Notas de diseño:

- El **estado de vencimiento** (`ok` / `por-vencer` / `vencido`) **no se guarda**:
  se calcula en las consultas con `utils.ESTADO_SQL` (aviso a 3 días).
- `recetas.id` es un texto legible (p. ej. `REC-LOMO`); el resto usa `INTEGER
  AUTOINCREMENT`.
- `pasos` es un JSON serializado en `TEXT`.
- `planes.fecha` es fecha real; el "día de la semana" (`lunes`, ...) se deriva en
  la respuesta con `utils.diaSemana`.

---

## 4. Contrato de la API

Base: `http://localhost:4000/api`. Todas las respuestas son JSON. Los errores
tienen la forma `{ "error": "mensaje" }` con su código HTTP.

> Compatibilidad: las respuestas incluyen **alias** con los nombres que ya
> consume `app/src/lib/api.js` (p. ej. `nombre`, `minutos`, `unidad`, `listo`).
> Así el frontend sigue funcionando sin cambios y las personas 3 y 5 pueden
> migrar con calma.

### 4.1 Autenticación — Persona 1

| Método | Ruta | Auth | Cuerpo | Respuesta |
| ------ | ---- | ---- | ------ | --------- |
| POST | `/auth/registro` | no | `{ nombre, email, password, distrito? }` | `201 { token, user }` |
| POST | `/auth/login` | no | `{ email, password }` | `200 { token, user }` |
| GET | `/auth/yo` | sí | — | `200 { user }` |
| PUT | `/auth/perfil` | sí | `{ nombre?, foto_url?, distrito? }` | `200 { user }` |

`user = { id, nombre, email, foto_url, distrito }`.

Al registrarse, el usuario recibe automáticamente un **hogar personal** (helper
`db.hogarDe`).

### 4.2 Despensa e insumos — Persona 2

| Método | Ruta | Auth | Cuerpo / Query | Respuesta |
| ------ | ---- | ---- | -------------- | --------- |
| GET | `/despensa` | sí | — | `[insumo]` |
| GET | `/despensa/por-vencer` | sí | — | `[insumo]` (estado ≠ `ok`) |
| POST | `/despensa` | sí | `{ nombre, categoria, cantidad, unidad\|unidad_medida, fecha_vencimiento?, ubicacion? }` | `201 insumo` |
| PUT | `/despensa/:id` | sí | `{ cantidad?, unidad?\|unidad_medida?, fecha_vencimiento?, ubicacion? }` | `200 insumo` |
| DELETE | `/despensa/:id` | sí | — | `204` |
| GET | `/insumos` | no | `?q=&categoria=` | `[producto]` |
| POST | `/insumos` | sí | `{ nombre, categoria, unidad_medida_base? }` | `201 producto` |

```jsonc
// insumo
{ "id": 4, "nombre": "Ají amarillo", "categoria": "Verduras", "cantidad": 5,
  "unidad": "und", "unidad_medida": "und", "fecha_vencimiento": "2026-10-08",
  "ubicacion": "Refrigerador", "producto_id": 4, "estado": "vencido" }

// producto (catálogo)
{ "id": 4, "nombre": "Ají amarillo", "categoria": "Verduras", "unidad_medida_base": "und" }
```

`POST /despensa` crea el producto en el catálogo si no existe (helper
`db.productoId`).

### 4.3 Recetas y favoritos — Persona 3

| Método | Ruta | Auth | Cuerpo / Query | Respuesta |
| ------ | ---- | ---- | -------------- | --------- |
| GET | `/recetas` | opcional | `?q=&distrito=` | `[receta]` |
| GET | `/recetas/disponibilidad` | opcional | — | `[disponibilidad]` |
| GET | `/recetas/:id` | opcional | — | `receta` |
| POST | `/recetas` | sí | `{ id, titulo\|nombre, ingredientes[], ... }` | `201 receta` |
| GET | `/favoritos` | sí | — | `[receta]` |
| POST | `/favoritos` | sí | `{ receta_id }` | `201 { receta_id, esFavorito }` |
| POST | `/favoritos/:recetaId` | sí | — | `201 { receta_id, esFavorito }` |
| DELETE | `/favoritos/:recetaId` | sí | — | `204` |

```jsonc
// receta
{ "id": "REC-LOMO", "nombre": "Lomo saltado", "minutos": 35, "calorias": 520,
  "titulo": "Lomo saltado", "descripcion": "...", "imagen": "https://...",
  "porciones": 2, "tiempo_preparacion_min": 35, "dificultad": "facil",
  "precio": 28.5, "distrito": "Surquillo",
  "nutri_proteinas": 32, "nutri_carbohidratos": 40, "nutri_grasas": 22, "nutri_fibra": 4,
  "ingredientes": ["400 gr de Lomo fino", "1 und de Cebolla roja", "..."],
  "ingredientes_detalle": [ { "id": 1, "producto_id": 6, "nombre": "Lomo fino",
                              "cantidad": 400, "unidad_medida": "gr", "opcional": 0, "orden": 0 } ],
  "pasos": ["Sellar la carne", "..."], "esFavorito": true }

// disponibilidad (motor: cruza receta con la despensa del hogar)
{ "id": "REC-AGALLINA", "nombre": "Ají de gallina", "imagen": "...", "minutos": 55,
  "porciones": 4, "precio": 32, "disponible": false, "cobertura": 67,
  "faltantes": ["6 und de Galletas de agua", "50 gr de Nueces"], "faltantes_count": 2,
  "nutricion": { "calorias": 610, "proteinas": 35, "carbohidratos": 48, "grasas": 28, "fibra": 3 } }
```

### 4.4 Planificación y compras — Persona 4

| Método | Ruta | Auth | Cuerpo / Query | Respuesta |
| ------ | ---- | ---- | -------------- | --------- |
| GET | `/planes` | sí | `?desde=&hasta=` | `[plan]` |
| POST | `/planes` | sí | `{ receta_id, comida, fecha?\|dia?, porciones?, completado? }` | `201 plan` |
| PUT | `/planes/:id` | sí | `{ receta_id?, fecha?, comida?, porciones?, completado? }` | `200 plan` |
| DELETE | `/planes/:id` | sí | — | `204` |
| GET | `/compras` | sí | — | `[compra]` |
| POST | `/compras` | sí | `{ nombre, cantidad?, unidad_medida?\|unidad?, seccion?, comprado?\|listo?, producto_id? }` | `201 compra` |
| POST | `/compras/generar` | sí | `{ fecha? }` | `201 { creados }` |
| PUT | `/compras/:id` | sí | — | `200 compra` (alterna `comprado`) |
| DELETE | `/compras/:id` | sí | — | `204` |

```jsonc
// plan  (acepta `fecha` ISO o `dia` tipo "lunes", que se resuelve a la semana actual)
{ "id": 1, "fecha": "2026-10-12", "dia": "lunes", "comida": "almuerzo",
  "receta_id": "REC-LOMO", "porciones": 2, "completado": false }

// compra
{ "id": 9, "nombre": "Ají amarillo", "cantidad": "1 atado", "unidad_medida": "atado",
  "seccion": "Mercado de abastos", "listo": false, "comprado": false, "producto_id": null }
```

`POST /compras/generar` recorre el plan (semana de `fecha`, por defecto hoy) y
agrega a la lista los ingredientes que **no** están en la despensa ni ya en la
lista.

---

## 5. Reparto de tareas (5 personas)

Cada persona es dueña de sus archivos de rutas. `server.js`, `db.js`, `utils.js`
y `seed.js` son compartidos: coordinad antes de tocarlos.

### Persona 1 — Autenticación y perfil

- **Archivos:** `src/middleware/auth.js`, `src/routes/auth.js`.
- **Endpoints:** `/auth/registro`, `/auth/login`, `/auth/yo`, `/auth/perfil`.
- **Cubre:** hash de contraseñas (bcrypt), firma/verificación JWT, creación del
  hogar personal, validaciones de entrada, códigos 400/401/409.
- **Tareas extra:** expiración de token, endpoint para unir un usuario a un
  hogar existente (`hogar_integrantes`), y `PUT /auth/perfil` con foto.
- **Aceptación:** login demo devuelve token; `/auth/yo` con token inválido → 401.

### Persona 2 — Despensa y catálogo

- **Archivos:** `src/routes/despensa.js`, `src/routes/insumos.js`.
- **Endpoints:** `/despensa` (GET/POST/PUT/DELETE), `/despensa/por-vencer`,
  `/insumos` (GET/POST).
- **Cubre:** scoping por hogar, cálculo de estado de vencimiento, alta automática
  de productos en el catálogo, registro manual de insumos.
- **Tareas extra:** filtros (`?categoria=`, `?estado=`) y validación de
  cantidades/fechas.
- **Aceptación:** `por-vencer` solo devuelve `por-vencer`/`vencido`; PUT parcial
  no borra campos.

### Persona 3 — Recetas, ingredientes y favoritos

- **Archivos:** `src/routes/recetas.js`, `src/routes/favoritos.js`.
- **Endpoints:** `/recetas` (+`/disponibilidad`, `/:id`, POST), `/favoritos`
  (GET/POST/DELETE).
- **Cubre:** ingesta de ingredientes estructurados, búsqueda, y el **motor de
  disponibilidad** que compara cada receta con la despensa del hogar.
- **Tareas extra:** paginación/orden, imágenes, y afinar el matching de
  ingredientes (normalización de acentos y unidades).
- **Aceptación:** `disponibilidad` reporta `cobertura` y `faltantes` coherentes;
  POST de receta persiste ingredientes.

### Persona 4 — Planificación y compras

- **Archivos:** `src/routes/planes.js`, `src/routes/compras.js`.
- **Endpoints:** `/planes` (GET/POST/PUT/DELETE), `/compras`
  (GET/POST/PUT/DELETE) y `/compras/generar`.
- **Cubre:** plan semanal por hogar, conversión `dia`↔`fecha`, y generación de la
  lista de compras a partir de los faltantes del plan.
- **Tareas extra:** marcar `planes.completado`, descuento de despensa al cocinar
  (`PUT /despensa/:id`) y agrupación por sección.
- **Aceptación:** `generar` no duplica ítems existentes ni los que ya están en
  despensa.

### Persona 5 — Integración con la app (frontend)

- **Archivos:** `app/src/lib/api.js` y pantallas en `app/src/app/`.
- **Tareas:** alinear el consumo con el contrato de la sección 4, usar los alias
  (`nombre`, `minutos`, `unidad`, `listo`, `dia`) o migrar a los nombres canónicos,
  conectar los endpoints nuevos (`/insumos`, `/recetas/disponibilidad`,
  `/compras/generar`, `/favoritos`) y manejar estados de carga/error.
- **Aceptación:** las pantallas funcionan en **modo cuenta** contra la API real
  sin romper el **modo invitado**.

> El reparto cubre todo el backend actual. Cualquier endpoint nuevo se asigna al
> dueño del recurso; los transversales (infra) se resuelven en pareja.

---

## 6. Convenciones

- **BD en `snake_case`**; las respuestas exponen alias en camelCase/lowcase para
  el frontend. El mapeo vive en `utils.js` (`mapReceta`) y en cada ruta.
- **Errores:** `{ "error": "..." }`; nunca filtrar stack traces.
- **Scoping:** toda consulta de despensa/plan/compras filtra por `hogar_id`
  obtenido con `db.hogarDe(req.user.id)`.
- **Transacciones:** operaciones de varias escrituras con `db.transaction(fn)`
  (ver `seed.js`).
- **Git:** una rama por persona (`feat/back-<tema>`), commits pequeños y PR a la
  rama de integración. No subir `haymax.db`, `.env` ni `node_modules/`.

## 7. Definición de "terminado"

1. El endpoint responde con el código y la forma documentados.
2. Requiere token cuando corresponde (rutas privadas).
3. Filtra por `hogar_id` / `usuario_id` (no filtra datos de otros).
4. `npm run seed` corre limpio y dos veces seguidas no duplica filas.
5. Probado con `curl`/`Invoke-RestMethod` contra el usuario demo.
```
