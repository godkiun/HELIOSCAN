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
  generacionMensualKwh: number;
  generacionAnualKwh: number;
  costoMensualAntesMxn: number;
  costoMensualDespuesMxn: number;
  ahorroMensualMxn: number;
  ahorroAnualMxn: number;
  porcentajeAhorro: number;
  roiAnios: number;
  mitigacionCo2KgAnual: number;
  balanceExcedentes: {
    consumoNetoKwh: number;
    excedenteKwh: number;
    cargoEnergiaMxn: number;
    creditoExcedenteMxn: number;
    balanceFinalMxn: number;
  };
}

