import { obtenerDatosNasa, obtenerImagenSatelitalConFallbackZoom, esCuadroErrorGris, esImagenUrlErrorTile, detectarPanelesSolares, } from "./core/cliente_api";
import { VisorMapaHelioScan } from "./features/map/visor_mapa";
import { ComponenteDetectorPaneles } from "./features/vision/detector_paneles_ui";
import { TableroResultados } from "./features/dashboard/tablero_resultados";
import { generarReportePdfHelioScan } from "./core/generador_pdf";
import { inicializarMotorSolar, calcularTarifa01, calcularPdbt, calcularExcedentes, sugerirPaneles, calcularRoiAnios, calcularMitigacionCo2Kg, evaluarAlertaDac, calcularGeneracionAjustadaPR, calcularProyeccion25Anios, } from "./features/solar-calculator/cliente_wasm";
export class AplicacionHelioScan {
    visorMapa;
    detectorPaneles;
    tableroResultados;
    irradianciaActualGhi = 5.2; // Valor por defecto
    deteccionActual = {
        exito: true,
        totalPanelesDetectados: 0,
        confianzaPromedio: 0,
        cajasDelimitadoras: [],
        mensaje: "Sin analizar",
        tiempoProcesamientoMs: 0,
    };
    ultimoResultadoCalculo = null;
    async iniciar() {
        // 1. Inicializar Motor WASM de CFE
        await inicializarMotorSolar();
        // 2. Inicializar componentes UI
        this.detectorPaneles = new ComponenteDetectorPaneles();
        this.detectorPaneles.inicializar("lienzo-vision");
        this.tableroResultados = new TableroResultados();
        this.tableroResultados.inicializar("contenedor-dashboard");
        // 3. Inicializar mapa satelital Leaflet (Lázaro Cárdenas, Michoacán por defecto)
        this.visorMapa = new VisorMapaHelioScan();
        const posInicial = { lat: 17.95833, lng: -102.19722 };
        this.visorMapa.inicializar("mapa-satelital", (ubicacion) => {
            this.alCambiarUbicacion(ubicacion.lat, ubicacion.lng);
        });
        // 4. Configurar eventos de botones y formulario
        this.configurarEventosUI();
        // 5. Cargar imagen de techo de ejemplo inicial
        await this.cargarImagenPredeterminada();
        // 6. Consultar ubicación inicial
        await this.alCambiarUbicacion(posInicial.lat, posInicial.lng);
        // 7. Ejecutar simulación inicial
        this.ejecutarSimulacionCompleta();
    }
    async alCambiarUbicacion(lat, lng) {
        const elLat = document.getElementById("val-lat");
        const elLng = document.getElementById("val-lng");
        const elIrr = document.getElementById("val-irradiancia");
        const elResumen = document.getElementById("resumen-deteccion-ia");
        if (elLat)
            elLat.textContent = lat.toFixed(5);
        if (elLng)
            elLng.textContent = lng.toFixed(5);
        if (elIrr)
            elIrr.textContent = "Consultando NASA POWER...";
        if (elResumen) {
            elResumen.innerHTML = `⏳ Verificando resolución satelital de la zona...`;
        }
        // 1. LÓGICA DE FALLBACK DINÁMICO PARA EL ZOOM (18 -> 17 -> 16 -> 15 -> 14)
        const resultadoZoom = await obtenerImagenSatelitalConFallbackZoom(lat, lng, 18, 14, async (url) => {
            const esErrorTile = await esImagenUrlErrorTile(url);
            return !esErrorTile;
        });
        if (resultadoZoom.imagenValida && resultadoZoom.url) {
            // Cargar captura de alta resolución encontrada
            await this.detectorPaneles.cargarImagenDesdeUrl(resultadoZoom.url);
            this.deteccionActual = {
                exito: true,
                totalPanelesDetectados: 0,
                confianzaPromedio: 0,
                cajasDelimitadoras: [],
                mensaje: "Zona lista para escanear",
                tiempoProcesamientoMs: 0,
            };
            this.detectorPaneles.renderizarDetecciones(this.deteccionActual);
            if (elResumen) {
                elResumen.innerHTML = `Captura satelital lista (Zoom Nivel ${resultadoZoom.zoom}). Presiona <strong>"Generar plano de paneles"</strong> para analizar.`;
            }
        }
        else {
            // Manejo de error si no se encuentra vista satelital suficiente
            this.detectorPaneles.limpiarLienzo();
            this.deteccionActual = {
                exito: false,
                totalPanelesDetectados: 0,
                confianzaPromedio: 0,
                cajasDelimitadoras: [],
                mensaje: "No hay vista satelital disponible con suficiente resolución para esta área.",
                tiempoProcesamientoMs: 0,
            };
            if (elResumen) {
                elResumen.innerHTML = `<strong style="color: #ef4444;">No hay vista satelital disponible con suficiente resolución para esta área.</strong><br/>Por favor selecciona otra ubicación o sube una fotografía propia de tu techo.`;
            }
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
    async buscarDireccionGeocoding(query) {
        if (!query || query.trim().length < 3)
            return;
        const btnBuscar = document.getElementById("btn-buscar-direccion");
        if (btnBuscar)
            btnBuscar.textContent = "Buscando...";
        try {
            const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim() + ", Mexico")}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                this.visorMapa.centrarEnUbicacion(lat, lon, 18);
            }
            else {
                alert("No se encontró la dirección especificada. Intenta con calle, ciudad o código postal.");
            }
        }
        catch (e) {
            console.error("Error al buscar dirección:", e);
        }
        finally {
            if (btnBuscar)
                btnBuscar.textContent = "Buscar";
        }
    }
    async generarImagenTerrenoSatelital() {
        await this.cargarImagenTechoPaneles();
    }
    async cargarImagenTechoPaneles() {
        // Generar SVG satelital con techo y paneles solares instalados
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
      <rect width="640" height="480" fill="#3b3f46"/>
      <polygon points="120,60 520,60 580,420 60,420" fill="#64748b" stroke="#334155" stroke-width="4"/>
      <line x1="320" y1="60" x2="320" y2="420" stroke="#1e293b" stroke-width="3"/>
      <!-- Arreglo 1 (Izquierda) -->
      <rect x="150" y="140" width="60" height="90" fill="#0f172a" stroke="#FC8B26" stroke-width="3" rx="4"/>
      <rect x="220" y="140" width="60" height="90" fill="#0f172a" stroke="#FC8B26" stroke-width="3" rx="4"/>
      <rect x="150" y="240" width="60" height="90" fill="#0f172a" stroke="#FC8B26" stroke-width="3" rx="4"/>
      <rect x="220" y="240" width="60" height="90" fill="#0f172a" stroke="#FC8B26" stroke-width="3" rx="4"/>
      <!-- Arreglo 2 (Derecha) -->
      <rect x="360" y="140" width="60" height="90" fill="#0f172a" stroke="#FC8B26" stroke-width="3" rx="4"/>
      <rect x="430" y="140" width="60" height="90" fill="#0f172a" stroke="#FC8B26" stroke-width="3" rx="4"/>
    </svg>`;
        const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
        await this.detectorPaneles.cargarImagenDesdeUrl(dataUrl);
    }
    async cargarImagenPredeterminada() {
        await this.cargarImagenTechoPaneles();
    }
    configurarEventosUI() {
        // Búsqueda de dirección con Geocoding
        const btnBuscar = document.getElementById("btn-buscar-direccion");
        const inputBuscar = document.getElementById("input-busqueda-direccion");
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
        const selectCiudad = document.getElementById("select-ciudad");
        if (selectCiudad) {
            selectCiudad.addEventListener("change", (e) => {
                const valor = e.target.value;
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
              Escaneo completado en <strong>${resultado.tiempoProcesamientoMs} ms</strong>.<br/>
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
                btnDetectar.textContent = "Analizando plano...";
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
                        elResumen.innerHTML = `<strong style="color: #ef4444;">No hay vista satelital disponible con suficiente resolución para esta área.</strong><br/>No se ejecutó inferencia para evitar falsos positivos.`;
                    }
                    btnDetectar.textContent = "Generar plano de paneles";
                    return;
                }
                if (blobImagen) {
                    const resultado = await detectarPanelesSolares(blobImagen, ctx, ancho, alto);
                    this.deteccionActual = resultado;
                    this.detectorPaneles.renderizarDetecciones(resultado);
                    const elResumen = document.getElementById("resumen-deteccion-ia");
                    if (elResumen) {
                        if (!resultado.exito) {
                            elResumen.innerHTML = `<strong style="color: #ef4444;">${resultado.mensaje}</strong>`;
                        }
                        else if (resultado.totalPanelesDetectados > 0) {
                            elResumen.innerHTML = `
                Escaneo completado en <strong>${resultado.tiempoProcesamientoMs} ms</strong>.<br/>
                Paneles detectados: <strong>${resultado.totalPanelesDetectados}</strong>
                (Certeza promedio: ${(resultado.confianzaPromedio * 100).toFixed(1)}%).
              `;
                        }
                        else {
                            elResumen.innerHTML = `
                Escaneo completado en <strong>${resultado.tiempoProcesamientoMs} ms</strong>.<br/>
                <strong>No se detectaron paneles solares instalados</strong> en esta propiedad.
              `;
                        }
                    }
                    this.ejecutarSimulacionCompleta();
                }
                btnDetectar.textContent = "Generar plano de paneles";
            });
        }
        // Subir archivo de imagen propio
        const inputArchivo = document.getElementById("input-imagen-archivo");
        if (inputArchivo) {
            inputArchivo.addEventListener("change", async (e) => {
                const archivos = e.target.files;
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
            const target = e.target;
            if (target && target.id === "btn-exportar-pdf") {
                if (this.ultimoResultadoCalculo) {
                    generarReportePdfHelioScan(this.ultimoResultadoCalculo);
                }
            }
            else if (target && target.id === "btn-abrir-cotizador") {
                const modal = document.getElementById("modal-cotizador");
                if (modal)
                    modal.style.display = "flex";
            }
            else if (target && target.id === "btn-cerrar-modal") {
                const modal = document.getElementById("modal-cotizador");
                if (modal)
                    modal.style.display = "none";
            }
        });
        // Formulario de Solicitud de Cotizaciones Lead
        const formLead = document.getElementById("form-lead-cotizacion");
        if (formLead) {
            formLead.addEventListener("submit", () => {
                const inputNombre = document.getElementById("input-lead-nombre");
                const nombre = inputNombre ? inputNombre.value : "Cliente";
                alert(`¡Gracias ${nombre}! Tu prospección fotovoltaica ha sido enviada a 3 instaladores solares certificados CFE en tu zona.`);
                const modal = document.getElementById("modal-cotizador");
                if (modal)
                    modal.style.display = "none";
            });
        }
    }
    ejecutarSimulacionCompleta() {
        const elConsumo = document.getElementById("input-consumo");
        const elTarifa = document.getElementById("select-tarifa");
        const elOrientacion = document.getElementById("select-orientacion");
        const elCostoSistema = document.getElementById("input-costo-sistema");
        const consumoMensualKwh = elConsumo ? parseFloat(elConsumo.value) || 480 : 480;
        const tipoTarifa = elTarifa ? elTarifa.value : "tarifa_01";
        const factorOrientacion = elOrientacion ? parseFloat(elOrientacion.value) || 1.0 : 1.0;
        const costoSistemaMxn = elCostoSistema ? parseFloat(elCostoSistema.value) || 145000 : 145000;
        // 1. Cálculo de factura CFE "Antes" (Sin paneles) con motor Wasm Rust
        let costoMensualAntesMxn = 0;
        if (tipoTarifa === "tarifa_01") {
            costoMensualAntesMxn = calcularTarifa01(consumoMensualKwh, 75, 65, 1.05, 1.85, 3.65);
        }
        else {
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
        const resultadoFinal = {
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
