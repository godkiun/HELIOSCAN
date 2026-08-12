import jsPDF from "jspdf";
import { ResultadoAnalisisSolar } from "../features/solar-calculator/tipos";
import { EstructuraTarifaResidencial } from "../features/solar-calculator/cliente_wasm";

// ─────────────────────────────────────────────────────────────────────────────
//  Paleta de impresión — alto contraste sobre fondo blanco
//  Nada de neón: azul marino, naranja solar sólido, grises corporativos
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  naranjaOscuro:  [210, 100, 20]   as [number, number, number], // Encabezado naranja solar
  naranjaClaro:   [253, 200, 140]  as [number, number, number], // Fondo suave naranja
  azulMarino:     [18,  50,  90]   as [number, number, number], // Títulos de sección
  azulMedio:      [40,  95, 165]   as [number, number, number], // Bordes y etiquetas
  azulPalo:       [210, 228, 250]  as [number, number, number], // Fondo suave azul
  verdeSolar:     [22,  130, 70]   as [number, number, number], // Positivo / ahorro
  rojoSuave:      [180, 40,  40]   as [number, number, number], // Negativo / costo
  grisFondo:      [248, 249, 250]  as [number, number, number], // Fondos alternos
  grisLinea:      [220, 225, 232]  as [number, number, number], // Líneas separadoras
  grisTexto:      [90,  100, 115]  as [number, number, number], // Texto secundario
  negro:          [25,  30,  38]   as [number, number, number], // Texto principal
  blanco:         [255, 255, 255]  as [number, number, number], // Sobre fondos oscuros
};

export interface OpcionesPdfHelioScan {
  resultado: ResultadoAnalisisSolar;
  estructuraTarifa?: EstructuraTarifaResidencial;
  nombreCliente?: string;
  ciudadCliente?: string;
}

export function generarReportePdfHelioScan(
  resultado: ResultadoAnalisisSolar,
  _canvasBlobUrl?: string,
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

  // ── ENCABEZADO ─────────────────────────────────────────────────────────────
  // Banda naranja oscuro completa
  doc.setFillColor(...C.naranjaOscuro);
  doc.rect(0, 0, 210, 30, "F");

  // Banda azul marino delgada debajo
  doc.setFillColor(...C.azulMarino);
  doc.rect(0, 30, 210, 8, "F");

  // Logo y nombre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...C.blanco);
  doc.text("HELIOSCAN", 12, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(255, 225, 185);
  doc.text("Plataforma de Estimación Solar Fotovoltaica · NASA POWER · IA Satelital · CFE Net Metering", 12, 22);

  // Folio y fecha (banda azul)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.blanco);
  doc.text(`Folio: ${folio}`, 12, 36);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha de emisión: ${hoy}   |   Cliente: ${nombreCliente}   |   Localidad: ${ciudadCliente}`, 55, 36);

  // ── SUBTÍTULO DEL DOCUMENTO ────────────────────────────────────────────────
  let y = 47;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...C.azulMarino);
  doc.text("Reporte Ejecutivo de Viabilidad Solar Fotovoltaica", 12, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...C.grisTexto);
  doc.text(
    "Estimación técnica basada en radiación solar GHI de la NASA, detección por visión artificial y estructura tarifaria CFE vigente 2025.",
    12, y + 6
  );
  y += 14;

  // ── SECCIÓN 1: KPIs Principales ────────────────────────────────────────────
  // Encabezado de sección
  doc.setFillColor(...C.azulMarino);
  doc.rect(12, y, 186, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.blanco);
  doc.text("1.  RESUMEN EJECUTIVO DE AHORRO E INVERSIÓN", 16, y + 5.5);
  y += 11;

  // 4 tarjetas KPI con fondo claro y borde de color
  const kpis: { label: string; valor: string; subtexto: string; borde: [number,number,number]; ic: [number,number,number] }[] = [
    {
      label:    "Ahorro Anual Estimado",
      valor:    fmt.format(resultado.ahorroAnualMxn),
      subtexto: `${resultado.porcentajeAhorro.toFixed(0)}% menos en tu recibo`,
      borde:    C.verdeSolar,
      ic:       C.verdeSolar,
    },
    {
      label:    "Nuevo Pago Mensual CFE",
      valor:    fmt.format(resultado.costoMensualDespuesMxn) + " /mes",
      subtexto: `Antes: ${fmt.format(resultado.costoMensualAntesMxn)} /mes`,
      borde:    C.azulMedio,
      ic:       C.azulMedio,
    },
    {
      label:    "Recuperación de Inversión",
      valor:    `${resultado.roiAnios.toFixed(1)} años`,
      subtexto: `Inversión: ${fmt.format(resultado.costoNetoSistemaMxn ?? 0)}`,
      borde:    C.naranjaOscuro,
      ic:       C.naranjaOscuro,
    },
    {
      label:    "CO₂ Evitado / Año",
      valor:    `${resultado.mitigacionCo2KgAnual.toLocaleString("es-MX")} kg`,
      subtexto: "Emisiones que dejas de generar",
      borde:    [30, 140, 70] as [number,number,number],
      ic:       [30, 140, 70] as [number,number,number],
    },
  ];

  const kW = 44;
  kpis.forEach((k, i) => {
    const kx = 12 + i * (kW + 2);
    // Fondo gris muy claro
    doc.setFillColor(...C.grisFondo);
    doc.roundedRect(kx, y, kW, 26, 2, 2, "F");
    // Borde lateral izquierdo de color
    doc.setFillColor(...k.borde);
    doc.rect(kx, y, 2.5, 26, "F");
    // Línea de borde general
    doc.setDrawColor(...C.grisLinea);
    doc.setLineWidth(0.3);
    doc.roundedRect(kx, y, kW, 26, 2, 2, "S");

    // Etiqueta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...C.grisTexto);
    doc.text(k.label, kx + 5, y + 7);

    // Valor principal
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...k.ic);
    doc.text(k.valor, kx + 5, y + 16);

    // Subtexto
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.grisTexto);
    doc.text(k.subtexto, kx + 5, y + 23);
  });
  y += 34;

  // ── SECCIÓN 2: Comparativa Antes vs Después ─────────────────────────────
  doc.setFillColor(...C.azulMarino);
  doc.rect(12, y, 186, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.blanco);
  doc.text("2.  COMPARATIVA ANTES VS DESPUÉS — CFE NET METERING", 16, y + 5.5);
  y += 10;

  // Header de tabla
  doc.setFillColor(...C.azulPalo);
  doc.rect(12, y, 186, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.azulMarino);
  ["Concepto", "Sin paneles solares", "Con sistema fotovoltaico"].forEach((h, i) => {
    doc.text(h, 14 + i * 62, y + 5);
  });
  y += 8;

  const filasTabla = [
    ["Consumo mensual", `${resultado.consumoMensualKwh} kWh`, `${resultado.generacionMensualKwh.toFixed(0)} kWh generados`],
    ["Factura mensual CFE", fmt.format(resultado.costoMensualAntesMxn), fmt.format(resultado.costoMensualDespuesMxn)],
    ["Gasto anual total", fmt.format(resultado.costoMensualAntesMxn * 12), fmt.format(resultado.costoMensualDespuesMxn * 12)],
    ["Energía exportada a red", "—", `${resultado.balanceExcedentes.excedenteKwh.toFixed(0)} kWh`],
    ["Crédito por excedente solar", "—", fmt.format(resultado.balanceExcedentes.creditoExcedenteMxn)],
    ["CO₂ evitado al año", "—", `${resultado.mitigacionCo2KgAnual.toLocaleString("es-MX")} kg`],
  ];

  filasTabla.forEach((fila, ri) => {
    // Fondos alternados claro/blanco
    doc.setFillColor(ri % 2 === 0 ? 255 : 248, ri % 2 === 0 ? 255 : 249, ri % 2 === 0 ? 255 : 250);
    doc.rect(12, y, 186, 7, "F");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...C.negro);
    doc.text(fila[0], 14, y + 5);

    // Col. "Sin paneles" en rojo suave
    doc.setTextColor(...C.rojoSuave);
    doc.setFont("helvetica", "bold");
    doc.text(fila[1], 76, y + 5);

    // Col. "Con paneles" en verde
    doc.setTextColor(...C.verdeSolar);
    doc.text(fila[2], 138, y + 5);

    // Línea separadora
    doc.setDrawColor(...C.grisLinea);
    doc.setLineWidth(0.2);
    doc.line(12, y + 7, 198, y + 7);
    y += 7;
  });

  // Borde exterior de la tabla
  doc.setDrawColor(...C.azulMedio);
  doc.setLineWidth(0.5);
  doc.rect(12, y - filasTabla.length * 7, 186, filasTabla.length * 7, "S");
  y += 8;

  // ── SECCIÓN 3: Dictamen Fotovoltaico e IA ─────────────────────────────────
  doc.setFillColor(...C.azulMarino);
  doc.rect(12, y, 186, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...C.blanco);
  doc.text("3.  DICTAMEN FOTOVOLTAICO E INTELIGENCIA SATELITAL", 16, y + 5.5);
  y += 11;

  const itemsDictamen = [
    [`Radiación solar GHI (NASA POWER):`, `${resultado.irradianciaGhiKwhM2Dia} kWh/m²/día`],
    [`Paneles totales requeridos:`,        `${resultado.panelesSugeridos} módulos de 550 Wp (bifaciales monocristalinos)`],
    [`Paneles detectados por IA satelital:`,`${resultado.panelesDetectadosSat} panel(es) ya instalados en la propiedad`],
    [`Módulos adicionales a instalar:`,    `${resultado.panelesAdicionalesFaltantes ?? 0} unidad(es) nuevas`],
    [`Inversión neta estimada del sistema:`,fmt.format(resultado.costoNetoSistemaMxn ?? 0)],
    [`Performance Ratio (PR) estimado:`,   `${((resultado.performanceRatio ?? 0.78) * 100).toFixed(0)}%  (pérdidas temperatura + inversor + cableado)`],
    [`Generación anual proyectada:`,        `${resultado.generacionAnualKwh.toLocaleString("es-MX")} kWh/año`],
  ];

  doc.setFillColor(...C.grisFondo);
  doc.roundedRect(12, y, 186, itemsDictamen.length * 7 + 4, 2, 2, "F");
  doc.setDrawColor(...C.grisLinea);
  doc.setLineWidth(0.3);
  doc.roundedRect(12, y, 186, itemsDictamen.length * 7 + 4, 2, 2, "S");
  y += 5;

  itemsDictamen.forEach(([label, valor]) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.grisTexto);
    doc.text(label, 16, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.negro);
    doc.text(valor, 95, y);
    y += 7;
  });
  y += 7;

  // ── SECCIÓN 4: Proyección a 25 Años ───────────────────────────────────────
  if (resultado.proyeccion25Anios) {
    doc.setFillColor(...C.azulMarino);
    doc.rect(12, y, 186, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.blanco);
    doc.text("4.  PROYECCIÓN FINANCIERA A 25 AÑOS", 16, y + 5.5);
    y += 11;

    const p25 = resultado.proyeccion25Anios;
    const metricas25: { label: string; valor: string; color: [number,number,number] }[] = [
      { label: "Ahorro Acumulado\n(25 años)", valor: fmt.format(p25.ahorroAcumulado25AniosMxn), color: C.verdeSolar },
      { label: "Valor Presente Neto\n(VPN a 8% tasa de descuento)", valor: fmt.format(p25.valorPresenteNetoMxn), color: C.azulMedio },
      { label: "Tasa Interna de\nRetorno (TIR)", valor: `${p25.tasaInternaRetornoPct}%`, color: C.naranjaOscuro },
    ];

    const mW = 59;
    metricas25.forEach((m, i) => {
      const mx = 12 + i * (mW + 2.5);

      doc.setFillColor(...C.grisFondo);
      doc.roundedRect(mx, y, mW, 22, 2, 2, "F");
      doc.setFillColor(...m.color);
      doc.rect(mx, y, 2.5, 22, "F");
      doc.setDrawColor(...C.grisLinea);
      doc.setLineWidth(0.3);
      doc.roundedRect(mx, y, mW, 22, 2, 2, "S");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...C.grisTexto);
      const lineas = m.label.split("\n");
      lineas.forEach((ln, li) => doc.text(ln, mx + 5, y + 6 + li * 4.5));

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...m.color);
      doc.text(m.valor, mx + 5, y + 18);
    });
    y += 30;
  }

  // ── PIE DE PÁGINA ──────────────────────────────────────────────────────────
  const yPie = 285;

  // Línea separadora
  doc.setDrawColor(...C.grisLinea);
  doc.setLineWidth(0.4);
  doc.line(12, yPie - 4, 198, yPie - 4);

  // Logo textual pequeño en naranja
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...C.naranjaOscuro);
  doc.text("HELIOSCAN", 12, yPie + 1);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...C.grisTexto);
  doc.text(
    "Reporte generado con motor de cálculo Rust/WebAssembly, detección YOLOv8 y datos de irradiancia NASA POWER.",
    40, yPie + 1
  );
  doc.text(
    `Folio ${folio}  ·  Documento estimativo — sujeto a inspección técnica en sitio por instalador certificado CFE.`,
    12, yPie + 6
  );

  doc.save(`HelioScan_${folio}.pdf`);
}
