import "./index.css";
import { obtenerDatosNasa, detectarPanelesSolares, DeteccionPanelesRespuesta } from "./core/cliente_api";
import { VisorMapaHelioScan } from "./features/map/visor_mapa";
import { ComponenteDetectorPaneles } from "./features/vision/detector_paneles_ui";
import { TableroResultados } from "./features/dashboard/tablero_resultados";
import {
  inicializarMotorSolar,
  calcularTarifa01,
  calcularPdbt,
  calcularExcedentes,
  sugerirPaneles,
  calcularRoiAnios,
  calcularMitigacionCo2Kg,
} from "./features/solar-calculator/cliente_wasm";
import { TipoTarifaCfe, ResultadoAnalisisSolar } from "./features/solar-calculator/tipos";

class AplicacionHelioScan {
  private visorMapa: VisorMapaHelioScan;
  private detectorPaneles: ComponenteDetectorPaneles;
  private tableroResultados: TableroResultados;

  private irradianciaActualGhi: number = 5.8;
  private deteccionActual: DeteccionPanelesRespuesta | null = null;

  constructor() {
    this.visorMapa = new VisorMapaHelioScan();
    this.detectorPaneles = new ComponenteDetectorPaneles();
    this.tableroResultados = new TableroResultados();
  }

  public async iniciar(): Promise<void> {
    console.log("☀️ Iniciando HelioScan App - Fase 4...");

    // 1. Inicializar motor Rust compilado a WebAssembly
    try {
      await inicializarMotorSolar();
      console.log("✅ Motor Rust / Wasm inicializado correctamente.");
    } catch (err) {
      console.error("Error al cargar módulo Wasm:", err);
    }

    // 2. Inicializar Mapa Interactivo con Leaflet + Esri World Imagery
    this.visorMapa.inicializar("mapa-satelital", (ubicacion) => {
      this.alCambiarUbicacion(ubicacion.lat, ubicacion.lng);
    });

    // 3. Inicializar Componente de Detección de Visión Canvas
    this.detectorPaneles.inicializar("lienzo-vision");
    await this.cargarImagenPredeterminada();

    // 4. Inicializar Tablero de Resultados Dashboard
    this.tableroResultados.inicializar("contenedor-dashboard");

    // 5. Configurar escuchadores de eventos UI
    this.configurarEventosUI();

    // 6. Cargar datos solares de ubicación por defecto (Hermosillo)
    const posInicial = this.visorMapa.obtenerUbicacion();
    await this.alCambiarUbicacion(posInicial.lat, posInicial.lng);

    // 7. Ejecutar simulación inicial
    this.ejecutarSimulacionCompleta();
  }

  private async alCambiarUbicacion(lat: number, lng: number): Promise<void> {
    const elLat = document.getElementById("val-lat");
    const elLng = document.getElementById("val-lng");
    const elIrr = document.getElementById("val-irradiancia");

    if (elLat) elLat.textContent = lat.toFixed(5);
    if (elLng) elLng.textContent = lng.toFixed(5);

    if (elIrr) elIrr.textContent = "Consultando NASA POWER...";

    // Consultar datos de irradiancia solar de la NASA
    const datosNasa = await obtenerDatosNasa(lat, lng);
    this.irradianciaActualGhi = datosNasa.promedioDiarioKwhM2;

    if (elIrr) {
      elIrr.textContent = `${this.irradianciaActualGhi.toFixed(2)} kWh/m²/día (${datosNasa.fuente})`;
    }

    // Recalcular simulación si el usuario cambia de ubicación
    this.ejecutarSimulacionCompleta();
  }

  private async cargarImagenPredeterminada(): Promise<void> {
    // Generar imagen satelital de muestra estilizada en Canvas
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = 640;
    canvasTemp.height = 480;
    const ctx = canvasTemp.getContext("2d");

    if (ctx) {
      // Fondo satelital oscuro
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 640, 480);

      // Dibujar techo residencial
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(100, 100);
      ctx.lineTo(540, 100);
      ctx.lineTo(540, 380);
      ctx.lineTo(100, 380);
      ctx.closePath();
      ctx.fill();

      // Paneles solares dibujados en techo
      ctx.fillStyle = "#1e3a8a";
      ctx.strokeStyle = "#93c5fd";
      ctx.lineWidth = 2;

      // 6 Paneles solares de muestra
      const filas = 2;
      const cols = 3;
      for (let f = 0; f < filas; f++) {
        for (let c = 0; c < cols; c++) {
          const x = 140 + c * 120;
          const y = 140 + f * 100;
          ctx.fillRect(x, y, 95, 75);
          ctx.strokeRect(x, y, 95, 75);
        }
      }
    }

    const dataUrl = canvasTemp.toDataURL("image/jpeg");
    await this.detectorPaneles.cargarImagenDesdeUrl(dataUrl);
  }

  private configurarEventosUI(): void {
    // Dropdown de cambio de ciudad
    const selectCiudad = document.getElementById("select-ciudad") as HTMLSelectElement | null;
    if (selectCiudad) {
      selectCiudad.addEventListener("change", (e) => {
        const valor = (e.target as HTMLSelectElement).value;
        const [latStr, lngStr] = valor.split(",");
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        this.visorMapa.centrarEnUbicacion(lat, lng, 18);
      });
    }

    // Botón de consultar NASA POWER manualmente
    const btnNasa = document.getElementById("btn-consultar-nasa");
    if (btnNasa) {
      btnNasa.addEventListener("click", async () => {
        const ubicacion = this.visorMapa.obtenerUbicacion();
        await this.alCambiarUbicacion(ubicacion.lat, ubicacion.lng);
      });
    }

    // Botón de Detección de Paneles YOLOv8
    const btnDetectar = document.getElementById("btn-detectar-ia");
    if (btnDetectar) {
      btnDetectar.addEventListener("click", async () => {
        btnDetectar.textContent = "⏳ Analizando Techo con IA...";
        const blobImagen = await this.detectorPaneles.obtenerCanvasBlob();
        if (blobImagen) {
          const resultado = await detectarPanelesSolares(blobImagen);
          this.deteccionActual = resultado;
          this.detectorPaneles.renderizarDetecciones(resultado);

          const elResumen = document.getElementById("resumen-deteccion-ia");
          if (elResumen) {
            elResumen.innerHTML = `
              ✅ Detección completada en <strong>${resultado.tiempoProcesamientoMs} ms</strong>.
              Paneles detectados: <strong>${resultado.totalPanelesDetectados}</strong>
              (Confianza promedio: ${(resultado.confianzaPromedio * 100).toFixed(1)}%).
            `;
          }
          this.ejecutarSimulacionCompleta();
        }
        btnDetectar.textContent = "🧠 Ejecutar Detección Satelital";
      });
    }

    // Subir archivo de imagen propio
    const inputArchivo = document.getElementById("input-imagen-archivo") as HTMLInputElement | null;
    if (inputArchivo) {
      inputArchivo.addEventListener("change", async (e) => {
        const archivos = (e.target as HTMLInputElement).files;
        if (archivos && archivos[0]) {
          await this.detectorPaneles.cargarImagenDesdeArchivo(archivos[0]);
          const blobImagen = await this.detectorPaneles.obtenerCanvasBlob();
          if (blobImagen) {
            const resultado = await detectarPanelesSolares(blobImagen);
            this.deteccionActual = resultado;
            this.detectorPaneles.renderizarDetecciones(resultado);
            this.ejecutarSimulacionCompleta();
          }
        }
      });
    }

    // Formulario de cálculo completo
    const formCalculadora = document.getElementById("form-calculadora-solar");
    if (formCalculadora) {
      formCalculadora.addEventListener("submit", () => {
        this.ejecutarSimulacionCompleta();
      });
    }
  }

  private ejecutarSimulacionCompleta(): void {
    const elConsumo = document.getElementById("input-consumo") as HTMLInputElement | null;
    const elTarifa = document.getElementById("select-tarifa") as HTMLSelectElement | null;
    const elCostoSistema = document.getElementById("input-costo-sistema") as HTMLInputElement | null;

    const consumoMensualKwh = elConsumo ? parseFloat(elConsumo.value) || 480 : 480;
    const tipoTarifa: TipoTarifaCfe = elTarifa ? (elTarifa.value as TipoTarifaCfe) : "tarifa_01";
    const costoSistemaMxn = elCostoSistema ? parseFloat(elCostoSistema.value) || 145000 : 145000;

    // 1. Cálculo de factura CFE "Antes" (Sin paneles) con motor Wasm Rust
    let costoMensualAntesMxn = 0;
    if (tipoTarifa === "tarifa_01") {
      costoMensualAntesMxn = calcularTarifa01(consumoMensualKwh, 75, 65, 1.05, 1.85, 3.65);
    } else {
      costoMensualAntesMxn = calcularPdbt(consumoMensualKwh, 12, 110, 135, 2.55);
    }

    // 2. Paneles sugeridos por irradiancia solar y consumo
    const produccionMensualPorPanelKwh = this.irradianciaActualGhi * 30 * 0.38; // Panel ~550W
    const panelesSugeridos = sugerirPaneles(consumoMensualKwh, produccionMensualPorPanelKwh);
    const generacionMensualKwh = panelesSugeridos * produccionMensualPorPanelKwh;
    const generacionAnualKwh = generacionMensualKwh * 12;

    // 3. Balance de Excedentes CFE con Wasm Rust
    const balance = calcularExcedentes(consumoMensualKwh, generacionMensualKwh, 2.55, 1.15);
    const costoMensualDespuesMxn = balance.balanceFinalMxn;

    // 4. Ahorros y ROI con Wasm Rust
    const ahorroMensualMxn = Math.max(0, costoMensualAntesMxn - costoMensualDespuesMxn);
    const ahorroAnualMxn = ahorroMensualMxn * 12;
    const porcentajeAhorro = costoMensualAntesMxn > 0 ? (ahorroMensualMxn / costoMensualAntesMxn) * 100 : 0;
    const roiAnios = calcularRoiAnios(costoSistemaMxn, ahorroAnualMxn);

    // 5. Mitigación CO2 con Wasm Rust
    const mitigacionCo2KgAnual = calcularMitigacionCo2Kg(generacionAnualKwh, 0.42);

    const panelesDetectados = this.deteccionActual ? this.deteccionActual.totalPanelesDetectados : 0;

    const resultadoFinal: ResultadoAnalisisSolar = {
      consumoMensualKwh,
      tipoTarifa,
      irradianciaGhiKwhM2Dia: this.irradianciaActualGhi,
      panelesSugeridos,
      panelesDetectadosSat: panelesDetectados,
      generacionMensualKwh,
      generacionAnualKwh,
      costoMensualAntesMxn,
      costoMensualDespuesMxn,
      ahorroMensualMxn,
      ahorroAnualMxn,
      porcentajeAhorro,
      roiAnios,
      mitigacionCo2KgAnual,
      balanceExcedentes: balance,
    };

    // Renderizar Dashboard "Antes vs Después"
    this.tableroResultados.renderizar(resultadoFinal);
  }
}

// Arrancar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const app = new AplicacionHelioScan();
  app.iniciar();
});

