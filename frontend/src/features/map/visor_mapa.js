import L from "leaflet";
import "leaflet/dist/leaflet.css";
export class VisorMapaHelioScan {
    mapa;
    marcador;
    callbackSeleccion;
    // Ubicación inicial por defecto: Hermosillo, Sonora (Zona de alta irradiancia en México)
    ubicacionActual = {
        lat: 29.07296,
        lng: -110.9559,
    };
    inicializar(idContenedor, callback) {
        this.callbackSeleccion = callback;
        // Crear mapa Leaflet centrado en México
        this.mapa = L.map(idContenedor, {
            center: [this.ubicacionActual.lat, this.ubicacionActual.lng],
            zoom: 18,
            zoomControl: true,
        });
        // Capa de Imagen Satelital de Esri (World Imagery)
        const capaEsriSatelite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19,
            attribution: "&copy; Esri, Maxar, Earthstar Geographics, y la comunidad de GIS",
        });
        // Capa de etiquetas de calles y referencias de Esri (opcional)
        const capaEsriEtiquetas = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}", {
            maxZoom: 19,
            opacity: 0.7,
        });
        capaEsriSatelite.addTo(this.mapa);
        capaEsriEtiquetas.addTo(this.mapa);
        // Crear icono personalizado de pin solar
        const iconoPinSolar = L.divIcon({
            className: "pin-solar-marcador",
            html: `
        <div class="contenedor-pin-solar">
          <div class="pulso-solar"></div>
          <div class="centro-pin-solar">☀️</div>
        </div>
      `,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
        });
        // Añadir marcador en la ubicación inicial
        this.marcador = L.marker([this.ubicacionActual.lat, this.ubicacionActual.lng], {
            icon: iconoPinSolar,
            draggable: true,
        }).addTo(this.mapa);
        this.marcador.bindPopup(`<div class="popup-solar-estilo">
        <strong>📍 Techo Seleccionado</strong><br/>
        Lat: ${this.ubicacionActual.lat.toFixed(5)}<br/>
        Lon: ${this.ubicacionActual.lng.toFixed(5)}
      </div>`);
        // Evento de clic en el mapa para actualizar posición
        this.mapa.on("click", (evento) => {
            this.actualizarUbicacion(evento.latlng.lat, evento.latlng.lng);
        });
        // Evento de arrastrar marcador
        this.marcador.on("dragend", () => {
            const posicion = this.marcador.getLatLng();
            this.actualizarUbicacion(posicion.lat, posicion.lng);
        });
    }
    actualizarUbicacion(lat, lng) {
        this.ubicacionActual = { lat, lng };
        const nuevaPosicion = [lat, lng];
        this.marcador.setLatLng(nuevaPosicion);
        this.mapa.panTo(nuevaPosicion, { animate: true });
        this.marcador.setPopupContent(`<div class="popup-solar-estilo">
        <strong>📍 Techo Seleccionado</strong><br/>
        Lat: ${lat.toFixed(5)}<br/>
        Lon: ${lng.toFixed(5)}
      </div>`);
        if (this.callbackSeleccion) {
            this.callbackSeleccion(this.ubicacionActual);
        }
    }
    obtenerUbicacion() {
        return this.ubicacionActual;
    }
    centrarEnUbicacion(lat, lng, zoom = 18) {
        this.ubicacionActual = { lat, lng };
        this.mapa.setView([lat, lng], zoom);
        this.marcador.setLatLng([lat, lng]);
        if (this.callbackSeleccion) {
            this.callbackSeleccion(this.ubicacionActual);
        }
    }
    redimensionar() {
        if (this.mapa) {
            this.mapa.invalidateSize();
        }
    }
}
