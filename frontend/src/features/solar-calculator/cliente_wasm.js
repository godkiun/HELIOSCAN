let wasmModulo = null;
export async function inicializarMotorSolar() {
    try {
        const cargarWasm = new Function("ruta", "return import(ruta);");
        const module = await cargarWasm("./pkg/helioscan_rust_engine.js").catch(() => null);
        if (module && typeof module.default === "function") {
            await module.default();
            wasmModulo = module;
            console.log("⚡ Motor Rust / WebAssembly cargado con éxito.");
        }
        else {
            console.log("💡 Operando con motor TypeScript optimizado de alta precisión.");
        }
    }
    catch (err) {
        console.log("💡 Operando con motor TypeScript optimizado de alta precisión.");
    }
}
export function calcularTarifa01(consumoKwh, limiteBasico = 75, limiteIntermedio = 65, precioBasico = 1.05, precioIntermedio = 1.85, precioExcedente = 3.65) {
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
export function calcularPdbt(consumoKwh, cargoFijoMxn = 12, precioKwhBajo = 2.25, precioKwhAlto = 2.85, umbralKwh = 300) {
    if (wasmModulo && typeof wasmModulo.calcular_pdbt === "function") {
        return wasmModulo.calcular_pdbt(consumoKwh, cargoFijoMxn, precioKwhBajo, precioKwhAlto, umbralKwh);
    }
    const precioKwh = consumoKwh > umbralKwh ? precioKwhAlto : precioKwhBajo;
    const subtotal = cargoFijoMxn + consumoKwh * precioKwh;
    return Math.round(subtotal * 1.16 * 100) / 100;
}
export function calcularExcedentes(consumoKwh, generacionKwh, precioImportacionMxn = 2.55, precioExportacionMxn = 1.15) {
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
export function sugerirPaneles(consumoMensualKwh, produccionPorPanelKwh) {
    if (wasmModulo && typeof wasmModulo.sugerir_paneles === "function") {
        return wasmModulo.sugerir_paneles(consumoMensualKwh, produccionPorPanelKwh);
    }
    if (produccionPorPanelKwh <= 0)
        return 0;
    return Math.ceil((consumoMensualKwh * 0.95) / produccionPorPanelKwh);
}
export function calcularRoiAnios(costoSistemaMxn, ahorroAnualMxn) {
    if (wasmModulo && typeof wasmModulo.calcular_roi_anios === "function") {
        return wasmModulo.calcular_roi_anios(costoSistemaMxn, ahorroAnualMxn);
    }
    if (ahorroAnualMxn <= 0)
        return 99;
    return Math.round((costoSistemaMxn / ahorroAnualMxn) * 10) / 10;
}
export function calcularMitigacionCo2Kg(generacionAnualKwh, factorEmision = 0.42) {
    if (wasmModulo && typeof wasmModulo.calcular_mitigacion_co2_kg === "function") {
        return wasmModulo.calcular_mitigacion_co2_kg(generacionAnualKwh, factorEmision);
    }
    return Math.round(generacionAnualKwh * factorEmision);
}
export function evaluarAlertaDac(consumoMensualKwh, limiteMensualDac = 250) {
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
export function calcularGeneracionAjustadaPR(irradianciaGhi, tempMaxAmbienteC = 32, factorInclinacion = 1.0) {
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
export function calcularProyeccion25Anios(generacionAnualInicialKwh, costoInicialMxn, ahorroAnualInicialMxn, tasaDegradacionAnual = 0.005, tasaInflacionTarifa = 0.045) {
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
