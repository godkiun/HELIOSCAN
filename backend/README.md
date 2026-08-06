---
title: HelioScan Backend API
emoji: ☀️
colorFrom: yellow
colorTo: orange
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: Servicio API en FastAPI para detección de paneles solares y consulta de datos climatológicos de la NASA.
---

# HelioScan Backend API

Servicio de backend para la aplicación HelioScan. Procesa inferencias de visión por computadora y realiza consultas a la API de NASA POWER.

## Endpoints

- `POST /api/v1/detect-panels`: Recibe una imagen del techo y retorna la ubicación de los paneles solares detectados.
- `GET /api/v1/roof-satellite-image`: Genera la captura satelital centrada en las coordenadas de la propiedad.
- `GET /api/v1/nasa-data`: Retorna los valores de irradiancia solar GHI para la ubicación especificada.

