import { ResultadoAnalisisSolar } from "../solar-calculator/tipos";

export class TableroResultados {
  private contenedor!: HTMLElement;

  public inicializar(idContenedor: string): void {
    const el = document.getElementById(idContenedor);
    if (!el) throw new Error(`Contenedor ${idContenedor} no encontrado.`);
    this.contenedor = el;
  }

  public renderizar(resultado: ResultadoAnalisisSolar): void {
    const formateadorMoneda = new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      maximumFractionDigits: 0,
    });

    const {
      consumoMensualKwh,
      irradianciaGhiKwhM2Dia,
      panelesSugeridos,
      panelesDetectadosSat,
      generacionMensualKwh,
      generacionAnualKwh,
      costoMensualAntesMxn,
      costoMensualDespuesMxn,
      ahorroMensualMxn,
      ahorroAnualMxn,
      porcentajeAhorro,
      roiAnios,
      mitigacionCo2KgAnual,
      balanceExcedentes,
    } = resultado;

    const costoAnualAntes = costoMensualAntesMxn * 12;
    const costoAnualDespues = costoMensualDespuesMxn * 12;

    this.contenedor.innerHTML = `
      <div class="dashboard-contenedor-animado">
        <!-- Encabezado del Dashboard -->
        <div class="dashboard-encabezado">
          <div class="badge-solar-brillante">
            <span>⚡ PROYECCIÓN DE AHORRO SOLAR</span>
          </div>
          <h2 class="titulo-dashboard">Comparativa de tu recibo CFE</h2>
          <p class="subtitulo-dashboard">
            Cálculo estimado con radiación solar de la NASA (<strong>${irradianciaGhiKwhM2Dia} kWh/m²/día</strong>) y esquema de Net Metering CFE.
          </p>
        </div>

        <!-- Tarjetas KPI Principales -->
        <div class="grid-kpi-tarjetas">
          <div class="kpi-tarjeta kpi-destacado-ahorro">
            <div class="kpi-icono">💰</div>
            <div class="kpi-contenido">
              <span class="kpi-etiqueta">Ahorro anual estimado</span>
              <h3 class="kpi-valor">${formateadorMoneda.format(ahorroAnualMxn)}</h3>
              <span class="kpi-badge-porcentaje">${porcentajeAhorro.toFixed(0)}% menos en tu recibo</span>
            </div>
          </div>

          <div class="kpi-tarjeta">
            <div class="kpi-icono">⏱️</div>
            <div class="kpi-contenido">
              <span class="kpi-etiqueta">Recuperación de inversión</span>
              <h3 class="kpi-valor">${roiAnios.toFixed(1)} <small>años</small></h3>
              <span class="kpi-subtexto">Retorno estimado</span>
            </div>
          </div>

          <div class="kpi-tarjeta">
            <div class="kpi-icono">🌱</div>
            <div class="kpi-contenido">
              <span class="kpi-etiqueta">Impacto ambiental</span>
              <h3 class="kpi-valor">${mitigacionCo2KgAnual.toLocaleString("es-MX")} <small>kg CO₂/año</small></h3>
              <span class="kpi-subtexto">Emisiones evitadas</span>
            </div>
          </div>

          <div class="kpi-tarjeta">
            <div class="kpi-icono">☀️</div>
            <div class="kpi-contenido">
              <span class="kpi-etiqueta">Paneles recomendados</span>
              <h3 class="kpi-valor">${panelesSugeridos} <small>paneles</small></h3>
              <span class="kpi-subtexto">
                ${panelesDetectadosSat > 0 ? `Se detectaron ${panelesDetectadosSat} paneles existentes.` : 'Techo listo para instalación.'}
              </span>
            </div>
          </div>
        </div>

        <!-- Comparativa Antes vs Después -->
        <div class="grid-comparativo-antes-despues">
          <!-- Tarjeta Antes -->
          <div class="tarjeta-comparativa estado-antes">
            <div class="comparativa-header">
              <span class="badge-estado badge-rojo">Sin paneles solares</span>
              <h3>Tu pago actual</h3>
            </div>
            <div class="comparativa-body">
              <div class="metrica-fila">
                <span>Consumo mensual:</span>
                <strong>${consumoMensualKwh} kWh</strong>
              </div>
              <div class="metrica-fila">
                <span>Factura estimada:</span>
                <span class="precio-alto">${formateadorMoneda.format(costoMensualAntesMxn)}</span>
              </div>
              <div class="metrica-fila">
                <span>Gasto anual actual:</span>
                <strong>${formateadorMoneda.format(costoAnualAntes)}</strong>
              </div>
              <div class="barra-progreso-contenedor">
                <div class="barra-progreso barra-roja" style="width: 100%;"></div>
              </div>
            </div>
          </div>

          <!-- Flecha de Transformación -->
          <div class="transformacion-flecha">
            <span>➔</span>
          </div>

          <!-- Tarjeta Después -->
          <div class="tarjeta-comparativa estado-despues">
            <div class="comparativa-header">
              <span class="badge-estado badge-verde">Con paneles solares</span>
              <h3>Tu pago estimado</h3>
            </div>
            <div class="comparativa-body">
              <div class="metrica-fila">
                <span>Generación solar:</span>
                <strong class="texto-verde">${generacionMensualKwh.toFixed(0)} kWh/mes</strong>
              </div>
              <div class="metrica-fila">
                <span>Nuevo pago mensual:</span>
                <span class="precio-bajo">${formateadorMoneda.format(costoMensualDespuesMxn)}</span>
              </div>
              <div class="metrica-fila">
                <span>Gasto anual proyectado:</span>
                <strong>${formateadorMoneda.format(costoAnualDespues)}</strong>
              </div>
              <div class="barra-progreso-contenedor">
                <div class="barra-progreso barra-verde" style="width: ${Math.max(5, (100 - porcentajeAhorro)).toFixed(0)}%;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Desglose Técnico y Tarifario -->
        <div class="panel-desglose-tecnico">
          <h3>📊 Detalle del balance CFE (Net Metering)</h3>
          <div class="tabla-desglose">
            <div class="desglose-item">
              <span class="desglose-label">Generación solar anual:</span>
              <span class="desglose-valor">${generacionAnualKwh.toLocaleString("es-MX")} kWh</span>
            </div>
            <div class="desglose-item">
              <span class="desglose-label">Energía tomada de CFE:</span>
              <span class="desglose-valor">${balanceExcedentes.consumoNetoKwh.toFixed(1)} kWh</span>
            </div>
            <div class="desglose-item">
              <span class="desglose-label">Energía enviada a la red CFE:</span>
              <span class="desglose-valor">${balanceExcedentes.excedenteKwh.toFixed(1)} kWh</span>
            </div>
            <div class="desglose-item">
              <span class="desglose-label">Saldo a favor por energía exportada:</span>
              <span class="desglose-valor texto-verde">${formateadorMoneda.format(balanceExcedentes.creditoExcedenteMxn)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

