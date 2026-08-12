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

  public renderizarDetecciones(detecciones: DeteccionPanelesRespuesta): void {
    this.deteccionesActuales = detecciones;
    this.redibujarLienzo();
  }

  private redibujarLienzo(): void {
    if (!this.imagenActual) return;

    const anchoContenedor = this.lienzoCanvas.parentElement?.clientWidth || 640;
    const relacionAspecto = this.imagenActual.height / this.imagenActual.width;
    
    this.lienzoCanvas.width = anchoContenedor;
    this.lienzoCanvas.height = Math.round(anchoContenedor * relacionAspecto);

    const ancho = this.lienzoCanvas.width;
    const alto = this.lienzoCanvas.height;

    // Dibujar imagen satelital base
    this.contexto2D.clearRect(0, 0, ancho, alto);
    this.contexto2D.drawImage(this.imagenActual, 0, 0, ancho, alto);

    if (!this.deteccionesActuales || !this.deteccionesActuales.cajasDelimitadoras) {
      return;
    }

    // Dibujar cajas de paneles solares detectados por YOLOv8
    this.deteccionesActuales.cajasDelimitadoras.forEach((caja, indice) => {
      const x1 = caja.xMin * ancho;
      const y1 = caja.yMin * alto;
      const anchoCaja = (caja.xMax - caja.xMin) * ancho;
      const altoCaja = (caja.yMax - caja.yMin) * alto;

      // Resplandor de marco solar
      this.contexto2D.shadowColor = "rgba(245, 158, 11, 0.8)";
      this.contexto2D.shadowBlur = 10;
      this.contexto2D.strokeStyle = "#f59e0b"; // Ámbar dorado solar
      this.contexto2D.lineWidth = 3;
      this.contexto2D.strokeRect(x1, y1, anchoCaja, altoCaja);

      // Relleno semi-transparente
      this.contexto2D.fillStyle = "rgba(245, 158, 11, 0.15)";
      this.contexto2D.fillRect(x1, y1, anchoCaja, altoCaja);

      // Restablecer sombra para texto
      this.contexto2D.shadowBlur = 0;

      // Etiqueta de confianza
      const texto = `Panel #${indice + 1} (${Math.round(caja.confianza * 100)}%)`;
      this.contexto2D.font = "bold 12px Outfit, Inter, sans-serif";
      const anchoTexto = this.contexto2D.measureText(texto).width;

      // Fondo de etiqueta
      this.contexto2D.fillStyle = "#0f172a";
      this.contexto2D.fillRect(x1, Math.max(0, y1 - 22), anchoTexto + 12, 20);

      // Texto de etiqueta
      this.contexto2D.fillStyle = "#fbbf24";
      this.contexto2D.fillText(texto, x1 + 6, Math.max(14, y1 - 8));
    });
  }

  public obtenerCanvasBlob(): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.lienzoCanvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });
  }
}

