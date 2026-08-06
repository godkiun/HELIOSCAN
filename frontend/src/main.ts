import {
  obtenerDatosNasa,
  obtenerImagenSatelitalReal,
  obtenerImagenSatelitalConFallbackZoom,
  esCuadroErrorGris,
  detectarPanelesSolares,
  DeteccionPanelesRespuesta,
} from "./core/cliente_api";
import { VisorMapaHelioScan } from "./features/map/visor_mapa";
import { ComponenteDetectorPaneles } from "./features/vision/detector_paneles_ui";
import { TableroResultados } from "./features/dashboard/tablero_resultados";
import { generarReportePdfHelioScan } from "./core/generador_pdf";
import {
  inicializarMotorSolar,
  calcularTarifa01,
  calcularPdbt,
  calcularExcedentes,
  sugerirPaneles,
  calcularRoiAnios,
  calcularMitigacionCo2Kg,
  evaluarAlertaDac,
  calcularGeneracionAjustadaPR,
  calcularProyeccion25Anios,
} from "./features/solar-calculator/cliente_wasm";
import { TipoTarifaCfe, ResultadoAnalisisSolar } from "./features/solar-calculator/tipos";

class AplicacionHelioScan {
  private visorMapa: VisorMapaHelioScan;
  private detectorPaneles: ComponenteDetectorPaneles;
  private tableroResultados: TableroResultados;

  private irradianciaActualGhi: number = 5.8;
  private deteccionActual: DeteccionPanelesRespuesta | null = null;
  private ultimoResultadoCalculo: ResultadoAnalisisSolar | null = null;

  constructor() {
    this.visorMapa = new VisorMapaHelioScan();
    this.detectorPaneles = new ComponenteDetectorPaneles();
    this.tableroResultados = new TableroResultados();
  }

  public async iniciar(): Promise<void> {
    console.log("☀️ Iniciando HelioScan App...");

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

    // 6. Cargar datos solares de ubicación por defecto (Lázaro Cárdenas)
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

    // Descargar captura de imagen satelital REAL de Esri centrada exactamente en el pin
    const urlImagenReal = await obtenerImagenSatelitalReal(lat, lng);
    if (urlImagenReal) {
      await this.detectorPaneles.cargarImagenDesdeUrl(urlImagenReal);
    } else {
      await this.generarImagenTerrenoSatelital();
    }

    // Resetear las cajas de detección anteriores al mover la ubicación
    this.deteccionActual = {
      exito: true,
      totalPanelesDetectados: 0,
      confianzaPromedio: 0,
      cajasDelimitadoras: [],
      mensaje: "Zona lista para escanear",
      tiempoProcesamientoMs: 0,
    };
    this.detectorPaneles.renderizarDetecciones(this.deteccionActual);

    const elResumen = document.getElementById("resumen-deteccion-ia");
    if (elResumen) {
      elResumen.innerHTML = `📍 Captura satelital actualizada. Presiona <strong>"Escanear paneles en la foto"</strong> para analizar la casa.`;
    }

    // Consultar datos de irradiancia solar de la NASA
    const datosNasa = await obtenerDatosNasa(lat, lng);
    this.irradianciaActualGhi = datosNasa.promedioDiarioKwhM2;

    if (elIrr) {
      elIrr.textContent = `${this.irradianciaActualGhi.toFixed(2)} kWh/m²/día (${datosNasa.fuente})`;
    }

    // Recalcular simulación
    this.ejecutarSimulacionCompleta();
  }

  private async buscarDireccionGeocoding(query: string): Promise<void> {
    if (!query || query.trim().length < 3) return;
    const btnBuscar = document.getElementById("btn-buscar-direccion");
    if (btnBuscar) btnBuscar.textContent = "⏳ Buscando...";

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim() + ", Mexico")}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        this.visorMapa.centrarEnUbicacion(lat, lon, 18);
      } else {
        alert("No se encontró la dirección especificada. Intenta con calle, ciudad o código postal.");
      }
    } catch (e) {
      console.error("Error al buscar dirección:", e);
    } finally {
      if (btnBuscar) btnBuscar.textContent = "Buscar";
    }
  }

  private async generarImagenTerrenoSatelital(): Promise<void> {
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = 640;
    canvasTemp.height = 480;
    const ctx = canvasTemp.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#332612";
      ctx.fillRect(0, 0, 640, 480);

      ctx.fillStyle = "#1e3a1e";
      ctx.beginPath();
      ctx.arc(150, 180, 110, 0, Math.PI * 2);
      ctx.arc(380, 260, 140, 0, Math.PI * 2);
      ctx.arc(520, 120, 90, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#2d5a2d";
      ctx.beginPath();
      ctx.arc(170, 190, 80, 0, Math.PI * 2);
      ctx.arc(360, 240, 95, 0, Math.PI * 2);
      ctx.arc(500, 140, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    const dataUrl = canvasTemp.toDataURL("image/jpeg");
    await this.detectorPaneles.cargarImagenDesdeUrl(dataUrl);
  }

  private async cargarImagenTechoPaneles(): Promise<void> {
    const canvasTemp = document.createElement("canvas");
    canvasTemp.width = 640;
    canvasTemp.height = 480;
    const ctx = canvasTemp.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#1a2233";
      ctx.fillRect(0, 0, 640, 480);

      ctx.fillStyle = "#3d4b66";
      ctx.fillRect(100, 100, 440, 280);

      ctx.fillStyle = "#1e3a8a";
      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 3;

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

  private async cargarImagenPredeterminada(): Promise<void> {
    await this.generarImagenTerrenoSatelital();
  }

  private configurarEventosUI(): void {
    // Búsqueda de dirección con Geocoding
    const btnBuscar = document.getElementById("btn-buscar-direccion");
    const inputBuscar = document.getElementById("input-busqueda-direccion") as HTMLInputElement | null;

    if (btnBuscar && inputBuscar) {
      btnBuscar.addEventListener("click", () => {
        this.buscarDireccionGeocoding(inputBuscar.value);
      });
      inputBuscar.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.buscarDireccionGeocoding(inputBuscar.value);
        }
      });
    }

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

    // Botón para alternar vista Plano Esquemático HUD vs Foto Satelital
    const btnToggleHUD = document.getElementById("btn-toggle-modo-hud");
    if (btnToggleHUD) {
      btnToggleHUD.addEventListener("click", () => {
        const esHUD = this.detectorPaneles.alternarModoHUD();
        btnToggleHUD.textContent = esHUD ? "📐 Modo: Plano HUD" : "📷 Modo: Foto Satelital";
      });
    }

    // Botón para cargar Techo Demo con Paneles
    const btnDemoPaneles = document.getElementById("btn-cargar-demo-paneles");
    if (btnDemoPaneles) {
      btnDemoPaneles.addEventListener("click", async () => {
        await this.cargarImagenTechoPaneles();
        const blobImagen = await this.detectorPaneles.obtenerCanvasBlob();
        const ctx = this.detectorPaneles.obtenerContexto2D();
        const ancho = this.detectorPaneles.obtenerAncho();
        const alto = this.detectorPaneles.obtenerAlto();

        if (blobImagen) {
          const resultado = await detectarPanelesSolares(blobImagen, ctx, ancho, alto);
          this.deteccionActual = resultado;
          this.detectorPaneles.renderizarDetecciones(resultado);

          const elResumen = document.getElementById("resumen-deteccion-ia");
          if (elResumen) {
            elResumen.innerHTML = `
              ✅ Escaneo completado en <strong>${resultado.tiempoProcesamientoMs} ms</strong>.<br/>
              Techo demo cargado. Paneles detectados: <strong>${resultado.totalPanelesDetectados}</strong>
              (Certeza promedio: ${(resultado.confianzaPromedio * 100).toFixed(1)}%).
            `;
          }
          this.ejecutarSimulacionCompleta();
        }
      });
    }

    // Botón de Detección de Paneles YOLOv8
    const btnDetectar = document.getElementById("btn-detectar-ia");
    if (btnDetectar) {
      btnDetectar.addEventListener("click", async () => {
        btnDetectar.textContent = "⏳ Analizando foto...";
        const blobImagen = await this.detectorPaneles.obtenerCanvasBlob();
        const ctx = this.detectorPaneles.obtenerContexto2D();
        const ancho = this.detectorPaneles.obtenerAncho();
        const alto = this.detectorPaneles.obtenerAlto();

        // 2. VALIDACIÓN PREVIA A LA INFERENCIA: Filtro de falsos positivos en cuadros de error
        if (esCuadroErrorGris(ctx, ancho, alto)) {
          this.detectorPaneles.limpiarLienzo();
          this.deteccionActual = {
            exito: false,
            totalPanelesDetectados: 0,
            confianzaPromedio: 0,
            cajasDelimitadoras: [],
            mensaje: "No hay vista satelital disponible con suficiente resolución para esta área.",
            tiempoProcesamientoMs: 0,
          };
          const elResumen = document.getElementById("resumen-deteccion-ia");
          if (elResumen) {
            elResumen.innerHTML = `⚠️ <strong style="color: #ef4444;">No hay vista satelital disponible con suficiente resolución para esta área.</strong><br/>No se ejecutó inferencia para evitar falsos positivos.`;
          }
          btnDetectar.textContent = "🔍 Escanear paneles en la foto";
          return;
        }

        if (blobImagen) {
          const resultado = await detectarPanelesSolares(blobImagen, ctx, ancho, alto);
          this.deteccionActual = resultado;
          this.detectorPaneles.renderizarDetecciones(resultado);

          const elResumen = document.getElementById("resumen-deteccion-ia");
          if (elResumen) {
            if (!resultado.exito) {
              elResumen.innerHTML = `⚠️ <strong style="color: #ef4444;">${resultado.mensaje}</strong>`;
            } else if (resultado.totalPanelesDetectados > 0) {
              elResumen.innerHTML = `
                ✅ Escaneo completado en <strong>${resultado.tiempoProcesamientoMs} ms</strong>.<br/>
                Paneles detectados: <strong>${resultado.totalPanelesDetectados}</strong>
                (Certeza promedio: ${(resultado.confianzaPromedio * 100).toFixed(1)}%).
              `;
            } else {
              elResumen.innerHTML = `
                📍 Escaneo completado en <strong>${resultado.tiempoProcesamientoMs} ms</strong>.<br/>
                <strong>No se detectaron paneles solares instalados</strong> en esta propiedad.
              `;
            }
          }
          this.ejecutarSimulacionCompleta();
        }
        btnDetectar.textContent = "🔍 Escanear paneles en la foto";
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
          const ctx = this.detectorPaneles.obtenerContexto2D();
          const ancho = this.detectorPaneles.obtenerAncho();
          const alto = this.detectorPaneles.obtenerAlto();

          if (blobImagen) {
            const resultado = await detectarPanelesSolares(blobImagen, ctx, ancho, alto);
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

    // Delegación de eventos para botones dinámicos en Dashboard (PDF y Modal)
    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (target && target.id === "btn-exportar-pdf") {
        if (this.ultimoResultadoCalculo) {
          generarReportePdfHelioScan(this.ultimoResultadoCalculo);
        }
      } else if (target && target.id === "btn-abrir-cotizador") {
        const modal = document.getElementById("modal-cotizador");
        if (modal) modal.style.display = "flex";
      } else if (target && target.id === "btn-cerrar-modal") {
        const modal = document.getElementById("modal-cotizador");
        if (modal) modal.style.display = "none";
      }
    });

    // Formulario de Solicitud de Cotizaciones Lead
    const formLead = document.getElementById("form-lead-cotizacion");
    if (formLead) {
      formLead.addEventListener("submit", () => {
        const inputNombre = document.getElementById("input-lead-nombre") as HTMLInputElement | null;
        const nombre = inputNombre ? inputNombre.value : "Cliente";
        alert(`¡Gracias ${nombre}! Tu prospección fotovoltaica ha sido enviada a 3 instaladores solares certificados CFE en tu zona.`);
        const modal = document.getElementById("modal-cotizador");
        if (modal) modal.style.display = "none";
      });
    }
  }

  private ejecutarSimulacionCompleta(): void {
    const elConsumo = document.getElementById("input-consumo") as HTMLInputElement | null;
    const elTarifa = document.getElementById("select-tarifa") as HTMLSelectElement | null;
    const elOrientacion = document.getElementById("select-orientacion") as HTMLSelectElement | null;
    const elCostoSistema = document.getElementById("input-costo-sistema") as HTMLInputElement | null;

    const consumoMensualKwh = elConsumo ? parseFloat(elConsumo.value) || 480 : 480;
    const tipoTarifa: TipoTarifaCfe = elTarifa ? (elTarifa.value as TipoTarifaCfe) : "tarifa_01";
    const factorOrientacion = elOrientacion ? parseFloat(elOrientacion.value) || 1.0 : 1.0;
    const costoSistemaMxn = elCostoSistema ? parseFloat(elCostoSistema.value) || 145000 : 145000;

    // 1. Cálculo de factura CFE "Antes" (Sin paneles) con motor Wasm Rust
    let costoMensualAntesMxn = 0;
    if (tipoTarifa === "tarifa_01") {
      costoMensualAntesMxn = calcularTarifa01(consumoMensualKwh, 75, 65, 1.05, 1.85, 3.65);
    } else {
      costoMensualAntesMxn = calcularPdbt(consumoMensualKwh, 12, 110, 135, 2.55);
    }

    // 2. Paneles sugeridos ajustados por irradiancia solar, orientación del techo y coeficiente PR (Performance Ratio)
    const { pr, produccionMensualPorPanelKwh } = calcularGeneracionAjustadaPR(this.irradianciaActualGhi, 32, factorOrientacion);
    const panelesSugeridos = sugerirPaneles(consumoMensualKwh, produccionMensualPorPanelKwh);
    const panelesDetectados = this.deteccionActual ? this.deteccionActual.totalPanelesDetectados : 0;
    const panelesAdicionalesFaltantes = Math.max(0, panelesSugeridos - panelesDetectados);

    const generacionMensualKwh = panelesSugeridos * produccionMensualPorPanelKwh;
    const generacionAnualKwh = generacionMensualKwh * 12;

    // 3. Balance de Excedentes CFE con Wasm Rust
    const balance = calcularExcedentes(consumoMensualKwh, generacionMensualKwh, 2.55, 1.15);
    const costoMensualDespuesMxn = balance.balanceFinalMxn;

    // 4. Ajuste de Inversión Neta y ROI si ya existen paneles en la propiedad
    const costoPorPanelEstimado = panelesSugeridos > 0 ? costoSistemaMxn / panelesSugeridos : 15000;
    const costoNetoSistemaMxn = panelesDetectados > 0 
      ? Math.round(panelesAdicionalesFaltantes * costoPorPanelEstimado)
      : costoSistemaMxn;

    const ahorroMensualMxn = Math.max(0, costoMensualAntesMxn - costoMensualDespuesMxn);
    const ahorroAnualMxn = ahorroMensualMxn * 12;
    const porcentajeAhorro = costoMensualAntesMxn > 0 ? (ahorroMensualMxn / costoMensualAntesMxn) * 100 : 0;
    const roiAnios = calcularRoiAnios(costoNetoSistemaMxn, ahorroAnualMxn);

    // 5. Mitigación CO2, Alerta DAC y Proyección a 25 años
    const mitigacionCo2KgAnual = calcularMitigacionCo2Kg(generacionAnualKwh, 0.42);
    const alertaDac = evaluarAlertaDac(consumoMensualKwh, 250);
    const proyeccion25Anios = calcularProyeccion25Anios(generacionAnualKwh, costoNetoSistemaMxn, ahorroAnualMxn, 0.005, 0.045);

    const resultadoFinal: ResultadoAnalisisSolar = {
      consumoMensualKwh,
      tipoTarifa,
      irradianciaGhiKwhM2Dia: parseFloat((this.irradianciaActualGhi * factorOrientacion).toFixed(2)),
      panelesSugeridos,
      panelesDetectadosSat: panelesDetectados,
      panelesAdicionalesFaltantes,
      costoNetoSistemaMxn,
      generacionMensualKwh,
      generacionAnualKwh,
      costoMensualAntesMxn,
      costoMensualDespuesMxn,
      ahorroMensualMxn,
      ahorroAnualMxn,
      porcentajeAhorro,
      roiAnios,
      mitigacionCo2KgAnual,
      performanceRatio: pr,
      alertaDac,
      proyeccion25Anios,
      balanceExcedentes: balance,
    };

    this.ultimoResultadoCalculo = resultadoFinal;

    // Renderizar Dashboard "Antes vs Después"
    this.tableroResultados.renderizar(resultadoFinal);
  }
}

// Arrancar la aplicación cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const app = new AplicacionHelioScan();
  app.iniciar();

  // Registrar PWA Service Worker si está soportado por el navegador
  if ("serviceWorker" in navigator && import.meta.env.PROD) {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      console.log("📱 PWA Service Worker registrado con éxito para inspecciones offline:", reg.scope);
    }).catch((err) => {
      console.warn("⚠️ Registro de Service Worker omitido o fallido:", err);
    });
  }
});


