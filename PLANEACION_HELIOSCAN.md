
# ☀️ HelioScan — Sistema de Análisis Fotovoltaico e Inteligencia Satelital

**HelioScan** es una aplicación web e interactiva diseñada para evaluar la viabilidad de instalación de sistemas solares fotovoltaicos en techos residenciales y comerciales mediante análisis de imágenes satelitales, inteligencia artificial y simulación financiera/tarifaria.

---

## 🛑 PROBLEMA

En México (y diversas regiones de Latinoamérica), la transición hacia la energía solar fotovoltaica enfrenta importantes barreras para el usuario final:

1. **Falta de certeza técnica inicial:** La mayoría de los usuarios desconoce si su techo cuenta con el área, orientación e irradiancia solar suficientes para justificar la inversión en paneles solares.
2. **Complejidad financiera y regulatoria:** Entender el impacto real en el recibo de CFE, el retorno de inversión (ROI) y las modalidades de interconexión en Generación Distribuida (*Net Metering*, *Net Billing*, Venta Total) resulta confuso para el consumidor promedio.
3. **Fricción en la prospección para instaladores:** Las empresas solaristas invierten tiempo y recursos en levantamientos físicos o visitas técnicas sin saber previamente si la propiedad es apta o si ya cuenta con una instalación solar existente.

---

## 🛠️ STACK TECNOLÓGICO (100% Capa Gratuita)

### Frontend

* **UI & Core:** WebApp modular (HTML5 / TypeScript).
* **Mapas & Capas Satelitales:** Leaflet.js + Esri World Imagery (ArcGIS Tile Services).
* **Motor Financiero/Matemático:** WebAssembly (Wasm) compilado desde Rust para ejecución instantánea en el cliente.
* **Hosting:** Vercel (Free Tier).

### Backend

* **API Framework:** Python (FastAPI).
* **Visión por Computadora / IA:** PyTorch / Ultralytics (YOLOv8 para detección de paneles en imágenes satelitales).
* **Conector Meteorológico:** NASA POWER API (Obtención de datos de irradiancia solar GHI en kWh/m²/día).
* **Hosting de IA:** Hugging Face Spaces (Docker/FastAPI Container gratuito).

### Automatización & Deploy

* **Control de Versiones:** Git & GitHub (`gh` CLI).
* **Automatización local:** MCP (Model Context Protocol) Server personalizado en Python para el agente Antigravity en VS Code.

---

## 💻 LENGUAJES DE PROGRAMACIÓN

* **Python:** Para la infraestructura del Backend, canalización de APIs de datos climatológicos, inferencia del modelo de Visión por Computadora (YOLOv8) y el Servidor MCP local.
* **Rust:** Para el desarrollo del motor de cálculo financiero y tarifario de CFE, compilado a **WebAssembly (`wasm-bindgen`)** para máximo rendimiento y cero latencia en el cliente.
* **TypeScript / JavaScript:** Para la lógica del Frontend, eventos del mapa interactivo e integración de los módulos Wasm y APIs REST.
* **CSS / HTML5:** Para la interfaz visual adaptativa estilo industrial.

---

## 🚀 FASES DE DESARROLLO

```text
[Fase 1: Motor Rust/Wasm] ➔ [Fase 2: Backend Python/NASA] ➔ [Fase 3: IA YOLOv8] ➔ [Fase 4: Frontend Leaflet] ➔ [Fase 5: MCP & Deploy]
```

### ⚙️ Fase 1: Motor Financiero CFE en Rust (`wasm-pack`)

* Implementación de la lógica de tarifas CFE (Tarifa 01, PDBT) y cálculo de excedentes.
* Funciones de retorno de inversión (ROI), mitigación de CO2 y paneles sugeridos.
* Compilación a WebAssembly (`wasm-bindgen`) para integración directa en el navegador.

### 🐍 Fase 2: Backend Base y Conector NASA POWER (Python)

* Creación de la estructura del Backend en FastAPI organizada por features.
* Cliente asíncrono con `httpx` para consultar la API de NASA POWER por coordenadas GPS (kWh/m²/día).

### 🧠 Fase 3: Visión por Computadora e Inferencia (YOLOv8)

* Definición de dataset de imágenes satelitales de paneles solares.
* Entrenamiento del modelo `yolov8n` en Google Colab.
* Endpoint `POST /api/v1/detect-panels` en FastAPI para procesar imágenes del techo y retornar detecciones.

### 🗺️ Fase 4: Frontend y Mapa Interactivo

* Montaje del visualizador con Leaflet.js y capas de Esri World Imagery.
* Captura de coordenadas GPS mediante interacción con el mapa.
* Conexión entre la radiación solar (API Python), el cálculo en tiempo real (Wasm Rust) y el dashboard "Antes vs. Después".

### 🤖 Fase 5: Servidor MCP y Despliegue Automatizado

* Configuración del servidor MCP local en VS Code (`helioscan-deployer`).
* Integración de comandos automáticos para crear repositorios en GitHub (`gh`), desplegar Frontend a Vercel (`vercel`) y Backend a Hugging Face Spaces (`huggingface-cli`).

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Estructura del Proyecto (Organizada por Tipos y Features)

```text
helioscan/
├── mcp_tools/                     # Servidor MCP para automatización en VS Code
│   ├── deployer_mcp.py
│   └── requirements.txt
├── frontend/                      # Aplicación Cliente (UI + Wasm)
│   ├── public/
│   └── src/
│       ├── core/                  # HTTP Clients, configuración global
│       └── features/
│           ├── map/               # Visualizador Leaflet + Esri World Imagery
│           ├── solar-calculator/  # Módulo CFE + Motor Rust/Wasm empaquetado
│           │   ├── rust_engine/   # Código fuente en Rust (Cargo.toml, src/lib.rs)
│           │   └── pkg/           # Archivos compilados a WebAssembly (.wasm / .js)
│           └── installers/        # Directorio de proveedores e instaladores locales
└── backend/                       # Servicio API (Python / FastAPI)
    ├── app/
    │   ├── core/                  # Configuración de app, CORS, variables de entorno
    │   └── features/
    │       ├── nasa_power/        # Cliente y endpoints para NASA POWER API
    │       └── vision_detector/   # Inferencia de IA (YOLOv8) para detección de paneles
    ├── Dockerfile
    └── requirements.txt
```

### Flujo de Datos del Sistema

```text
[ CLIENTE / NAVEGADOR (Vercel) ]
  │
  ├── 1. Selección de Techo / Casa ─────────► [ Leaflet.js + Esri Satélite ]
  │                                                      │
  ├── 2. GET /api/v1/nasa-data?lat=...&lon=... ──────────┼──────────► [ BACKEND / Python (Hugging Face) ]
  │                                                      │                   │
  ├── 3. POST /api/v1/detect-panels ─────────────────────┼───────────────────┼──► [ NASA POWER API ]
  │                                                      │                   │
  └── 4. Ejecución de Cálculo Instantáneo                ▼                   └──► [ Modelo YOLOv8 (PyTorch) ]
        └─► [ Motor Financiero CFE en Rust / Wasm ] ──► [ Dashboard "Antes y Después" ]
```
