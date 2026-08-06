# HelioScan: Análisis fotovoltaico y detección satelital

HelioScan es una aplicación web para evaluar la viabilidad de instalar paneles solares en techos residenciales y comerciales en México. Utiliza imágenes satelitales, datos de radiación solar de la NASA y un motor financiero compilado a WebAssembly para calcular el consumo y las tarifas de CFE.

## Funcionalidades

### Seleccionador de mapa y vista satelital
Permite seleccionar propiedades usando un mapa basado en Leaflet con la capa de Esri World Imagery. Si la imagen solicitada excede la resolución disponible en la zona, ajusta la escala automáticamente para mantener la visibilidad del techo.

### Detector de paneles solares
Analiza la captura satelital usando YOLOv8 combinado con un detector de reserva basado en OpenCV (CLAHE y análisis geométrico) para identificar si el techo ya tiene módulos solares instalados.

### Consulta de radiación solar
Obtiene la irradiancia solar GHI promedio (kWh/m²/día) directamente de la API de NASA POWER según las coordenadas del pin.

### Simulador financiero de CFE
Calcula la facturación estimada en Tarifa 01 (residencial) y Tarifa PDBT (comercial) antes y después de instalar paneles. Determina el saldo del esquema de Net Metering, el ahorro proyectado, el periodo de retorno de inversión y la mitigación de CO2.

## Stack tecnológico

- Frontend: Vite, TypeScript, Leaflet.js, Vanilla CSS
- Motor de cálculo: Rust compilado a WebAssembly con wasm-pack
- Backend: Python 3.11, FastAPI, PyTorch, Ultralytics YOLOv8, OpenCV, httpx
- Automatización: Docker, Vercel, Hugging Face Spaces, servidor MCP (deployer_mcp.py)

## Ejecución en entorno local

### Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

La aplicación quedará disponible en http://localhost:3000.

## Licencia

MIT

