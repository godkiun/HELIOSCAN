#!/usr/bin/env python3
"""
====================================================================
 ☀️ HELIOSCAN - SCRIPT DE GENERACIÓN DE DATASET Y ENTRENAMIENTO LOCAL
====================================================================
 Genera un conjunto de datos anotado en formato YOLOv8 y entrena
 el modelo neural YOLOv8n para detección de paneles solares fotovoltaicos.
====================================================================
"""

import os
import sys
import shutil
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from ultralytics import YOLO

# Rutas del entorno
BASE_DIR = Path(__file__).resolve().parent
DATASET_DIR = BASE_DIR / "dataset_paneles"
MODELOS_DIR = BASE_DIR.parent.parent.parent / "modelos"

IMG_TRAIN_DIR = DATASET_DIR / "images" / "train"
IMG_VAL_DIR = DATASET_DIR / "images" / "val"
LBL_TRAIN_DIR = DATASET_DIR / "labels" / "train"
LBL_VAL_DIR = DATASET_DIR / "labels" / "val"


def crear_estructura_directorios():
    for d in [IMG_TRAIN_DIR, IMG_VAL_DIR, LBL_TRAIN_DIR, LBL_VAL_DIR]:
        d.mkdir(parents=True, exist_ok=True)


def generar_muestra_satelital_sintetica(idx: int, es_val: bool = False):
    """
    Genera una imagen realista simulada de techo satelital con arreglos fotovoltaicos
    y su correspondiente archivo de anotaciones YOLOv8.
    """
    ancho, alto = 640, 640
    
    # 1. Fondo de terreno / techo (tonos marrón, arcilla, hormigón o teja)
    color_fondo = (
        random.randint(40, 90),
        random.randint(40, 80),
        random.randint(40, 75)
    )
    img = Image.new("RGB", (ancho, alto), color_fondo)
    draw = ImageDraw.Draw(img)

    # Textura de techo / casa
    techo_x1 = random.randint(50, 120)
    techo_y1 = random.randint(50, 120)
    techo_x2 = random.randint(500, 580)
    techo_y2 = random.randint(500, 580)

    color_techo = (random.randint(60, 110), random.randint(60, 100), random.randint(60, 95))
    draw.rectangle([techo_x1, techo_y1, techo_x2, techo_y2], fill=color_techo, outline=(30, 30, 30), width=3)

    # 2. Generar arreglos de paneles solares (silicio azul marino reflectante)
    etiquetas_yolo = []

    # Determinar si este techo tendrá paneles solares
    tiene_paneles = random.random() > 0.15 # 85% de las imágenes tienen paneles
    if tiene_paneles:
        filas = random.randint(2, 4)
        columnas = random.randint(2, 5)
        
        w_panel = random.randint(45, 75)
        h_panel = random.randint(35, 55)
        
        start_x = random.randint(techo_x1 + 30, max(techo_x1 + 35, techo_x2 - (columnas * (w_panel + 10)) - 30))
        start_y = random.randint(techo_y1 + 30, max(techo_y1 + 35, techo_y2 - (filas * (h_panel + 10)) - 30))

        for f in range(filas):
            for c in range(columnas):
                px1 = start_x + c * (w_panel + 6)
                py1 = start_y + f * (h_panel + 6)
                px2 = px1 + w_panel
                py2 = py1 + h_panel

                # Color azul monocristalino solar
                color_solar = (
                    random.randint(15, 35),
                    random.randint(45, 85),
                    random.randint(120, 180)
                )
                draw.rectangle([px1, py1, px2, py2], fill=color_solar, outline=(210, 180, 100), width=2)

                # Coordenadas relativas normales YOLO: class_id x_center y_center width height
                x_center = (px1 + px2) / 2.0 / ancho
                y_center = (py1 + py2) / 2.0 / alto
                w_rel = (px2 - px1) / float(ancho)
                h_rel = (py2 - py1) / float(alto)

                etiquetas_yolo.append(f"0 {x_center:.6f} {y_center:.6f} {w_rel:.6f} {h_rel:.6f}")

    # Guardar imagen y etiquetas
    target_img_dir = IMG_VAL_DIR if es_val else IMG_TRAIN_DIR
    target_lbl_dir = LBL_VAL_DIR if es_val else LBL_TRAIN_DIR

    nombre_base = f"sat_solar_{'val' if es_val else 'train'}_{idx:04d}"
    img_path = target_img_dir / f"{nombre_base}.jpg"
    lbl_path = target_lbl_dir / f"{nombre_base}.txt"

    img.save(img_path, quality=90)
    lbl_path.write_text("\n".join(etiquetas_yolo), encoding="utf-8")


def generar_dataset_completo(total_train: int = 120, total_val: int = 30):
    print(f"📦 Generando dataset de entrenamiento ({total_train} train, {total_val} val)...")
    crear_estructura_directorios()

    for i in range(total_train):
        generar_muestra_satelital_sintetica(i, es_val=False)

    for i in range(total_val):
        generar_muestra_satelital_sintetica(i, es_val=True)

    # Escribir dataset_paneles.yaml con ruta absoluta
    yaml_content = f"""path: {DATASET_DIR.as_posix()}
train: images/train
val: images/val

names:
  0: panel_solar
"""
    yaml_path = BASE_DIR / "dataset_paneles.yaml"
    yaml_path.write_text(yaml_content, encoding="utf-8")
    print(f"✅ Archivo de configuración generado en: {yaml_path}")
    return yaml_path


def entrenar_y_guardar_modelo(yaml_path: Path, epocas: int = 25, usar_obb: bool = False):
    print(f"\n🔥 Iniciando entrenamiento optimizado de YOLOv8{' (OBB Cenital)' if usar_obb else ''} por {epocas} épocas...")
    pesos_base = "yolov8n-obb.pt" if usar_obb else "yolov8n.pt"
    modelo = YOLO(pesos_base)

    resultados = modelo.train(
        data=str(yaml_path),
        epochs=epocas,
        imgsz=640,
        batch=16,
        project=str(BASE_DIR / "runs"),
        name="panel_detector_yolov8_cenital",
        save=True,
        verbose=True,
        # Augmentations avanzadas para vista satelital cenital
        degrees=180.0,
        fliplr=0.5,
        flipud=0.5,
        mosaic=1.0,
        mixup=0.15,
        scale=0.5,
        hsv_h=0.015,
        hsv_s=0.7,
        hsv_v=0.4,
    )

    # Copiar el mejor modelo resultante a backend/modelos/panel_detector_yolov8n.pt
    best_weights = BASE_DIR / "runs" / "panel_detector_yolov8_cenital" / "weights" / "best.pt"
    if not best_weights.exists():
        best_weights = BASE_DIR / "runs" / "panel_detector_yolov8_cenital" / "weights" / "last.pt"

    if best_weights.exists():
        MODELOS_DIR.mkdir(parents=True, exist_ok=True)
        destino_final = MODELOS_DIR / "panel_detector_yolov8n.pt"
        shutil.copy2(best_weights, destino_final)
        print(f"\n🎉 ¡Entrenamiento con Augmentations Cenitales completado exitosamente!")
        print(f"📍 Pesos del modelo guardados en: {destino_final}")
    else:
        print("\n⚠️ No se encontraron los pesos de entrenamiento en 'runs/'.")


if __name__ == "__main__":
    yaml_path = generar_dataset_completo(total_train=100, total_val=25)
    entrenar_y_guardar_modelo(yaml_path, epocas=12)

