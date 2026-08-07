import jsPDF from "jspdf";
import { ResultadoAnalisisSolar } from "../features/solar-calculator/tipos";
import { EstructuraTarifaResidencial } from "../features/solar-calculator/cliente_wasm";

export interface OpcionesPdfHelioScan {
  resultado: ResultadoAnalisisSolar;
  estructuraTarifa?: EstructuraTarifaResidencial;
  nombreCliente?: string;
  ciudadCliente?: string;
  canvasDataUrl?: string; // Data URL del canvas HUD si está disponible
}

export function generarReportePdfHelioScan(
  resultado: ResultadoAnalisisSolar,
  _canvasBlobUrl?: string, // Mantener compatibilidad backward
  opciones?: Partial<OpcionesPdfHelioScan>
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const fmt = new Intl.NumberFormat("es-MX", {
    style: "currency", currency: "MXN", maximumFractionDigits: 0,
  });

  const hoy = new Date().toLocaleDateString("es-MX", {
    year: "numeric", month: "long", day: "numeric",
  });
  const folio = `HS-${Date.now().toString(36).toUpperCase().slice(-6)}`;
  const nombreCliente = opciones?.nombreCliente || "Propietario Interesado";
  const ciudadCliente = opciones?.ciudadCliente || "México";

  // ── Fondo oscuro header ────────────────────────────────────────────────────
  doc.setFillColor(11, 17, 32);           // #0B1120
  doc.rect(0, 0, 210, 42, "F");

  // Banda naranja solar lateral izquierda
  doc.setFillColor(252, 139, 38);         // #FC8B26
  doc.rect(0, 0, 5, 42, "F");

  // Logo y título
  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("HELIOSCAN", 12, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Plataforma Inteligente de Estimación Solar — NASA POWER · YOLOv8 · CFE Net Metering", 12, 23);

  // Datos del reporte
  doc.setFontSize(8);
  doc.text(`Folio: ${folio}`, 12, 32);
  doc.text(`Fecha: ${hoy}`, 12, 37);

  // Cliente
  doc.setTextColor(252, 139, 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text(`Cliente: ${nombreCliente}  |  Localidad: ${ciudadCliente}`, 90, 32);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Este documento es una estimación técnica. Sujeta a inspección física.", 90, 37);

  // ── Sección 1: KPIs Principales ───────────────────────────────────────────
  let y = 50;

  // Título de sección
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(10, y, 190, 7, 2, 2, "F");
  doc.setTextColor(65, 208, 251);  // #41D0FB
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("1. RESUMEN EJECUTIVO DE AHORRO E INVERSIÓN", 14, y + 5);
  y += 11;

  // 4 tarjetas KPI en línea
  const kpis = [
    { label: "Ahorro Anual Estimado", valor: fmt.format(resultado.ahorroAnualMxn), color: [16, 185, 129] as [number, number, number] },
    { label: "Nuevo Pago Mensual CFE", valor: fmt.format(resultado.costoMensualDespuesMxn) + "/mes", color: [82, 154, 252] as [number, number, number] },
    { label: "Retorno de Inversión", valor: `${resultado.roiAnios.toFixed(1)} años`, color: [247, 157, 66] as [number, number, number] },
    { label: "Reducción en Recibo", valor: `${resultado.porcentajeAhorro.toFixed(0)}%`, color: [65, 208, 251] as [number, number, number] },
  ];

  const kpiW = 44;
  kpis.forEach((kpi, i) => {
    const kx = 10 + i * (kpiW + 3);
    doc.setFillColor(20, 30, 48);
    doc.roundedRect(kx, y, kpiW, 22, 2, 2, "F");
    doc.setDrawColor(...kpi.color);
    doc.setLineWidth(0.5);
    doc.roundedRect(kx, y, kpiW, 22, 2, 2, "S");

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, kx + 3, y + 7);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...kpi.color);
    doc.text(kpi.valor, kx + 3, y + 16);
  });
  y += 28;

  // ── Sección 2: Comparativa Antes vs Después ───────────────────────────────
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(10, y, 190, 7, 2, 2, "F");
  doc.setTextColor(65, 208, 251);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("2. COMPARATIVA ANTES VS DESPUÉS (CFE NET METERING)", 14, y + 5);
  y += 11;

  // Tabla comparativa
  const colW = 60;
  const headers = ["Concepto", "Sin paneles solares", "Con sistema fotovoltaico"];
  const rows = [
    ["Consumo mensual", `${resultado.consumoMensualKwh} kWh`, `${resultado.generacionMensualKwh.toFixed(0)} kWh generados`],
    ["Factura mensual CFE", fmt.format(resultado.costoMensualAntesMxn), fmt.format(resultado.costoMensualDespuesMxn)],
    ["Gasto anual total", fmt.format(resultado.costoMensualAntesMxn * 12), fmt.format(resultado.costoMensualDespuesMxn * 12)],
    ["Energía enviada red", "—", `${resultado.balanceExcedentes.excedenteKwh.toFixed(0)} kWh`],
    ["Crédito excedente", "—", fmt.format(resultado.balanceExcedentes.creditoExcedenteMxn)],
    ["CO₂ evitado/año", "—", `${resultado.mitigacionCo2KgAnual.toLocaleString("es-MX")} kg`],
  ];

  // Header de tabla
  doc.setFillColor(11, 17, 32);
  doc.rect(10, y, 190, 8, "F");
  doc.setTextColor(252, 139, 38);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  headers.forEach((h, i) => doc.text(h, 13 + i * colW, y + 5.5));
  y += 9;

  rows.forEach((row, ri) => {
    doc.setFillColor(ri % 2 === 0 ? 20 : 25, ri % 2 === 0 ? 30 : 35, ri % 2 === 0 ? 48 : 55);
    doc.rect(10, y, 190, 7, "F");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.setFontSize(7.5);
    doc.text(row[0], 13, y + 5);
    doc.setTextColor(239, 100, 100);
    doc.text(row[1], 13 + colW, y + 5);
    doc.setTextColor(52, 211, 153);
    doc.text(row[2], 13 + colW * 2, y + 5);
    y += 7;
  });
  y += 8;

  // ── Sección 3: Dictamen Fotovoltaico ─────────────────────────────────────
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(10, y, 190, 7, 2, 2, "F");
  doc.setTextColor(65, 208, 251);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("3. DICTAMEN FOTOVOLTAICO E INTELIGENCIA SATELITAL", 14, y + 5);
  y += 11;

  const itemsDictamen = [
    `Radiación solar GHI (NASA POWER): ${resultado.irradianciaGhiKwhM2Dia} kWh/m²/día`,
    `Paneles totales requeridos: ${resultado.panelesSugeridos} módulos de 550 Wp`,
    `Paneles detectados por IA satelital: ${resultado.panelesDetectadosSat} panel(es) existentes`,
    `Paneles adicionales a instalar: ${resultado.panelesAdicionalesFaltantes ?? 0} módulo(s)`,
    `Inversión neta estimada: ${fmt.format(resultado.costoNetoSistemaMxn ?? 0)}`,
    `Performance Ratio (PR) estimado: ${((resultado.performanceRatio ?? 0.78) * 100).toFixed(0)}%`,
    `Generación anual proyectada: ${resultado.generacionAnualKwh.toLocaleString("es-MX")} kWh/año`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  itemsDictamen.forEach((item) => {
    doc.setTextColor(148, 163, 184);
    doc.text("  •  ", 12, y);
    doc.setTextColor(203, 213, 225);
    doc.text(item, 20, y);
    y += 6;
  });
  y += 5;

  // ── Sección 4: Proyección Financiera 25 Años ─────────────────────────────
  if (resultado.proyeccion25Anios) {
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(10, y, 190, 7, 2, 2, "F");
    doc.setTextColor(65, 208, 251);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("4. PROYECCIÓN FINANCIERA A 25 AÑOS", 14, y + 5);
    y += 11;

    const p25 = resultado.proyeccion25Anios;
    const metricas25 = [
      ["Ahorro acumulado (25 años)", fmt.format(p25.ahorroAcumulado25AniosMxn), [52, 211, 153] as [number, number, number]],
      ["Valor Presente Neto (VPN)", fmt.format(p25.valorPresenteNetoMxn), [96, 165, 250] as [number, number, number]],
      ["Tasa Interna de Retorno (TIR)", `${p25.tasaInternaRetornoPct}%`, [251, 191, 36] as [number, number, number]],
    ] as [string, string, [number, number, number]][];

    metricas25.forEach(([label, valor, color]) => {
      doc.setFillColor(20, 30, 48);
      doc.roundedRect(10, y, 59, 16, 2, 2, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(label, 13, y + 6);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...color);
      doc.text(valor, 13, y + 13);
      y += 0; // se pintarán en columnas
    });

    // Pintarlos en fila de 3 columnas
    y -= 0; // ya avanzamos 0 en el forEach
    let cx = 10;
    metricas25.forEach(([label, valor, color]) => {
      doc.setFillColor(20, 30, 48);
      doc.roundedRect(cx, y, 60, 18, 2, 2, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(label, cx + 3, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...color);
      doc.text(valor, cx + 3, y + 14);
      cx += 65;
    });
    y += 26;
  }

  // ── Pie de Página ────────────────────────────────────────────────────────
  const yPie = 285;
  doc.setFillColor(11, 17, 32);
  doc.rect(0, yPie - 5, 210, 15, "F");
  doc.setFillColor(252, 139, 38);
  doc.rect(0, yPie - 5, 5, 15, "F");

  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(
    "HelioScan © 2026 — Reporte generado con IA Satelital YOLOv8, Motor CFE Rust/Wasm y NASA POWER API.",
    12, yPie + 2
  );
  doc.text(
    `Folio: ${folio}  |  Documento de carácter estimativo, sujeto a inspección técnica en sitio.`,
    12, yPie + 7
  );

  doc.save(`HelioScan_Reporte_${folio}.pdf`);
}
