# api_focos_de_calor

API backend pública construida con NestJS y PostgreSQL para consultar, almacenar y exponer detecciones de focos de calor en Bolivia a partir de datos de NASA FIRMS.

## 2. Descripcion breve

`api_focos_de_calor` es una API REST orientada a consulta que centraliza eventos de focos de calor y los publica mediante endpoints documentados, paginados y fáciles de integrar. El proyecto esta pensado como una pieza de portafolio backend con buenas practicas de configuracion, validacion, persistencia y documentacion.

## 3. Problema que resuelve

El consumo directo de datos satelitales de focos de calor suele implicar archivos crudos, procesos manuales, formatos poco amigables para terceros y poca estandarización para integración. Esta API resuelve ese problema al ofrecer una capa intermedia limpia y reutilizable para consultar detecciones por fecha, fuente satelital y otros criterios operativos desde un backend listo para integrarse en aplicaciones, dashboards o pipelines de analítica.

## 4. Objetivos del proyecto

- Centralizar detecciones de focos de calor en Bolivia en una base de datos PostgreSQL.
- Exponer una API REST pública con prefijo global `/api_fdc`.
- Facilitar consultas por filtros comúnes como rango de fechas, fuente, satelite, confianza mínima y paginación.
- Documentar el contrato de la API con Swagger para acelerar pruebas e integraciones.
- Incorporar un proceso de ingesta desde NASA FIRMS con deduplicación e historial de ejecuciones.
- Mostrar una arquitectura backend clara, mantenible y desplegable en Render como proyecto de portafolio.

## 5. Stack tecnologico

| Capa | Tecnologia |
| --- | --- |
| Backend | NestJS + TypeScript |
| ORM | TypeORM |
| Validación | class-validator, class-transformer |
| Base de datos | PostgreSQL |
| Hosting de BD | Neon |
| Documentación API | Swagger / OpenAPI |
| Configuración | @nestjs/config |
| Scheduler / ingesta | @nestjs/schedule |
| Deploy | Render |
| Versionado | Git + GitHub |

## 6. Arquitectura general

La solución sigue una arquitectura backend modular sobre NestJS:

- `HealthModule` para verificación básica del servicio.
- `DetectionsModule` para consulta de detecciones, detalle por ID y resumen agregado.
- `FirmsModule` para ingesta desde NASA FIRMS, deduplicación y registro de corridas.
- `DatabaseModule` para la integración con PostgreSQL mediante TypeORM.
- `AppConfigModule` para validación centralizada de variables de entorno.

El prefijo global de la API esta definido como `api_fdc` y Swagger se monta en `api_fdc/docs`.

## 7. Estructura breve del proyecto

```text
api_focos_de_calor/
├── src/
│   ├── common/
│   ├── config/
│   ├── database/
│   │   └── migrations/
│   ├── detections/
│   ├── firms/
│   ├── health/
│   ├── modis_details/
│   ├── viirs_details/
│   ├── app.module.ts
│   └── main.ts
├── test/
├── docker-compose.yml
├── package.json
├── .env.template
├── LICENSE
└── README.md
```

## 8. Requisitos previos

Antes de ejecutar el proyecto localmente, asegúrate de contar con lo siguiente:

- Node.js 20+ recomendado
- Yarn 1.x o compatible
- PostgreSQL 16+ o una base de datos remota en Neon
- Una API key valida de NASA FIRMS
- Git

Opcionalmente, puedes levantar PostgreSQL local con Docker Compose.

## 9. Instalacion local paso a paso

### 9.1 Clonar el repositorio

```bash
git clone https://github.com/[TU_USUARIO]/api_focos_de_calor.git
cd api_focos_de_calor
```

### 9.2 Instalar dependencias

```bash
yarn install
```

### 9.3 Crear el archivo de entorno

```bash
cp .env.template .env
```

### 9.4 Configurar la base de datos

Puedes usar una conexion remota en Neon con `DATABASE_URL` o una instancia local de PostgreSQL.

Si deseas levantar PostgreSQL local con Docker:

```bash
docker compose up -d db
```

### 9.5 Ejecutar migraciones

```bash
yarn migration:run
```

### 9.6 Iniciar la API en desarrollo

```bash
yarn start:dev
```

## 10. Configuracion de variables de entorno

La aplicación valida variables de entorno al iniciar. Algunas son obligatorias para la ejecucion actual y otras son recomendadas para endurecer el despliegue o documentar el entorno.

| Variable | Requerida | Ejemplo | Descripción |
| --- | --- | --- | --- |
| `PORT` | Si | `3000` | Puerto HTTP de la API. |
| `NODE_ENV` | Si | `development` | Entorno de ejecución: `development`, `test` o `production`. |
| `TZ` | Si | `America/La_Paz` | Zona horaria usada por la aplicación y procesos asociados. |
| `API_PREFIX` | Referencial | `api_fdc` | Prefijo global esperado para la API. En la implementación actual esta definido como constante. |
| `SWAGGER_PATH` | Referencial | `api_fdc/docs` | Ruta esperada de Swagger. En la implementación actual esta definida como constante. |
| `CORS_ORIGIN` | Recomendada | `https://tu-frontend.app` | Variable sugerida para endurecer CORS en una evolucion futura. El MVP actual permite `origin: true`. |
| `RENDER_EXTERNAL_URL` | Recomendada | `https://api-focos-de-calor.onrender.com` | URL pública usada como referencia documental o integración con el despliegue. |
| `FIRMS_MAP_KEY` | Si | `tu_api_key` | API key oficial de NASA FIRMS. |
| `FIRMS_BASE_URL` | No | `https://firms.modaps.eosdis.nasa.gov/api/area/csv` | Endpoint base para consultar datos CSV de FIRMS. |
| `FIRMS_BBOX` | No | `-69.8,-22.9,-57.4,-9.6` | Bounding box usado para Bolivia. |
| `FIRMS_ENABLED_SOURCES` | No | `VIIRS_SNPP_NRT,VIIRS_NOAA20_NRT,VIIRS_NOAA21_NRT,MODIS_NRT` | Fuentes habilitadas para la ingesta. |
| `FIRMS_INITIAL_SYNC_START_DATE` | No | `2026-01-01` | Fecha inicial para la sincronización histórica del primer arranque. |
| `FIRMS_LOOKBACK_DAYS` | No | `4` | Ventana de días para sincronizaciones incrementales. |
| `FIRMS_SYNC_EVERY_MINUTES` | No | `5` | Frecuencia del scheduler de ingesta. |
| `FIRMS_RUN_ON_BOOT` | No | `true` | Ejecuta una sincronización automática al iniciar la API. |
| `FIRMS_REQUEST_TIMEOUT_MS` | No | `15000` | Timeout de peticiones hacia NASA FIRMS. |
| `DATABASE_URL` | Condicional | `postgresql://user:pass@host/db?sslmode=require` | Conexión completa. Si existe, la app ignora `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` y `DB_NAME`. |
| `DB_HOST` | Condicional | `localhost` | Host de PostgreSQL cuando no se usa `DATABASE_URL`. |
| `DB_PORT` | Condicional | `5432` | Puerto de PostgreSQL. |
| `DB_USERNAME` | Condicional | `api_user` | Usuario de base de datos. |
| `DB_PASSWORD` | Condicional | `api_password` | Contraseña de base de datos. |
| `DB_NAME` | Condicional | `api_db` | Nombre de la base de datos. |
| `DB_SSL` | No | `false` | Habilita SSL para PostgreSQL. Util para Neon y despliegues productivos. |
| `DB_SYNCHRONIZE` | No | `false` | Debe permanecer en `false` cuando se usan migraciones. |
| `DB_LOGGING` | No | `false` | Activa logs SQL de TypeORM. |

## 11. Ejemplo de archivo `.env.template`

```env
# Aplicacion
PORT=3000
NODE_ENV=development
TZ=America/La_Paz

# Variables documentales / recomendadas
API_PREFIX=api_fdc
SWAGGER_PATH=api_fdc/docs
CORS_ORIGIN=http://localhost:3000
RENDER_EXTERNAL_URL=https://[TU_APP].onrender.com

# NASA FIRMS
FIRMS_MAP_KEY=
FIRMS_BASE_URL=https://firms.modaps.eosdis.nasa.gov/api/area/csv
FIRMS_BBOX=-69.8,-22.9,-57.4,-9.6
FIRMS_ENABLED_SOURCES=VIIRS_SNPP_NRT,VIIRS_NOAA20_NRT,VIIRS_NOAA21_NRT,MODIS_NRT
FIRMS_INITIAL_SYNC_START_DATE=2026-01-01
FIRMS_LOOKBACK_DAYS=4
FIRMS_SYNC_EVERY_MINUTES=5
FIRMS_RUN_ON_BOOT=true
FIRMS_REQUEST_TIMEOUT_MS=15000

# Base de datos
DATABASE_URL=
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=api_user
DB_PASSWORD=api_password
DB_NAME=api_db
DB_SSL=false
DB_SYNCHRONIZE=false
DB_LOGGING=false
```

## 12. Migraciones

El proyecto usa TypeORM con `src/database/data-source.ts` como datasource para ejecutar migraciones.

### Comandos utiles

```bash
yarn migration:show
yarn migration:run
yarn migration:revert
```

Para crear o generar nuevas migraciones:

```bash
yarn typeorm migration:create src/database/migrations/NombreMigracion
yarn typeorm migration:generate src/database/migrations/NombreMigracion
```

### Migraciones actuales

| Archivo | Descripción |
| --- | --- |
| `20260316110100-CreateDetectionsTable` | Crea la tabla principal de detecciones. |
| `20260316110200-CreateViirsDetailsTable` | Crea detalles específicos para registros VIIRS. |
| `20260316110300-CreateModisDetailsTable` | Crea detalles específicos para registros MODIS. |
| `20260316120000-AddDetectionDedupeKeyAndIngestionRuns` | Agrega deduplicación y tabla de corridas de ingesta. |

## 13. Seed o carga de datos demo

El MVP no expone todavía un comando dedicado tipo `yarn seed`. En su lugar, la carga inicial y la sincronizacion incremental se realizan desde el modulo `firms`, que consulta NASA FIRMS y persiste resultados en PostgreSQL.

### Flujo actual de carga inicial

1. Configura `FIRMS_MAP_KEY`.
2. Define `FIRMS_INITIAL_SYNC_START_DATE`.
3. Asegura que la tabla `detections` este vacía si quieres forzar la primera sincronización histórica.
4. Inicia la API con `FIRMS_RUN_ON_BOOT=true`.

```bash
yarn start:dev
```

Si no existen detecciones y no hubo una corrida `BOOT` exitosa previa, la API ejecuta una carga histórica inicial. Luego, continua con sincronizaciones incrementales usando el scheduler.

## 14. Ejecucion del proyecto en desarrollo

```bash
yarn start:dev
```

Comandos adicionales utiles:

```bash
yarn start
yarn start:debug
yarn test
yarn test:e2e
yarn lint
```

## 15. Ejecucion en produccion

```bash
yarn build
yarn start:prod
```

En un despliegue en Render, la secuencia habitual es:

```bash
yarn install --frozen-lockfile
yarn build
yarn migration:run
yarn start:prod
```

## 16. Documentacion Swagger

La documentación interactiva esta disponible en la ruta:

```text
/api_fdc/docs
```

Ejemplos:

- Local: `http://localhost:3000/api_fdc/docs`
- Publico: `https://[TU_APP].onrender.com/api_fdc/docs`

## 17. URL publica del proyecto

Reemplaza estos placeholders por tus URLs reales:

| Recurso | URL |
| --- | --- |
| API pública | `https://[TU_APP].onrender.com/api_fdc` |
| Swagger | `https://[TU_APP].onrender.com/api_fdc/docs` |
| Repositorio | `https://github.com/[TU_USUARIO]/api_focos_de_calor` |

## 18. Endpoints principales

| Metodo | Endpoint | Descripción |
| --- | --- | --- |
| `GET` | `/api_fdc/health` | Verifica el estado del servicio. |
| `GET` | `/api_fdc/detections` | Lista detecciones con filtros y paginación. |
| `GET` | `/api_fdc/detections/:id` | Obtiene el detalle de una deteccion por UUID. |
| `GET` | `/api_fdc/detections/stats/summary` | Devuelve un resumen agregado del dataset. |

## 19. Parametros de filtrado disponibles

Los filtros principales estan disponibles en `GET /api_fdc/detections`.

| Parametro | Tipo | Ejemplo | Estado | Descripción |
| --- | --- | --- | --- | --- |
| `date_from` | `string` | `2026-03-01` | Activo | Fecha inicial inclusive en formato `YYYY-MM-DD`. |
| `date_to` | `string` | `2026-03-16` | Activo | Fecha final inclusive en formato `YYYY-MM-DD`. |
| `source` | `string` | `VIIRS` | Activo | Fuente del dato. Valores válidos: `VIIRS`, `MODIS`. |
| `satellite` | `string` | `NOAA-20` | Activo | Filtra por satelite reportado. |
| `min_confidence` | `number` | `70` | Activo | Filtra por confianza mínima numérica. |
| `page` | `number` | `1` | Activo | Número de pagina. |
| `limit` | `number` | `20` | Activo | Tamaño de pagina, máximo `100`. |
| `department` | `string` | `Santa Cruz` | Reservado | Aún no soportado por el schema actual. Si se usa, la API responde `400`. |
| `municipality` | `string` | `San Ignacio de Velasco` | Reservado | Aún no soportado por el schema actual. Si se usa, la API responde `400`. |

## 20. Ejemplos de requests y responses reales o realistas

### 20.1 Health check

```http
GET /api_fdc/health
```

```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "ok"
  }
}
```

### 20.2 Listado de detecciones con filtros

```http
GET /api_fdc/detections?date_from=2026-03-10&date_to=2026-03-16&source=VIIRS&min_confidence=70&page=1&limit=2
```

```json
{
  "success": true,
  "message": "Detections retrieved successfully",
  "data": [
    {
      "id": "0f7d0e6a-d4d2-4d70-96ab-c04c3a5807d1",
      "source": "VIIRS",
      "latitude": -16.489125,
      "longitude": -68.119293,
      "scan": 1.023,
      "track": 1.157,
      "acqDate": "2026-03-16",
      "acqTime": 1435,
      "satellite": "NOAA-20",
      "instrument": "VIIRS",
      "confidence": "85",
      "version": "2.0NRT",
      "frp": 15.2,
      "daynight": "D",
      "createdAt": "2026-03-16T15:42:11.310Z",
      "updatedAt": "2026-03-16T15:42:11.310Z"
    },
    {
      "id": "f4035471-14a7-4950-99ca-8d376fbdb178",
      "source": "VIIRS",
      "latitude": -17.783327,
      "longitude": -63.182140,
      "scan": 0.911,
      "track": 1.044,
      "acqDate": "2026-03-15",
      "acqTime": 1810,
      "satellite": "NOAA-21",
      "instrument": "VIIRS",
      "confidence": "91",
      "version": "2.0NRT",
      "frp": 22.8,
      "daynight": "D",
      "createdAt": "2026-03-16T15:43:28.106Z",
      "updatedAt": "2026-03-16T15:43:28.106Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 2,
    "total": 47,
    "totalPages": 24
  }
}
```

### 20.3 Obtener una deteccion por ID

```http
GET /api_fdc/detections/0f7d0e6a-d4d2-4d70-96ab-c04c3a5807d1
```

```json
{
  "success": true,
  "message": "Detection retrieved successfully",
  "data": {
    "id": "0f7d0e6a-d4d2-4d70-96ab-c04c3a5807d1",
    "source": "VIIRS",
    "latitude": -16.489125,
    "longitude": -68.119293,
    "scan": 1.023,
    "track": 1.157,
    "acqDate": "2026-03-16",
    "acqTime": 1435,
    "satellite": "NOAA-20",
    "instrument": "VIIRS",
    "confidence": "85",
    "version": "2.0NRT",
    "frp": 15.2,
    "daynight": "D",
    "createdAt": "2026-03-16T15:42:11.310Z",
    "updatedAt": "2026-03-16T15:42:11.310Z"
  }
}
```

### 20.4 Resumen agregado

```http
GET /api_fdc/detections/stats/summary
```

```json
{
  "success": true,
  "message": "Detection summary retrieved successfully",
  "data": {
    "totalDetections": 154,
    "totalsBySource": [
      {
        "source": "VIIRS",
        "total": 120
      },
      {
        "source": "MODIS",
        "total": 34
      }
    ],
    "averageConfidence": 79.42,
    "numericConfidenceCount": 142
  }
}
```

### 20.5 Nota sobre filtros reservados

Aunque `department` y `municipality` aparecen en el contrato como filtros previstos, el servicio actual aún no cuenta con una capa de enriquecimiento administrativo. Por eso, cualquier request que use esos parametros respondera con `400 Bad Request` hasta que esa funcionalidad sea implementada.

## 21. Diagrama simple de arquitectura en Mermaid

```mermaid
flowchart LR
    A["Cliente / Consumer App"] --> B["Swagger UI"]
    A --> C["API NestJS (/api_fdc)"]
    B --> C
    C --> D[("PostgreSQL / Neon")]
    C --> E["NASA FIRMS"]
```

## 22. Casos de uso del proyecto

- Integrar detecciones de focos de calor en un dashboard web o móvil.
- Alimentar visualizaciones geoespaciales con datos consultables por fecha y fuente.
- Consumir una API backend más amigable que el formato crudo de NASA FIRMS.
- Exponer un servicio de consulta para prototipos de monitoreo ambiental.
- Servir como base para un futuro sistema con alertas, mapas y analítica.

## 23. Futuras mejoras

- Ingesta automática mas robusta con retries, backoff y observabilidad.
- Enriquecimiento geográfico para habilitar filtros por departamento y municipio.
- Cache para consultas frecuentes y endpoints de alto tráfico.
- Autenticación y autorización para endpoints internos o administrativos.
- Contenerización completa con Docker y Docker Compose para API + BD.
- Suite de tests unitarios, e2e y pruebas de contrato.
- Métricas, logs estructurados y monitoreo con herramientas observables.
- Filtros geoespaciales avanzados por bounding box, radio o geometrías.
- Endpoint de exportacion CSV/JSON para integraciones batch.
- Dashboard frontend para exploración visual del dataset.

## 24. Autor / portafolio

Completa esta seccion con tus enlaces reales:

- Autor: `diego fariñas`


## 25. Licencia opcional

Este proyecto se distribuye bajo licencia MIT. Asegurate de completar el nombre del titular en el archivo `LICENSE` antes de publicarlo.
