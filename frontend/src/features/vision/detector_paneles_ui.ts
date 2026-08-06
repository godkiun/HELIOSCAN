import { DeteccionPanelesRespuesta, CajaDelimitadora } from "../../core/cliente_api";

export type ModoEdicionHUD = "ninguno" | "agregar" | "eliminar";

export class ComponenteDetectorPaneles {
  private lienzoCanvas!: HTMLCanvasElement;
  private contexto2D!: CanvasRenderingContext2D;
  private imagenActual: HTMLImageElement | null = null;
  private deteccionesActuales: DeteccionPanelesRespuesta | null = null;
  private modoEdicion: ModoEdicionHUD = "ninguno";
  
  // Variables para arrastrar y crear nuevo panel
  private inicioArrastre: { x: number; y: number } | null = null;
  private arrastreActual: { x: number; y: number } | null = null;

  public alCambiarPaneles?: (totalPaneles: number) => void;

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
    this.configurarEventosInteraccion();
  }

  public fijarModoEdicion(modo: ModoEdicionHUD): void {
    this.modoEdicion = modo;
    this.redibujarLienzo();
  }

  public obtenerModoEdicion(): ModoEdicionHUD {
    return this.modoEdicion;
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
    if (this.alCambiarPaneles) this.alCambiarPaneles(0);
  }

  public vaciarTodosLosPaneles(): void {
    if (this.deteccionesActuales) {
      this.deteccionesActuales.cajasDelimitadoras = [];
      this.deteccionesActuales.totalPanelesDetectados = 0;
      this.redibujarLienzo();
      if (this.alCambiarPaneles) this.alCambiarPaneles(0);
    }
  }

  public renderizarDetecciones(detecciones: DeteccionPanelesRespuesta): void {
    if (!detecciones.exito) {
      this.deteccionesActuales = null;
    } else {
      this.deteccionesActuales = { ...detecciones, cajasDelimitadoras: [...detecciones.cajasDelimitadoras] };
    }
    this.redibujarLienzo();
    if (this.alCambiarPaneles) {
      this.alCambiarPaneles(this.deteccionesActuales ? this.deteccionesActuales.cajasDelimitadoras.length : 0);
    }
  }

  public obtenerTotalPaneles(): number {
    return this.deteccionesActuales ? this.deteccionesActuales.cajasDelimitadoras.length : 0;
  }

  private configurarEventosInteraccion(): void {
    this.lienzoCanvas.addEventListener("mousedown", (e) => this.alIniciarPresion(e));
    this.lienzoCanvas.addEventListener("mousemove", (e) => this.alMoverRaton(e));
    this.lienzoCanvas.addEventListener("mouseup", (e) => this.alSoltarPresion(e));
    
    // Soporte para pantallas táctiles
    this.lienzoCanvas.addEventListener("touchstart", (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = this.lienzoCanvas.getBoundingClientRect();
        this.alIniciarPresion({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
      }
    });
    this.lienzoCanvas.addEventListener("touchmove", (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        this.alMoverRaton({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
      }
    });
    this.lienzoCanvas.addEventListener("touchend", (e) => {
      this.alSoltarPresion(e as unknown as MouseEvent);
    });
  }

  private alIniciarPresion(e: MouseEvent): void {
    const rect = this.lienzoCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!this.deteccionesActuales) {
      this.deteccionesActuales = {
        exito: true,
        totalPanelesDetectados: 0,
        confianzaPromedio: 1.0,
        cajasDelimitadoras: [],
        mensaje: "Edición manual",
        tiempoProcesamientoMs: 0
      };
    }

    if (this.modoEdicion === "eliminar") {
      this.eliminarPanelEnCoordenadas(x, y);
      return;
    }

    if (this.modoEdicion === "agregar" || this.modoEdicion === "ninguno") {
      this.inicioArrastre = { x, y };
      this.arrastreActual = { x, y };
    }
  }

  private alMoverRaton(e: MouseEvent): void {
    if (!this.inicioArrastre) return;
    const rect = this.lienzoCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.arrastreActual = { x, y };
    this.redibujarLienzo();
  }

  private alSoltarPresion(e: MouseEvent): void {
    if (!this.inicioArrastre || !this.arrastreActual) return;
    const anchoCanvas = this.lienzoCanvas.width;
    const altoCanvas = this.lienzoCanvas.height;

    const x1 = Math.min(this.inicioArrastre.x, this.arrastreActual.x);
    const y1 = Math.min(this.inicioArrastre.y, this.arrastreActual.y);
    const dx = Math.abs(this.arrastreActual.x - this.inicioArrastre.x);
    const dy = Math.abs(this.arrastreActual.y - this.inicioArrastre.y);

    // Si fue un clic simple (pequeño desplazamiento < 10px), agregar panel estricto de tamaño estándar (e.g. 60x90px)
    let finalXMin: number, finalYMin: number, finalXMax: number, finalYMax: number;

    if (dx < 10 && dy < 10) {
      const anchoEstándar = 65;
      const altoEstándar = 90;
      finalXMin = Math.max(0, (x1 - anchoEstándar / 2) / anchoCanvas);
      finalYMin = Math.max(0, (y1 - altoEstándar / 2) / altoCanvas);
      finalXMax = Math.min(1, (x1 + anchoEstándar / 2) / anchoCanvas);
      finalYMax = Math.min(1, (y1 + altoEstándar / 2) / altoCanvas);
    } else {
      finalXMin = x1 / anchoCanvas;
      finalYMin = y1 / altoCanvas;
      finalXMax = (x1 + dx) / anchoCanvas;
      finalYMax = (y1 + dy) / altoCanvas;
    }

    if (this.deteccionesActuales && (finalXMax - finalXMin > 0.02) && (finalYMax - finalYMin > 0.02)) {
      const nuevaCaja: CajaDelimitadora = {
        xMin: finalXMin,
        yMin: finalYMin,
        xMax: finalXMax,
        yMax: finalYMax,
        confianza: 1.0,
        clase: "solar-panel"
      };

      this.deteccionesActuales.cajasDelimitadoras.push(nuevaCaja);
      this.deteccionesActuales.totalPanelesDetectados = this.deteccionesActuales.cajasDelimitadoras.length;

      if (this.alCambiarPaneles) {
        this.alCambiarPaneles(this.deteccionesActuales.cajasDelimitadoras.length);
      }
    }

    this.inicioArrastre = null;
    this.arrastreActual = null;
    this.redibujarLienzo();
  }

  private eliminarPanelEnCoordenadas(x: number, y: number): void {
    if (!this.deteccionesActuales || !this.deteccionesActuales.cajasDelimitadoras) return;

    const ancho = this.lienzoCanvas.width;
    const alto = this.lienzoCanvas.height;

    const indiceEliminar = this.deteccionesActuales.cajasDelimitadoras.findIndex((caja) => {
      const x1 = caja.xMin * ancho;
      const y1 = caja.yMin * alto;
      const x2 = caja.xMax * ancho;
      const y2 = caja.yMax * alto;
      return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    });

    if (indiceEliminar !== -1) {
      this.deteccionesActuales.cajasDelimitadoras.splice(indiceEliminar, 1);
      this.deteccionesActuales.totalPanelesDetectados = this.deteccionesActuales.cajasDelimitadoras.length;
      this.redibujarLienzo();
      if (this.alCambiarPaneles) {
        this.alCambiarPaneles(this.deteccionesActuales.cajasDelimitadoras.length);
      }
    }
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
    this.contexto2D.fillText(`PLANO ESQUEMÁTICO DE DISPOSICIÓN SOLAR VECTORS [Modo: ${this.modoEdicion.toUpperCase()}]`, 15, 22);

    if (!this.deteccionesActuales || !this.deteccionesActuales.cajasDelimitadoras || this.deteccionesActuales.cajasDelimitadoras.length === 0) {
      this.contexto2D.fillStyle = "#529AFC";
      this.contexto2D.font = "14px Outfit, sans-serif";
      this.contexto2D.textAlign = "center";
      this.contexto2D.fillText("Haz clic o arrastra sobre el lienzo para agregar rectángulos de paneles solares", ancho / 2, alto / 2);
      this.contexto2D.textAlign = "start";
    } else {
      // Dibujar cuadros vectoriales de paneles fotovoltaicos (#FC8B26 / #F79D42 / #41D0FB)
      this.deteccionesActuales.cajasDelimitadoras.forEach((caja, indice) => {
        const x1 = caja.xMin * ancho;
        const y1 = caja.yMin * alto;
        const anchoCaja = (caja.xMax - caja.xMin) * ancho;
        const altoCaja = (caja.yMax - caja.yMin) * alto;

        // Relleno de celda azul marino con resplandor neón naranja solar
        this.contexto2D.fillStyle = "rgba(17, 24, 39, 0.9)";
        this.contexto2D.fillRect(x1, y1, anchoCaja, altoCaja);

        this.contexto2D.shadowColor = this.modoEdicion === "eliminar" ? "rgba(239, 68, 68, 0.9)" : "rgba(252, 139, 38, 0.9)";
        this.contexto2D.shadowBlur = 12;
        this.contexto2D.strokeStyle = this.modoEdicion === "eliminar" ? "#ef4444" : "#FC8B26"; // Rojo en modo eliminar, Naranja Solar en normal
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
        this.contexto2D.strokeStyle = this.modoEdicion === "eliminar" ? "#ef4444" : "#FC8B26";
        this.contexto2D.lineWidth = 1;
        this.contexto2D.strokeRect(x1, Math.max(0, y1 - 20), anchoTexto + 10, 18);

        this.contexto2D.fillStyle = this.modoEdicion === "eliminar" ? "#fca5a5" : "#F79D42";
        this.contexto2D.fillText(texto, x1 + 5, Math.max(13, y1 - 7));
      });
    }

    // Dibujar preview de arrastre al crear un panel
    if (this.inicioArrastre && this.arrastreActual) {
      const px1 = Math.min(this.inicioArrastre.x, this.arrastreActual.x);
      const py1 = Math.min(this.inicioArrastre.y, this.arrastreActual.y);
      const pw = Math.abs(this.arrastreActual.x - this.inicioArrastre.x);
      const ph = Math.abs(this.arrastreActual.y - this.inicioArrastre.y);

      this.contexto2D.fillStyle = "rgba(65, 208, 251, 0.25)";
      this.contexto2D.fillRect(px1, py1, pw, ph);
      this.contexto2D.strokeStyle = "#41D0FB";
      this.contexto2D.lineWidth = 2;
      this.contexto2D.setLineDash([4, 4]);
      this.contexto2D.strokeRect(px1, py1, pw, ph);
      this.contexto2D.setLineDash([]);
    }
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
