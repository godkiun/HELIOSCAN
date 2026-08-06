import jsPDF from "jspdf";
export function generarReportePdfHelioScan(resultado, canvasBlobUrl) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });
    const formateadorMoneda = new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 0,
    });
    // Encabezado
    doc.setFillColor(38, 33, 33);
    doc.rect(0, 0, 210, 35, "F");
    doc.setTextColor(228, 213, 183);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("HELIOSCAN", 15, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte Ejecutivo de Viabilidad Solar Fotovoltaica CFE", 15, 26);
    // Fecha
    const hoy = new Date().toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    doc.setTextColor(200, 200, 200);
    doc.text(`Fecha: ${hoy}`, 155, 26);
    // Sección 1: Resumen Ejecutivo KPIs
    let y = 45;
    doc.setTextColor(38, 33, 33);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("1. Resumen de Ahorro e Inversión", 15, y);
    y += 8;
    doc.setFillColor(245, 243, 238);
    doc.roundedRect(15, y, 180, 40, 3, 3, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Consumo Mensual:", 22, y + 10);
    doc.setFont("helvetica", "bold");
    doc.text(`${resultado.consumoMensualKwh} kWh`, 65, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text("Radiación Solar NASA:", 110, y + 10);
    doc.setFont("helvetica", "bold");
    doc.text(`${resultado.irradianciaGhiKwhM2Dia} kWh/m²/día`, 155, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text("Factura CFE Actual:", 22, y + 20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(180, 40, 40);
    doc.text(`${formateadorMoneda.format(resultado.costoMensualAntesMxn)}/mes`, 65, y + 20);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Nuevo Pago CFE Est.:", 110, y + 20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 140, 60);
    doc.text(`${formateadorMoneda.format(resultado.costoMensualDespuesMxn)}/mes`, 155, y + 20);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Ahorro Anual Estimado:", 22, y + 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 140, 60);
    doc.text(`${formateadorMoneda.format(resultado.ahorroAnualMxn)} (${resultado.porcentajeAhorro.toFixed(0)}%)`, 65, y + 30);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text("Retorno de Inversión (ROI):", 110, y + 30);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(38, 33, 33);
    doc.text(`${resultado.roiAnios.toFixed(1)} años`, 155, y + 30);
    // Sección 2: Plan Fotovoltaico e IA
    y += 50;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Dictamen Fotovoltaico e Inteligencia Satelital", 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Paneles Totales Requeridos: ${resultado.panelesSugeridos} módulos (~550W c/u)`, 22, y + 5);
    doc.text(`Paneles Detectados por IA Satelital: ${resultado.panelesDetectadosSat} módulo(s) existentes`, 22, y + 12);
    doc.text(`Paneles Adicionales Sugeridos: ${resultado.panelesAdicionalesFaltantes || 0} módulo(s) a instalar`, 22, y + 19);
    doc.text(`Inversión Neta Estimada: ${formateadorMoneda.format(resultado.costoNetoSistemaMxn || 0)}`, 22, y + 26);
    // Sección 3: Impacto Ecológico
    y += 38;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. Impacto Ecológico y Mitigación de CO2", 15, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generación Solar Anual: ${resultado.generacionAnualKwh.toLocaleString("es-MX")} kWh/año`, 22, y + 5);
    doc.text(`Emisiones Evitadas de CO2: ${resultado.mitigacionCo2KgAnual.toLocaleString("es-MX")} kg CO₂ al año`, 22, y + 12);
    // Pie de página
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text("HelioScan © 2026 — Generado con tecnología Rust/Wasm, PyTorch YOLOv8 y NASA POWER API", 15, 285);
    doc.save("Reporte_Viabilidad_Solar_HelioScan.pdf");
}
