// ─────────────────────────────────────────────────────────────────────────────
//  Simulador de Banco de Baterías LiFePO4 — HelioScan
//  Calcula la autonomía, capacidad requerida y análisis financiero de baterías
//  de almacenamiento para sistemas fotovoltaicos residenciales en México.
// ─────────────────────────────────────────────────────────────────────────────

export interface ConfiguracionBateria {
  consumoDiarioKwh: number;       // Consumo diario promedio de la casa
  horasAutonomiaDeseadas: number; // Cuántas horas sin red quiere el usuario
  voltajeSistemaDC: number;       // 12V, 24V o 48V (default 48V)
  profundidadDescarga: number;    // DoD: 0.80 para LiFePO4
  eficienciaBateria: number;      // ~0.95 LiFePO4
  generacionSolarDiariaKwh: number; // Para calcular carga solar disponible
}

export interface ResultadoBateria {
  capacidadRequerida_kWh: number;
  capacidadRequerida_Ah: number;
  numeroBaterias: number;         // Unidades de batería de 100Ah/48V estándar
  autonomiaTotalHoras: number;
  autonomiaSinSolHoras: number;   // Horas que puede aguantar sin generación solar
  costoBateriasMxn: number;       // Estimado del banco completo
  ahorroApagonMensualMxn: number; // Valor de no tener apagones (estimado)
  roiBateriasAnios: number;
  generacionExcedente_kWh: number; // Energía que la batería puede absorber del excedente solar
  tiposBateria: TipoBateria[];
}

export interface TipoBateria {
  nombre: string;
  capacidad_kWh: number;
  voltaje: number;
  precioCadaUno_MXN: number;
  ciclosVida: number;
  garantiaAnios: number;
  costoPorKwhVida: number; // Costo total / (kWh * ciclos)
  recomendado: boolean;
}

/** Catálogo de baterías LiFePO4 representativas en México (precios 2025) */
const CATALOGO_BATERIAS: Omit<TipoBateria, "recomendado" | "costoPorKwhVida">[] = [
  {
    nombre: "Pylontech US2000C — 2.4 kWh LiFePO4",
    capacidad_kWh: 2.4,
    voltaje: 48,
    precioCadaUno_MXN: 18500,
    ciclosVida: 6000,
    garantiaAnios: 10,
  },
  {
    nombre: "Felicity Solar 5kWh — 5.0 kWh LiFePO4",
    capacidad_kWh: 5.0,
    voltaje: 48,
    precioCadaUno_MXN: 32000,
    ciclosVida: 5000,
    garantiaAnios: 8,
  },
  {
    nombre: "BYD Battery-Box Premium HVS 5.1kWh",
    capacidad_kWh: 5.1,
    voltaje: 51.2,
    precioCadaUno_MXN: 38500,
    ciclosVida: 6000,
    garantiaAnios: 10,
  },
  {
    nombre: "Huawei LUNA2000-5kWh — 5.0 kWh LiFePO4",
    capacidad_kWh: 5.0,
    voltaje: 48,
    precioCadaUno_MXN: 42000,
    ciclosVida: 6000,
    garantiaAnios: 10,
  },
];

/**
 * Calcula la capacidad y número de baterías requeridas para el sistema.
 */
export function calcularBancoBaterias(cfg: ConfiguracionBateria): ResultadoBateria {
  const { consumoDiarioKwh, horasAutonomiaDeseadas, profundidadDescarga, eficienciaBateria, generacionSolarDiariaKwh } = cfg;

  // Consumo por hora promedio de la casa
  const consumoPorHoraKwh = consumoDiarioKwh / 24;

  // Energía bruta requerida para cubrir las horas deseadas de autonomía
  const energiaBrutaRequeridaKwh = (consumoPorHoraKwh * horasAutonomiaDeseadas) / (profundidadDescarga * eficienciaBateria);

  // Excedente solar que la batería puede aprovechar
  const excedenteKwh = Math.max(0, generacionSolarDiariaKwh - consumoDiarioKwh);

  // Catálogo enriquecido con métricas financieras
  const tiposBateria: TipoBateria[] = CATALOGO_BATERIAS.map((bat, i) => {
    const costoPorKwhVida = bat.precioCadaUno_MXN / (bat.capacidad_kWh * bat.ciclosVida);
    return {
      ...bat,
      costoPorKwhVida: Math.round(costoPorKwhVida * 100) / 100,
      recomendado: i === 0, // Pylontech como default
    };
  });

  // Usar la batería recomendada para el dimensionamiento
  const bateriaRef = tiposBateria.find((b) => b.recomendado) || tiposBateria[0];
  const numeroBaterias = Math.ceil(energiaBrutaRequeridaKwh / (bateriaRef.capacidad_kWh * profundidadDescarga));
  const capacidadRealKwh = numeroBaterias * bateriaRef.capacidad_kWh * profundidadDescarga;
  const capacidadAh = (capacidadRealKwh * 1000) / cfg.voltajeSistemaDC;

  // Autonomía real con el banco dimensionado
  const autonomiaTotalHoras = capacidadRealKwh / consumoPorHoraKwh;
  // Sin sol: batería sola (sin recargar solar)
  const autonomiaSinSolHoras = Math.min(autonomiaTotalHoras, horasAutonomiaDeseadas);

  // Costo del banco completo
  const costoBateriasMxn = numeroBaterias * bateriaRef.precioCadaUno_MXN;

  // Valor estimado de apagones evitados: tarifa DAC (~$8 MXN/kWh no consumido por apagón)
  // Suponer 2 apagones/mes de 4 horas en zonas de calor extremo México
  const valorApagonEvitadoMxn = consumoPorHoraKwh * 4 * 2 * 8 * 12;
  const roiBateriasAnios = valorApagonEvitadoMxn > 0
    ? Math.round((costoBateriasMxn / valorApagonEvitadoMxn) * 10) / 10
    : 99;

  return {
    capacidadRequerida_kWh: Math.round(energiaBrutaRequeridaKwh * 10) / 10,
    capacidadRequerida_Ah: Math.round(capacidadAh),
    numeroBaterias,
    autonomiaTotalHoras: Math.round(autonomiaTotalHoras * 10) / 10,
    autonomiaSinSolHoras: Math.round(autonomiaSinSolHoras * 10) / 10,
    costoBateriasMxn,
    ahorroApagonMensualMxn: Math.round(valorApagonEvitadoMxn / 12),
    roiBateriasAnios,
    generacionExcedente_kWh: Math.round(excedenteKwh * 10) / 10,
    tiposBateria,
  };
}

/**
 * Genera el HTML del simulador de baterías para inyectar en el dashboard.
 */
export function renderizarSimuladorBaterias(resultado: ResultadoBateria): string {
  const fmt = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

  const filasBaterias = resultado.tiposBateria.map((b) => {
    const unidades = Math.ceil(resultado.capacidadRequerida_kWh / (b.capacidad_kWh * 0.8));
    const costoTotal = unidades * b.precioCadaUno_MXN;
    return `
      <div class="bateria-opcion${b.recomendado ? " bateria-recomendada" : ""}">
        <div class="bateria-opcion-nombre">
          ${b.recomendado ? `<span class="badge-recomendado">Recomendada</span>` : ""}
          <strong>${b.nombre}</strong>
        </div>
        <div class="bateria-opcion-specs">
          <span>${b.capacidad_kWh} kWh</span>
          <span>${b.voltaje}V</span>
          <span>${b.ciclosVida.toLocaleString("es-MX")} ciclos</span>
          <span>${b.garantiaAnios} años garantía</span>
        </div>
        <div class="bateria-opcion-precio">
          <span class="desglose-label">Unidades necesarias: <strong>${unidades}</strong></span>
          <span class="desglose-valor">${fmt.format(costoTotal)}</span>
        </div>
      </div>`;
  }).join("");

  return `
    <div class="simulador-baterias-contenedor">
      <div class="simulador-baterias-header">
        <div class="badge-solar-brillante" style="background: rgba(74,172,255,0.15); border-color: rgba(74,172,255,0.4); color: #4AACFF;">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align:-2px;margin-right:4px;">
              <rect x="1" y="6" width="22" height="14" rx="2"/><path d="M23 10H1M7 20v2M17 20v2"/><circle cx="12" cy="13" r="2" fill="currentColor"/>
            </svg>
            ALMACENAMIENTO LiFePO4
          </span>
        </div>
        <h3 class="titulo-dashboard" style="font-size:1.15rem;margin-top:0.5rem;">Banco de Baterías para Apagones CFE</h3>
        <p class="subtitulo-dashboard">Dimensionamiento automático basado en tu consumo y generación solar.</p>
      </div>

      <div class="grid-kpi-tarjetas" style="margin-top:1rem;">
        <div class="kpi-tarjeta" style="border-color: rgba(74,172,255,0.45);">
          <div class="kpi-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="#4AACFF" stroke-width="2" width="28" height="28">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M12 12v4M10 14h4"/>
            </svg>
          </div>
          <div class="kpi-contenido">
            <span class="kpi-etiqueta">Capacidad requerida</span>
            <h3 class="kpi-valor">${resultado.capacidadRequerida_kWh} <small>kWh</small></h3>
            <span class="kpi-subtexto">${resultado.capacidadRequerida_Ah} Ah @ 48V</span>
          </div>
        </div>
        <div class="kpi-tarjeta" style="border-color: rgba(252,139,38,0.45);">
          <div class="kpi-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FC8B26" stroke-width="2" width="28" height="28">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="kpi-contenido">
            <span class="kpi-etiqueta">Autonomía sin CFE</span>
            <h3 class="kpi-valor">${resultado.autonomiaSinSolHoras} <small>horas</small></h3>
            <span class="kpi-subtexto">${resultado.numeroBaterias} batería(s) LiFePO4</span>
          </div>
        </div>
        <div class="kpi-tarjeta" style="border-color: rgba(65,208,251,0.45);">
          <div class="kpi-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="#41D0FB" stroke-width="2" width="28" height="28">
              <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="kpi-contenido">
            <span class="kpi-etiqueta">Inversión en baterías</span>
            <h3 class="kpi-valor">${fmt.format(resultado.costoBateriasMxn)}</h3>
            <span class="kpi-subtexto">ROI estimado: ${resultado.roiBateriasAnios} años</span>
          </div>
        </div>
        <div class="kpi-tarjeta" style="border-color: rgba(247,157,66,0.45);">
          <div class="kpi-icono">
            <svg viewBox="0 0 24 24" fill="none" stroke="#F79D42" stroke-width="2" width="28" height="28">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div class="kpi-contenido">
            <span class="kpi-etiqueta">Excedente solar absorbido</span>
            <h3 class="kpi-valor">${resultado.generacionExcedente_kWh} <small>kWh/día</small></h3>
            <span class="kpi-subtexto">Energía que la batería captura</span>
          </div>
        </div>
      </div>

      <div class="panel-desglose-tecnico" style="margin-top:1.25rem;">
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20" style="vertical-align:-3px;margin-right:4px;">
            <rect x="1" y="6" width="22" height="14" rx="2"/><path d="M23 10H1"/>
          </svg>
          Comparativa de Modelos LiFePO4 Disponibles en México
        </h3>
        <div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem;">
          ${filasBaterias}
        </div>
      </div>
    </div>`;
}
