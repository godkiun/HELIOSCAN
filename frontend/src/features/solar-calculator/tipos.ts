export type TipoTarifaCfe = "tarifa_01" | "pdbt";

export interface EntradaAnalisisSolar {
  consumoMensualKwh: number;
  tipoTarifa: TipoTarifaCfe;
  potenciaPanelWatts: number;
  costoEstimadoSistemaMxn: number;
  tarifaImportacionMxn: number;
  tarifaExportacionMxn: number;
  latitud: number;
  longitud: number;
}

export interface ResultadoAnalisisSolar {
  consumoMensualKwh: number;
  tipoTarifa: TipoTarifaCfe;
  irradianciaGhiKwhM2Dia: number;
  panelesSugeridos: number;
  panelesDetectadosSat: number;
  panelesAdicionalesFaltantes?: number;
  costoNetoSistemaMxn?: number;
  generacionMensualKwh: number;
  generacionAnualKwh: number;
  costoMensualAntesMxn: number;
  costoMensualDespuesMxn: number;
  ahorroMensualMxn: number;
  ahorroAnualMxn: number;
  porcentajeAhorro: number;
  roiAnios: number;
  mitigacionCo2KgAnual: number;
  performanceRatio?: number;
  alertaDac?: {
    esRiesgoDac: boolean;
    nivelConsumoKwh: number;
    limiteDacKwh: number;
    mensajeAlerta: string;
  };
  proyeccion25Anios?: {
    ahorroAcumulado25AniosMxn: number;
    valorPresenteNetoMxn: number;
    tasaInternaRetornoPct: number;
    flujoAnual: Array<{ anio: number; generacionKwh: number; ahorroMxn: number }>;
  };
  balanceExcedentes: {
    consumoNetoKwh: number;
    excedenteKwh: number;
    cargoEnergiaMxn: number;
    creditoExcedenteMxn: number;
    balanceFinalMxn: number;
  };
}


