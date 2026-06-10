# Manual Técnico — ASL Sign Language Translator

## 1. Requisitos Previos

| Herramienta | Versión | Uso |
|---|---|---|
| Python | 3.12.9 | Backend y ML |
| Node.js | 18+ | Frontend Angular |
| Angular CLI | 21 | Frontend |
| Docker Desktop | — | PostgreSQL en local |
| Git | — | Control de versiones |

Cuentas necesarias:
- **Supabase** — base de datos PostgreSQL y Storage
- **Railway** — despliegue del backend
- **Netlify** — despliegue del frontend
- **Hugging Face** — almacenamiento del modelo `.pkl`

---

## 2. Configuración del Entorno Local

### 2.1 Clonar el repositorio

```bash
git clone https://github.com/j-gonzdev/sign-language-translator.git
cd sign-language-translator
```

### 2.2 Variables de entorno

Copia el archivo de ejemplo y rellena los valores:

```bash
cp .env.example .env
```

Variables requeridas en `.env`:

```env
# ── Entorno ───────────────────────────────────────────────────────────────────
APP_ENV=development          # development | production
APP_HOST=0.0.0.0
APP_PORT=8000

# ── Base de datos ─────────────────────────────────────────────────────────────
# Desarrollo local (docker-compose PostgreSQL)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/asl_db

# Producción (Supabase) — configurar en Railway como variable de entorno
# DATABASE_URL=postgresql+asyncpg://postgres:<password>@<host>:5432/postgres

# ── JWT ───────────────────────────────────────────────────────────────────────
# Generar con: openssl rand -hex 32
JWT_SECRET_KEY=cambia_esto_por_un_secreto_real_de_64_chars
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# ── Supabase Storage ──────────────────────────────────────────────────────────
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_BUCKET=asl-files

# ── CORS ──────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:4200

# ── Rate limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_PER_MINUTE=60

# ── Admin ─────────────────────────────────────────────────────────────────────
# Generar con: openssl rand -hex 32
ADMIN_SECRET=cambia_esto_por_un_secreto_real

# ── ML ────────────────────────────────────────────────────────────────────────
MODEL_PATH=ml/models/asl_model.pkl
TASK_PATH=ml/hand_landmarker.task
VIDEO_FPS_SAMPLE=6
VIDEO_MAX_DURATION=180
```

En desarrollo (`APP_ENV=development`) el backend usa PostgreSQL local. Las variables de Supabase Storage son necesarias solo en producción. El token de Hugging Face (`HF_TOKEN`) se configura directamente en Railway como variable de entorno, no en el `.env`.

> La base de datos de tests (`asl_test`) está hardcodeada en `backend/src/tests/conftest.py` — no requiere variable de entorno.

---

## 3. Base de Datos Local

### 3.1 Levantar PostgreSQL con Docker

```bash
docker-compose up -d
```

Esto levanta únicamente PostgreSQL en `localhost:5432`. El backend corre fuera de Docker con uvicorn para un ciclo de desarrollo más rápido.

### 3.2 Crear las bases de datos

Conéctate a PostgreSQL (DBeaver, psql, o cualquier cliente) y crea las dos bases de datos:

```sql
CREATE DATABASE asl_db;
CREATE DATABASE asl_test;
```

### 3.3 Aplicar migraciones

```bash
cd backend
alembic upgrade head
```

Esto aplica todas las migraciones en orden: esquema inicial, seed de roles, status de sesión, fix de FK, y nombre de sesión.

> Las migraciones deben aplicarse manualmente a `asl_test` también. Conéctate a `asl_test` y ejecuta cada migración con asyncpg directo o via DBeaver.

---

## 4. Backend y ML

### 4.1 Crear entorno virtual e instalar dependencias

Desde la raíz del proyecto:

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # Linux/macOS
pip install -r requirements-backend.txt
pip install -r requirements-ml.txt
```

Dependencias con versiones fijadas por compatibilidad:
- `bcrypt==4.0.1` — bcrypt 5.0.0 incompatible con passlib 1.7.4
- `asyncpg==0.30.0` — versiones superiores incompatibles con Python 3.12 en Railway
- `httpx>=0.26,<0.28` — rango requerido por supabase-py

### 4.2 Arrancar el servidor

```bash
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor arranca en `http://localhost:8000`. La documentación interactiva está disponible en `http://localhost:8000/docs`.

En desarrollo el lifespan no descarga el modelo de Hugging Face — lo carga directamente desde `ml/models/asl_model.pkl`.

---

## 5. Machine Learning

### 5.1 Dataset

El dataset de Kaggle (87.000 imágenes, 29 clases) debe estar en `ml/data/raw/train/` con una subcarpeta por clase:

```
ml/data/raw/train/
├── A/
├── B/
...
└── Z/
```

Descarga: [ASL Alphabet Dataset — Kaggle](https://www.kaggle.com/datasets/grassknoted/asl-alphabet)

### 5.2 Pipeline de entrenamiento

Ejecutar en orden desde la raíz del proyecto:

```bash
# 1. Extraer landmarks de todas las imágenes con MediaPipe
python ml/scripts/extract_landmarks.py

# 2. Entrenar el modelo Random Forest
python ml/scripts/train.py

# 3. Evaluar el modelo sobre el conjunto de test
python ml/scripts/evaluate.py
```

El proceso completo tarda aproximadamente 33 minutos (extracción para 93.300 imágenes) + 10 segundos (entrenamiento).

**Salidas:**
- `ml/data/processed/landmarks_train.csv` — features de entrenamiento
- `ml/data/processed/landmarks_test.csv` — features de test
- `ml/models/asl_model.pkl` — modelo entrenado (157MB)
- `ml/data/processed/confusion_matrix.png` — matriz de confusión
- `ml/data/processed/evaluate.log` — métricas detalladas por clase

### 5.3 Reentrenamiento con datos propios

Para añadir fotos propias al dataset antes de reentrenar:

1. Coloca las fotos en `ml/data/temp/` con una subcarpeta por gesto (ej. `ml/data/temp/N/`)
2. Ejecuta el script de mezcla:

```bash
python ml/scripts/merge_custom_photos.py
```

3. Ejecuta el pipeline completo desde el paso 1.

> Haz backup del modelo y los CSVs antes de reentrenar:
> ```bash
> copy ml\models\asl_model.pkl ml\models\asl_model_backup.pkl
> copy ml\data\processed\landmarks_train.csv ml\data\processed\landmarks_train_backup.csv
> copy ml\data\processed\landmarks_test.csv ml\data\processed\landmarks_test_backup.csv
> ```

### 5.4 Hiperparámetros del modelo

| Parámetro | Valor | Motivo |
|---|---|---|
| `n_estimators` | 50 | Reducir tamaño de 622MB a 157MB para Railway (512MB RAM) |
| `max_depth` | None | Sin límite — preserva capacidad en gestos difíciles |
| `min_samples_leaf` | 1 | Máxima granularidad |
| `class_weight` | balanced | Compensar desbalance entre clases |
| `random_state` | 42 | Reproducibilidad |

El GridSearchCV original determinó que los mejores hiperparámetros son `n_estimators=200`, con accuracy CV de 97.70% y accuracy test de 98.20%. Con `n_estimators=50` la pérdida es de aproximadamente 1%.

---

## 6. Frontend

### 6.1 Instalar dependencias

```bash
cd frontend
npm install
```

### 6.2 Arrancar en desarrollo

```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200`. En desarrollo apunta al backend en `http://localhost:8000` según `src/environments/environment.development.ts`.

### 6.3 Build de producción

```bash
ng build
```

Genera los archivos estáticos en `frontend/dist/`. Netlify ejecuta este comando automáticamente en cada push a `main`.

---

## 7. Tests

### 7.1 Tests del backend

Desde la raíz del proyecto:

```bash
pytest backend/
```

64 tests. La suite usa la base de datos `asl_test` real (sin mocks de BD). Cada test trunca las tablas antes de ejecutarse via fixture `clean_db` con scope `function`.

Los tests de Storage y ML usan mocks para evitar llamadas reales a Supabase y al modelo.

### 7.2 Tests del ML

```bash
pytest ml/tests/
```

28 tests. Los fixtures de imagen están en `ml/tests/fixtures/`: `hand_A.jpg`, `hand_nothing.jpg`, `hand_two_palms.jpg`.

### 7.3 Suite completa

```bash
pytest
```

92 tests en total. Todos deben pasar antes de hacer push.

---

## 8. Despliegue

### 8.1 Backend — Railway

El backend se despliega automáticamente en Railway en cada push a `main` usando el `Dockerfile` de `backend/`.

Variables de entorno a configurar en Railway:
- Todas las variables de `.env` correspondientes al entorno de producción
- `ENVIRONMENT=production`
- `DATABASE_URL` apuntando al Connection Pooler de Supabase (puerto 6543)

> Usar `--workers 1` en el comando de arranque. Múltiples workers cargarían el modelo en memoria de forma independiente, superando los 512MB de RAM del plan Starter.

### 8.2 Frontend — Netlify

El frontend se despliega automáticamente en Netlify en cada push a `main`.

Configuración en Netlify:
- **Build command:** `ng build`
- **Publish directory:** `dist/sign-language-translator/browser`
- **Base directory:** `frontend`

### 8.3 Modelo — Hugging Face

El modelo se almacena en el repositorio privado `j-gonzdev/asl-model` en Hugging Face Hub. El backend lo descarga en el lifespan al arrancar en producción.

Para subir un nuevo modelo tras reentrenar:

1. Accede a `https://huggingface.co/j-gonzdev/asl-model`
2. Elimina el `asl_model.pkl` anterior
3. Sube el nuevo `ml/models/asl_model.pkl`

El siguiente deploy de Railway descargará automáticamente el modelo actualizado.

### 8.4 Base de datos — Supabase

Las migraciones se aplican contra Supabase usando el Connection Pooler:

```bash
cd backend
alembic upgrade head
```

Con `DATABASE_URL` apuntando a `postgresql+asyncpg://postgres:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`.

Para crear el usuario admin en producción:

```bash
curl -X POST https://sign-language-translator-production-3e38.up.railway.app/auth/register-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ejemplo.com",
    "password": "contrasena_segura",
    "nombre": "Admin",
    "apellidos": "Admin",
    "nombre_usuario": "admin",
    "admin_secret": "TU_ADMIN_SECRET"
  }'
```