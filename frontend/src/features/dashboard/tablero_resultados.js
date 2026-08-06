export class TableroResultados {
    contenedor;
    inicializar(idContenedor) {
        const el = document.getElementById(idContenedor);
        if (!el)
            throw new Error(`Contenedor ${idContenedor} no encontrado.`);
        this.contenedor = el;
    }
    renderizar(resultado) {
        const formateadorMoneda = new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
        });
        const { consumoMensualKwh, irradianciaGhiKwhM2Dia, panelesSugeridos, panelesDetectadosSat, generacionMensualKwh, generacionAnualKwh, costoMensualAntesMxn, costoMensualDespuesMxn, ahorroMensualMxn, ahorroAnualMxn, porcentajeAhorro, roiAnios, mitigacionCo2KgAnual, balanceExcedentes, } = resultado;
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

        ${resultado.alertaDac && resultado.alertaDac.esRiesgoDac ? `
        <!-- Banner de Alerta DAC -->
        <div style="margin-top: 20px; padding: 16px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 12px; color: #fca5a5;">
          <h4 style="margin: 0 0 6px 0; font-size: 1rem;">${resultado.alertaDac.mensajeAlerta}</h4>
          <p style="margin: 0; font-size: 0.88rem; opacity: 0.9;">
            Tu consumo de <strong>${resultado.alertaDac.nivelConsumoKwh} kWh/mes</strong> sobrepasa el límite subsidiado CFE (${resultado.alertaDac.limiteDacKwh} kWh).
          </p>
        </div>
        ` : ''}

        ${resultado.proyeccion25Anios ? `
        <!-- Proyección Financiera a 25 Años -->
        <div style="margin-top: 24px; padding: 20px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(51, 65, 85, 0.6); border-radius: 16px;">
          <h3 style="margin-top: 0; color: #f8fafc; font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
            📈 Proyección de Rendimiento a 25 Años (Performance Ratio PR: ${resultado.performanceRatio || 0.78})
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 12px;">
            <div style="background: rgba(30, 41, 59, 0.6); padding: 14px; border-radius: 10px; border-left: 4px solid #10b981;">
              <span style="display: block; font-size: 0.8rem; color: #94a3b8;">Ahorro Acumulado (25 años)</span>
              <strong style="font-size: 1.25rem; color: #34d399;">${formateadorMoneda.format(resultado.proyeccion25Anios.ahorroAcumulado25AniosMxn)}</strong>
            </div>
            <div style="background: rgba(30, 41, 59, 0.6); padding: 14px; border-radius: 10px; border-left: 4px solid #3b82f6;">
              <span style="display: block; font-size: 0.8rem; color: #94a3b8;">Valor Presente Neto (VPN)</span>
              <strong style="font-size: 1.25rem; color: #60a5fa;">${formateadorMoneda.format(resultado.proyeccion25Anios.valorPresenteNetoMxn)}</strong>
            </div>
            <div style="background: rgba(30, 41, 59, 0.6); padding: 14px; border-radius: 10px; border-left: 4px solid #f59e0b;">
              <span style="display: block; font-size: 0.8rem; color: #94a3b8;">Tasa Interna de Retorno (TIR)</span>
              <strong style="font-size: 1.25rem; color: #fbbf24;">${resultado.proyeccion25Anios.tasaInternaRetornoPct}%</strong>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
    }
}
