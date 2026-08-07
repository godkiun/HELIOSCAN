// Motor Tarifario CFE y Financiero Solar (Wasm / TS Fallback)
// Incluye tarifas residenciales 1A-1F por zona de temperatura de verano (CFE 2025)

/** ─────────────────────────────────────────────────────────────────────────
 *  Tabla oficial de tarifas residenciales CFE diferenciadas por temperatura
 *  de verano (°C promedio en los meses más cálidos del año).
 *  Fuente: DOF – Acuerdo Tarifas CFE vigentes 2025.
 * ──────────────────────────────────────────────────────────────────────── */
export type ZonaTarifariaCfe = "1" | "1A" | "1B" | "1C" | "1D" | "1E" | "1F";

export interface EstructuraTarifaResidencial {
  zona: ZonaTarifariaCfe;
  descripcion: string;
  tempVerano_C: number;          // Temperatura de verano mínima que activa la zona
  limiteBasicoKwh: number;       // kWh subsidiados básicos bimestrales (divididos a mes)
  limiteIntermedioKwh: number;   // kWh adicionales intermedios bimestrales
  precioBasico_MXN: number;      // $/kWh bloque básico (sin IVA)
  precioIntermedio_MXN: number;  // $/kWh bloque intermedio (sin IVA)
  precioExcedente_MXN: number;   // $/kWh excedente (sin IVA)
  // Precios de verano (temporada cálida: mayo–octubre)
  precioBasicoVerano_MXN: number;
  precioIntermedioVerano_MXN: number;
  precioExcedenteVerano_MXN: number;
}

export const TARIFAS_RESIDENCIALES_CFE: EstructuraTarifaResidencial[] = [
  {
    zona: "1",
    descripcion: "Zona Estándar (Ciudad de México, Jalisco, Puebla…)",
    tempVerano_C: 0,
    limiteBasicoKwh: 75,
    limiteIntermedioKwh: 65,
    precioBasico_MXN: 1.051,
    precioIntermedio_MXN: 1.850,
    precioExcedente_MXN: 3.649,
    precioBasicoVerano_MXN: 1.051,
    precioIntermedioVerano_MXN: 1.850,
    precioExcedenteVerano_MXN: 3.649,
  },
  {
    zona: "1A",
    descripcion: "Zona Cálida 1A (Veracruz, Tabasco, Nayarit…)",
    tempVerano_C: 25,
    limiteBasicoKwh: 100,
    limiteIntermedioKwh: 75,
    precioBasico_MXN: 0.895,
    precioIntermedio_MXN: 1.064,
    precioExcedente_MXN: 2.859,
    precioBasicoVerano_MXN: 0.895,
    precioIntermedioVerano_MXN: 1.064,
    precioExcedenteVerano_MXN: 2.859,
  },
  {
    zona: "1B",
    descripcion: "Zona Cálida 1B (Michoacán Costa, Guerrero Costa…)",
    tempVerano_C: 28,
    limiteBasicoKwh: 150,
    limiteIntermedioKwh: 100,
    precioBasico_MXN: 0.755,
    precioIntermedio_MXN: 0.900,
    precioExcedente_MXN: 2.589,
    precioBasicoVerano_MXN: 0.755,
    precioIntermedioVerano_MXN: 0.900,
    precioExcedenteVerano_MXN: 2.589,
  },
  {
    zona: "1C",
    descripcion: "Zona Cálida 1C (Sinaloa, Colima, Jalisco Costa…)",
    tempVerano_C: 30,
    limiteBasicoKwh: 200,
    limiteIntermedioKwh: 100,
    precioBasico_MXN: 0.706,
    precioIntermedio_MXN: 0.840,
    precioExcedente_MXN: 2.433,
    precioBasicoVerano_MXN: 0.706,
    precioIntermedioVerano_MXN: 0.840,
    precioExcedenteVerano_MXN: 2.433,
  },
  {
    zona: "1D",
    descripcion: "Zona Cálida 1D (Tamaulipas, NL verano, Sonora Sur)",
    tempVerano_C: 31,
    limiteBasicoKwh: 300,
    limiteIntermedioKwh: 100,
    precioBasico_MXN: 0.657,
    precioIntermedio_MXN: 0.781,
    precioExcedente_MXN: 2.208,
    precioBasicoVerano_MXN: 0.657,
    precioIntermedioVerano_MXN: 0.781,
    precioExcedenteVerano_MXN: 2.208,
  },
  {
    zona: "1E",
    descripcion: "Zona Muy Cálida 1E (Sonora Norte, Chihuahua, BCS)",
    tempVerano_C: 32,
    limiteBasicoKwh: 400,
    limiteIntermedioKwh: 100,
    precioBasico_MXN: 0.618,
    precioIntermedio_MXN: 0.735,
    precioExcedente_MXN: 2.041,
    precioBasicoVerano_MXN: 0.618,
    precioIntermedioVerano_MXN: 0.735,
    precioExcedenteVerano_MXN: 2.041,
  },
  {
    zona: "1F",
    descripcion: "Zona Extremadamente Cálida 1F (Desierto de Sonora, Mexicali, Hermosillo)",
    tempVerano_C: 33,
    limiteBasicoKwh: 600,
    limiteIntermedioKwh: 150,
    precioBasico_MXN: 0.559,
    precioIntermedio_MXN: 0.665,
    precioExcedente_MXN: 1.825,
    precioBasicoVerano_MXN: 0.559,
    precioIntermedioVerano_MXN: 0.665,
    precioExcedenteVerano_MXN: 1.825,
  },
];

/**
 * Mapeo de coordenadas aproximadas a zona tarifaria CFE por temperatura.
 * Lógica simplificada basada en regiones geográficas conocidas.
 */
export function detectarZonaTarifariaPorCoords(lat: number, lng: number): ZonaTarifariaCfe {
  // Baja California y Sonora Norte (zona muy extrema)
  if (lat > 28 && lng < -110) return "1F";
  // Hermosillo, Sonora / Chihuahua desértico
  if (lat > 26 && lat <= 30 && lng < -108) return "1E";
  // Tamaulipas, Nuevo León, norte de Coahuila
  if (lat > 23 && lat <= 26 && lng > -100 && lng < -96) return "1D";
  // Sinaloa, Colima, Jalisco costa
  if (lat > 18 && lat <= 25 && lng < -104) return "1C";
  // Michoacán costa, Guerrero, Oaxaca costa
  if (lat > 16 && lat <= 20 && lng > -102 && lng < -95) return "1B";
  // Veracruz, Tabasco, Nayarit, Quintana Roo
  if (lat > 16 && lat <= 22 && lng > -98) return "1A";
  // Default: zona estándar (CDMX, Jalisco interior, Puebla, etc.)
  return "1";
}

/**
 * Calcula la tarifa residencial CFE para cualquier zona 1-1F.
 * Aplica bloques: básico → intermedio → excedente, con IVA 16%.
 */
export function calcularTarifaResidencial(
  consumoKwh: number,
  zona: ZonaTarifariaCfe = "1",
  esVerano: boolean = false
): { costoConIva: number; zona: ZonaTarifariaCfe; estructura: EstructuraTarifaResidencial } {
  const estructura = TARIFAS_RESIDENCIALES_CFE.find((t) => t.zona === zona)
    || TARIFAS_RESIDENCIALES_CFE[0];

  const precioBasico = esVerano ? estructura.precioBasicoVerano_MXN : estructura.precioBasico_MXN;
  const precioIntermedio = esVerano ? estructura.precioIntermedioVerano_MXN : estructura.precioIntermedio_MXN;
  const precioExcedente = esVerano ? estructura.precioExcedenteVerano_MXN : estructura.precioExcedente_MXN;

  let costo = 0;
  let restante = consumoKwh;

  const basico = Math.min(restante, estructura.limiteBasicoKwh);
  costo += basico * precioBasico;
  restante -= basico;

  if (restante > 0) {
    const intermedio = Math.min(restante, estructura.limiteIntermedioKwh);
    costo += intermedio * precioIntermedio;
    restante -= intermedio;
  }

  if (restante > 0) {
    costo += restante * precioExcedente;
  }

  return {
    costoConIva: Math.round(costo * 1.16 * 100) / 100,
    zona,
    estructura,
  };
}
export interface BalanceExcedentes {
  consumoNetoKwh: number;
  excedenteKwh: number;
  cargoEnergiaMxn: number;
  creditoExcedenteMxn: number;
  balanceFinalMxn: number;
}

let wasmModulo: any = null;

export async function inicializarMotorSolar(): Promise<void> {
  try {
    const cargarWasm = new Function("ruta", "return import(ruta);");
    const module = await cargarWasm("./pkg/helioscan_rust_engine.js").catch(() => null);
    if (module && typeof module.default === "function") {
      await module.default();
      wasmModulo = module;
      console.log("⚡ Motor Rust / WebAssembly cargado con éxito.");
    } else {
      console.log("💡 Operando con motor TypeScript optimizado de alta precisión.");
    }
  } catch (err) {
    console.log("💡 Operando con motor TypeScript optimizado de alta precisión.");
  }
}

export function calcularTarifa01(
  consumoKwh: number,
  limiteBasico: number = 75,
  limiteIntermedio: number = 65,
  precioBasico: number = 1.05,
  precioIntermedio: number = 1.85,
  precioExcedente: number = 3.65
): number {
  if (wasmModulo && typeof wasmModulo.calcular_tarifa_01 === "function") {
    return wasmModulo.calcular_tarifa_01(consumoKwh, limiteBasico, limiteIntermedio, precioBasico, precioIntermedio, precioExcedente);
  }
  let costo = 0;
  let restante = consumoKwh;

  const basico = Math.min(restante, limiteBasico);
  costo += basico * precioBasico;
  restante -= basico;

  if (restante > 0) {
    const intermedio = Math.min(restante, limiteIntermedio);
    costo += intermedio * precioIntermedio;
    restante -= intermedio;
  }

  if (restante > 0) {
    costo += restante * precioExcedente;
  }

  return Math.round(costo * 1.16 * 100) / 100; // IVA 16%
}

export function calcularPdbt(
  consumoKwh: number,
  cargoFijoMxn: number = 12,
  precioKwhBajo: number = 2.25,
  precioKwhAlto: number = 2.85,
  umbralKwh: number = 300
): number {
  if (wasmModulo && typeof wasmModulo.calcular_pdbt === "function") {
    return wasmModulo.calcular_pdbt(consumoKwh, cargoFijoMxn, precioKwhBajo, precioKwhAlto, umbralKwh);
  }
  const precioKwh = consumoKwh > umbralKwh ? precioKwhAlto : precioKwhBajo;
  const subtotal = cargoFijoMxn + consumoKwh * precioKwh;
  return Math.round(subtotal * 1.16 * 100) / 100;
}

export function calcularExcedentes(
  consumoKwh: number,
  generacionKwh: number,
  precioImportacionMxn: number = 2.55,
  precioExportacionMxn: number = 1.15
): BalanceExcedentes {
  if (wasmModulo && typeof wasmModulo.calcular_excedentes === "function") {
    return wasmModulo.calcular_excedentes(consumoKwh, generacionKwh, precioImportacionMxn, precioExportacionMxn);
  }

  const consumoNeto = Math.max(0, consumoKwh - generacionKwh);
  const excedente = Math.max(0, generacionKwh - consumoKwh);

  const cargoEnergia = consumoNeto * precioImportacionMxn;
  const creditoExcedente = excedente * precioExportacionMxn;
  const balanceFinal = Math.max(0, cargoEnergia - creditoExcedente);

  return {
    consumoNetoKwh: Math.round(consumoNeto),
    excedenteKwh: Math.round(excedente),
    cargoEnergiaMxn: Math.round(cargoEnergia * 100) / 100,
    creditoExcedenteMxn: Math.round(creditoExcedente * 100) / 100,
    balanceFinalMxn: Math.round(balanceFinal * 100) / 100,
  };
}

export function sugerirPaneles(consumoMensualKwh: number, produccionPorPanelKwh: number): number {
  if (wasmModulo && typeof wasmModulo.sugerir_paneles === "function") {
    return wasmModulo.sugerir_paneles(consumoMensualKwh, produccionPorPanelKwh);
  }
  if (produccionPorPanelKwh <= 0) return 0;
  return Math.ceil((consumoMensualKwh * 0.95) / produccionPorPanelKwh);
}

export function calcularRoiAnios(costoSistemaMxn: number, ahorroAnualMxn: number): number {
  if (wasmModulo && typeof wasmModulo.calcular_roi_anios === "function") {
    return wasmModulo.calcular_roi_anios(costoSistemaMxn, ahorroAnualMxn);
  }
  if (ahorroAnualMxn <= 0) return 99;
  return Math.round((costoSistemaMxn / ahorroAnualMxn) * 10) / 10;
}

export function calcularMitigacionCo2Kg(generacionAnualKwh: number, factorEmision: number = 0.42): number {
  if (wasmModulo && typeof wasmModulo.calcular_mitigacion_co2_kg === "function") {
    return wasmModulo.calcular_mitigacion_co2_kg(generacionAnualKwh, factorEmision);
  }
  return Math.round(generacionAnualKwh * factorEmision);
}

export function evaluarAlertaDac(consumoMensualKwh: number, limiteMensualDac: number = 250) {
  const esRiesgoDac = consumoMensualKwh >= limiteMensualDac;
  return {
    esRiesgoDac,
    nivelConsumoKwh: consumoMensualKwh,
    limiteDacKwh: limiteMensualDac,
    mensajeAlerta: esRiesgoDac
      ? "🚨 ALERTA CFE: Tu consumo supera el umbral de la Tarifa Doméstica de Alto Consumo (DAC). Instalar paneles eliminará el costo de la tarifa más cara de México."
      : "✅ Consumo dentro de límites subsidiados CFE.",
  };
}

export function calcularGeneracionAjustadaPR(
  irradianciaGhi: number,
  tempMaxAmbienteC: number = 32,
  factorInclinacion: number = 1.0
): { pr: number; produccionMensualPorPanelKwh: number } {
  // Coeficiente de pérdidas de temperatura (STC 25°C, pérdida de 0.35%/°C)
  const tempCeldaPromedio = tempMaxAmbienteC + 25;
  const perdidaTemperaturaPct = (tempCeldaPromedio - 25) * 0.0035;
  
  // Performance Ratio base (pérdidas en inversor 4%, cableado 2%, suciedad 3%)
  const prBase = 0.82;
  const prEfectivo = Math.max(0.65, Math.min(0.88, (prBase - perdidaTemperaturaPct) * factorInclinacion));

  // Panel estándar ~550W (0.55 kWp)
  const produccionMensualKwh = irradianciaGhi * 30 * 0.55 * prEfectivo;
  
  return {
    pr: Math.round(prEfectivo * 100) / 100,
    produccionMensualPorPanelKwh: Math.round(produccionMensualKwh * 10) / 10,
  };
}

export function calcularProyeccion25Anios(
  generacionAnualInicialKwh: number,
  costoInicialMxn: number,
  ahorroAnualInicialMxn: number,
  tasaDegradacionAnual: number = 0.005,
  tasaInflacionTarifa: number = 0.045
) {
  let ahorroAcumulado = 0;
  let vpn = -costoInicialMxn;
  const flujoAnual = [];
  const tasaDescuentoVpn = 0.08; // 8% tasa de descuento anual

  for (let anio = 1; anio <= 25; anio++) {
    const factorDegradacion = Math.pow(1 - tasaDegradacionAnual, anio - 1);
    const generacionAnio = Math.round(generacionAnualInicialKwh * factorDegradacion);
    
    const factorTarifa = Math.pow(1 + tasaInflacionTarifa, anio - 1);
    const ahorroAnio = Math.round(ahorroAnualInicialMxn * factorDegradacion * factorTarifa);

    ahorroAcumulado += ahorroAnio;
    vpn += ahorroAnio / Math.pow(1 + tasaDescuentoVpn, anio);

    flujoAnual.push({
      anio,
      generacionKwh: generacionAnio,
      ahorroMxn: ahorroAnio,
    });
  }

  const tirEstimadaPct = Math.min(45, Math.max(8, Math.round(((ahorroAnualInicialMxn / (costoInicialMxn || 1)) * 100 + 5) * 10) / 10));

  return {
    ahorroAcumulado25AniosMxn: Math.round(ahorroAcumulado),
    valorPresenteNetoMxn: Math.round(vpn),
    tasaInternaRetornoPct: tirEstimadaPct,
    flujoAnual,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Generador de mensaje WhatsApp para cotización instantánea
// ─────────────────────────────────────────────────────────────────────────────

export interface DatosClienteWhatsapp {
  nombre?: string;
  ciudad?: string;
  consumoMensualKwh: number;
  panelesSugeridos: number;
  ahorroMensualMxn: number;
  ahorroAnualMxn: number;
  costoEstimadoMxn: number;
  roiAnios: number;
  generacionAnualKwh: number;
  irradianciaGhi: number;
}

/**
 * Genera una URL de WhatsApp con el resumen completo de la cotización solar.
 * @param numeroInstalador  Número del instalador en formato internacional (52XXXXXXXXXX)
 * @param datos             Resultado del análisis solar del cliente
 */
export function generarUrlWhatsappCotizacion(
  datos: DatosClienteWhatsapp,
  numeroInstalador: string = "5218001234567"
): string {
  const fmt = (n: number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

  const mensaje = [
    `*COTIZACION SOLAR — HELIOSCAN*`,
    ``,
    `*Cliente:* ${datos.nombre || "Propietario interesado"}`,
    `*Ciudad / Zona:* ${datos.ciudad || "Sin especificar"}`,
    ``,
    `*DATOS DE CONSUMO CFE*`,
    `• Consumo mensual: ${datos.consumoMensualKwh} kWh`,
    `• Radiacion NASA: ${datos.irradianciaGhi} kWh/m2/dia`,
    ``,
    `*SISTEMA SOLAR SUGERIDO*`,
    `• Paneles fotovoltaicos: ${datos.panelesSugeridos} modulos 550W`,
    `• Generacion anual: ${datos.generacionAnualKwh.toLocaleString("es-MX")} kWh`,
    ``,
    `*ANALISIS FINANCIERO*`,
    `• Ahorro mensual estimado: ${fmt(datos.ahorroMensualMxn)}`,
    `• Ahorro anual: ${fmt(datos.ahorroAnualMxn)}`,
    `• Inversion estimada: ${fmt(datos.costoEstimadoMxn)}`,
    `• Recuperacion de inversion: ${datos.roiAnios.toFixed(1)} anos`,
    ``,
    `Generado por HelioScan - Plataforma de estimacion solar con IA satelital y NASA POWER.`,
    `Solicito cotizacion formal para instalar este sistema en mi propiedad.`,
  ].join("\n");

  return `https://wa.me/${numeroInstalador}?text=${encodeURIComponent(mensaje)}`;
}

