# ==============================================================================
# ☀️ HELIOSCAN - SCRIPT DE ENTRENAMIENTO YOLOV8 EN GOOGLE COLAB
# ==============================================================================
# Este script automatiza la descarga de un dataset de paneles solares satelitales
# desde Roboflow Universe y entrena el modelo YOLOv8n durante 50 épocas.
# 
# Instrucciones de uso en Google Colab:
# 1. Abre https://colab.research.google.com/
# 2. Asegúrate de cambiar el entorno a GPU (Entorno de ejecución -> Cambiar tipo -> GPU T4)
# 3. Copia y ejecuta las celdas de este script.
# ==============================================================================

import os

# --- CELDA 1: Instalación de dependencias principales ---
# !pip install -q ultralytics roboflow

# --- CELDA 2: Descarga del dataset de paneles solares desde Roboflow ---
def descargar_dataset_roboflow(api_key: str = "PROPORCIONAR_SI_APLICA"):
    """
    Descarga el dataset público de paneles solares satelitales en formato YOLOv8.
    Si no cuentas con API Key de Roboflow, puedes usar datasets públicos en formato YOLO.
    """
    try:
        from roboflow import Roboflow
        rf = Roboflow(api_key=api_key)
        proyecto = rf.workspace("solar-panel-detection").project("solar-panels-satellite")
        dataset = proyecto.version(1).download("yolov8")
        return dataset.location + "/data.yaml"
    except Exception as e:
        print(f"Nota: Roboflow API Key requerida o descargar manualmente. Error: {e}")
        return "dataset_paneles.yaml"


# --- CELDA 3: Entrenamiento del Modelo YOLOv8 ---
def entrenar_helioscan_yolov8(ruta_yaml_data: str = "data.yaml", epocas: int = 50):
    from ultralytics import YOLO

    print("🚀 Cargando pesos base de YOLOv8n...")
    modelo = YOLO("yolov8n.pt")

    print(f"🔥 Iniciando entrenamiento por {epocas} épocas...")
    resultados = modelo.train(
        data=ruta_yaml_data,
        epochs=epocas,
        imgsz=640,
        batch=16,
        project="helioscan_models",
        name="solar_panel_detector",
        save=True,
        plots=True,
    )

    print("✅ Entrenamiento finalizado exitosamente.")
    print("📍 Pesos finales guardados en: helioscan_models/solar_panel_detector/weights/best.pt")
    return "helioscan_models/solar_panel_detector/weights/best.pt"


if __name__ == "__main__":
    print("☀️ HelioScan YOLOv8 Training Script")

