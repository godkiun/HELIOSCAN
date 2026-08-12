# ☀️ HelioScan — Sistema de Análisis Solar Satelital, IA y Tarifario CFE

**HelioScan** es una plataforma web interactiva diseñada para evaluar la viabilidad técnica, ambiental y financiera de instalaciones solares fotovoltaicas en techos residenciales y comerciales en México. Integra mapas satelitales en alta resolución, redes neuronales (YOLOv8), la API climatológica NASA POWER y un motor tarifario CFE (Net Metering, Tarifas 01/PDBT/1A-1F) compilado en TypeScript nativo con soporte WebAssembly (Wasm).

---

## ⚡ Características Principales

* 🛰️ **Detección Satelital Inteligente (YOLOv8 + CLAHE)**: Identifica paneles fotovoltaicos previamente instalados en el techo para ajustar la inversión neta y evitar sobrecostos.
* 🗺️ **Plano Esquemático Vectorial HUD**: Visualización interactiva sobre capas satelitales Esri World Imagery con fallback dinámico de zoom en zonas con baja resolución.
* 📊 **Motor Tarifario CFE 2025 (Net Metering)**:
  * Autodetección de zonas tarifarias de verano (**Tarifas 1, 1A, 1B, 1C, 1D, 1E y 1F**).
  * Tarifas comerciales PDBT y detección de riesgo de **Tarifa DAC** (Doméstica de Alto Consumo).
  * Balance bimestral/mensual de excedentes solares importados y exportados a la red CFE.
* 📈 **Proyección Financiera a 25 Años**:
  * Simulación de retornos de inversión (ROI), Valor Presente Neto (VPN a tasa de descuento del 8%) y Tasa Interna de Retorno (TIR).
  * Ajuste por degradación de paneles (0.5%/año) e inflación energética CFE.
  * Coeficiente de pérdidas térmicas y Performance Ratio (PR) estimado.
* 🔋 **Simulador de Almacenamiento LiFePO4**: Dimensionamiento automático de bancos de baterías de litio para respaldo durante apagones CFE y cálculo de horas de autonomía.
* 📄 **Reporte PDF Ejecutivo Instantáneo**: Exportación a un clic de dictámenes técnicos e informes de ahorro con paleta de impresión profesional (`jsPDF`).
* 💬 **Cotización Directa vía WhatsApp**: Generación de mensajes formateados para envío instantáneo a instaladores solares certificados.
* 📱 **Soporte PWA (Progressive Web App)**: Instalable como aplicación móvil y de escritorio con funcionamiento sin conexión mediante Service Workers.

---

## 🏗️ Arquitectura y Stack Tecnológico

### Frontend
* **Core & UI**: TypeScript, HTML5, Vanilla CSS (Diseño HUD Industrial Cyberpunk).
* **Mapas Interactivos**: Leaflet.js + Esri World Imagery (ArcGIS Tile Services).
* **Motor Matemático/Financiero**: TypeScript unificado con integración a módulos WebAssembly (Wasm).
* **Reportes y Gráficos**: `jsPDF` + Canvas 2D Vector Rendering.
* **Build Tooling**: Vite 5 + TypeScript `noEmit`.

### Backend
* **API Framework**: Python 3.11 + FastAPI + `uvicorn`.
* **Visión por Computadora**: PyTorch / Ultralytics YOLOv8n + OpenCV (Filtro CLAHE espectral).
* **Conector Climatológico**: NASA POWER API v2 (Irradiancia solar GHI en kWh/m²/día por coordenadas GPS).
* **Contenedorización**: Docker (Optimizado para Hugging Face Spaces / Port 7860).

### Automatización & Deploy
* **Servidor MCP**: Integración con Model Context Protocol (`mcp_tools/deployer_mcp.py`) para automatización de comandos CLI (`gh`, `vercel`, `huggingface-cli`).

---

## 📁 Estructura del Proyecto

```text
helioscan/
├── backend/                       # API Backend (Python / FastAPI)
│   ├── app/
│   │   ├── features/
│   │   │   └── vision_detector/   # Scripts de entrenamiento y dataset YOLOv8
│   │   ├── modelos/               # Directorio de pesos (.pt) del modelo entrenado
│   │   └── main.py                # Endpoints REST (NASA POWER, Inferencia YOLOv8)
│   ├── Dockerfile                 # Contenedor para Hugging Face Spaces
│   └── requirements.txt
├── frontend/                      # Aplicación Cliente Web (Vite + TS)
│   ├── public/                    # PWA Service Worker (sw.js) y manifest.json
│   ├── src/
│   │   ├── core/                  # NASA API Client, fallback de tiles y PDF Generator
│   │   │   ├── cliente_api.ts
│   │   │   └── generador_pdf.ts
│   │   ├── features/
│   │   │   ├── battery/           # Simulador de baterías LiFePO4
│   │   │   ├── dashboard/         # Tablero comparativo Antes vs Después
│   │   │   ├── map/               # Mapa interactivo Leaflet
│   │   │   ├── solar-calculator/  # Motor tarifario CFE, Wasm y tipos
│   │   │   └── vision/            # Canvas vectorizador de paneles en techo
│   │   ├── index.css
│   │   ├── main.ts
│   │   └── vite-env.d.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json                # Configuración de hosting Vercel
│   └── vite.config.ts
├── mcp_tools/                     # Servidor MCP local en Python
│   └── deployer_mcp.py
├── BITACORA.md                    # Historial de hitos y desarrollo
└── PLANEACION_HELIOSCAN.md        # Documento de arquitectura técnica inicial
```

---

## 🚀 Guía de Ejecución Local

### Prerrequisitos
- **Node.js** (v18+ recomendado)
- **Python** (v3.10+ recomendado)

### 1. Iniciar Frontend (WebApp Vite)
```bash
cd frontend
npm install
npm run dev
```
Accede en tu navegador a: `http://localhost:3000` (o el puerto indicado por Vite).

Para verificar la compilación de producción:
```bash
npm run build
```

### 2. Iniciar Backend (FastAPI API)
```bash
cd backend
python -m venv venv
# En Windows:
venv\Scripts\activate
# En Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Accede a la documentación interactiva Swagger en: `http://127.0.0.1:8000/docs`

---

## 🌐 Despliegue en Producción

- **Frontend**: Hospedado en Vercel con reglas de redirección para API SPA (`vercel.json`).
- **Backend**: Desplegado mediante Dockerfile en **Hugging Face Spaces** (Port 7860).

---

## 📜 Licencia

Desarrollado como proyecto open source de impacto energético y tecnológico en México.
