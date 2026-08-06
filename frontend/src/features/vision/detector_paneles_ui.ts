import { DeteccionPanelesRespuesta } from "../../core/cliente_api";

export class ComponenteDetectorPaneles {
  private lienzoCanvas!: HTMLCanvasElement;
  private contexto2D!: CanvasRenderingContext2D;
  private imagenActual: HTMLImageElement | null = null;
  private deteccionesActuales: DeteccionPanelesRespuesta | null = null;

  public inicializar(idCanvas: string): void {
    const elemento = document.getElementById(idCanvas);
    if (!elemento || !(elemento instanceof HTMLCanvasElement)) {
      throw new Error(`No se encontró el elemento canvas con ID ${idCanvas}`);
    }
    this.lienzoCanvas = elemento;
    const ctx = this.lienzoCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("No se pudo obtener el contexto 2D del canvas");
    }
    this.contexto2D = ctx;
  }

  public async cargarImagenDesdeUrl(urlImagen: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        this.imagenActual = img;
        this.redibujarLienzo();
        resolve();
      };
      img.onerror = (err) => reject(err);
      img.src = urlImagen;
    });
  }

  public async cargarImagenDesdeArchivo(archivo: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = (evento) => {
        if (evento.target?.result) {
          const img = new Image();
          img.onload = () => {
            this.imagenActual = img;
            this.redibujarLienzo();
            resolve();
          };
          img.onerror = (e) => reject(e);
          img.src = evento.target.result as string;
        }
      };
      lector.onerror = (e) => reject(e);
      lector.readAsDataURL(archivo);
    });
  }

  public limpiarLienzo(): void {
    this.imagenActual = null;
    this.deteccionesActuales = null;
    if (this.contexto2D && this.lienzoCanvas) {
      this.contexto2D.clearRect(0, 0, this.lienzoCanvas.width, this.lienzoCanvas.height);
    }
  }

  public renderizarDetecciones(detecciones: DeteccionPanelesRespuesta): void {
    if (!detecciones.exito) {
      this.deteccionesActuales = null;
    } else {
      this.deteccionesActuales = detecciones;
    }
    this.redibujarLienzo();
  }

  private redibujarLienzo(): void {
    const anchoContenedor = this.lienzoCanvas.parentElement?.clientWidth || 640;
    const relacionAspecto = this.imagenActual ? (this.imagenActual.height / this.imagenActual.width) : 0.75;
    
    this.lienzoCanvas.width = anchoContenedor;
    this.lienzoCanvas.height = Math.round(anchoContenedor * relacionAspecto);

    const ancho = this.lienzoCanvas.width;
    const alto = this.lienzoCanvas.height;

    this.contexto2D.clearRect(0, 0, ancho, alto);

    // PLANO ESQUEMÁTICO HUD: Fondo carbón con retícula de ingeniería
    this.contexto2D.fillStyle = "#0b1120";
    this.contexto2D.fillRect(0, 0, ancho, alto);

    // Dibujar retícula técnica de ingeniería (#529AFC)
    this.contexto2D.strokeStyle = "rgba(82, 154, 252, 0.25)";
    this.contexto2D.lineWidth = 1;
    const pasoGrid = 30;

    for (let x = 0; x < ancho; x += pasoGrid) {
      this.contexto2D.beginPath();
      this.contexto2D.moveTo(x, 0);
      this.contexto2D.lineTo(x, alto);
      this.contexto2D.stroke();
    }
    for (let y = 0; y < alto; y += pasoGrid) {
      this.contexto2D.beginPath();
      this.contexto2D.moveTo(0, y);
      this.contexto2D.lineTo(ancho, y);
      this.contexto2D.stroke();
    }

    // Etiqueta de encabezado del plano HUD (#41D0FB)
    this.contexto2D.fillStyle = "#41D0FB";
    this.contexto2D.font = "bold 11px Outfit, monospace";
    this.contexto2D.fillText("PLANO ESQUEMÁTICO DE DISPOSICIÓN SOLAR VECTORS", 15, 22);

    if (!this.deteccionesActuales || !this.deteccionesActuales.cajasDelimitadoras || this.deteccionesActuales.cajasDelimitadoras.length === 0) {
      this.contexto2D.fillStyle = "#529AFC";
      this.contexto2D.font = "14px Outfit, sans-serif";
      this.contexto2D.textAlign = "center";
      this.contexto2D.fillText("Presiona 'Escanear paneles' para desplegar la geometría fotovoltaica", ancho / 2, alto / 2);
      this.contexto2D.textAlign = "start";
      return;
    }

    // Dibujar cuadros vectoriales de paneles fotovoltaicos (#FC8B26 / #F79D42 / #41D0FB)
    this.deteccionesActuales.cajasDelimitadoras.forEach((caja, indice) => {
      const x1 = caja.xMin * ancho;
      const y1 = caja.yMin * alto;
      const anchoCaja = (caja.xMax - caja.xMin) * ancho;
      const altoCaja = (caja.yMax - caja.yMin) * alto;

      // Relleno de celda azul marino con resplandor neón naranja solar
      this.contexto2D.fillStyle = "rgba(17, 24, 39, 0.9)";
      this.contexto2D.fillRect(x1, y1, anchoCaja, altoCaja);

      this.contexto2D.shadowColor = "rgba(252, 139, 38, 0.9)";
      this.contexto2D.shadowBlur = 12;
      this.contexto2D.strokeStyle = "#FC8B26"; // Naranja Solar Intenso
      this.contexto2D.lineWidth = 2.5;
      this.contexto2D.strokeRect(x1, y1, anchoCaja, altoCaja);
      this.contexto2D.shadowBlur = 0;

      // Dibujar celdas fotovoltaicas (Busbars internas #41D0FB)
      this.contexto2D.strokeStyle = "rgba(65, 208, 251, 0.4)";
      this.contexto2D.lineWidth = 1;
      const celdasX = 3;
      const celdasY = 2;
      const wSub = anchoCaja / celdasX;
      const hSub = altoCaja / celdasY;

      for (let cx = 1; cx < celdasX; cx++) {
        this.contexto2D.beginPath();
        this.contexto2D.moveTo(x1 + cx * wSub, y1);
        this.contexto2D.lineTo(x1 + cx * wSub, y1 + altoCaja);
        this.contexto2D.stroke();
      }
      for (let cy = 1; cy < celdasY; cy++) {
        this.contexto2D.beginPath();
        this.contexto2D.moveTo(x1, y1 + cy * hSub);
        this.contexto2D.lineTo(x1 + anchoCaja, y1 + cy * hSub);
        this.contexto2D.stroke();
      }

      // Etiqueta de confianza en esquina del módulo (#F79D42)
      const texto = `Panel #${indice + 1} (${Math.round(caja.confianza * 100)}%)`;
      this.contexto2D.font = "bold 11px Outfit, Inter, sans-serif";
      const anchoTexto = this.contexto2D.measureText(texto).width;

      this.contexto2D.fillStyle = "#0b1120";
      this.contexto2D.fillRect(x1, Math.max(0, y1 - 20), anchoTexto + 10, 18);
      this.contexto2D.strokeStyle = "#FC8B26";
      this.contexto2D.lineWidth = 1;
      this.contexto2D.strokeRect(x1, Math.max(0, y1 - 20), anchoTexto + 10, 18);

      this.contexto2D.fillStyle = "#F79D42";
      this.contexto2D.fillText(texto, x1 + 5, Math.max(13, y1 - 7));
    });
  }

  public obtenerCanvasBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.lienzoCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  }

  public obtenerContexto2D(): CanvasRenderingContext2D {
    return this.contexto2D;
  }

  public obtenerAncho(): number {
    return this.lienzoCanvas ? this.lienzoCanvas.width : 640;
  }

  public obtenerAlto(): number {
    return this.lienzoCanvas ? this.lienzoCanvas.height : 480;
  }
}
