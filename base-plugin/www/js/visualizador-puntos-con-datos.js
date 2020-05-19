class VisualizadorPuntosConDatos extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
        }
        let conf = $.extend(defaultConfig, config);
        super("puntos-con-datos", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:280, width:300,
            configSubPaneles:{}
        }       
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.matrizRectangular;
    }

    async crea() {
        this.konvaLayer = new Konva.Layer();  
        window.geoportal.mapa.konvaStage.add(this.konvaLayer);
    }
    async destruye() {
        this.konvaLayer.destroy();
    }
    refresca() {
        super.refresca();
        this.startWorking();
        this.konvaLayer.destroyChildren();
        this.konvaLayer.draw();
        this.capa.resuelveConsulta("matrizRectangular", {
            maxWidth:30, maxHeight:30
        }, (err, data) => {
            if (err) {
                this.finishWorking();
                this.mensajes.addError(err.toString());
                console.error(err);
                return;
            }            
            console.log("data", data);
            this.mensajes.parse(data, "Puntos con Datos");
            this.data = data;
            this.repinta();
        })
    }
    repinta() {
        this.konvaLayer.destroyChildren();
        this.finishWorking();
        let lat = this.data.lat0, lng;
        let iRow = 0, iCol;
        while (iRow < this.data.nrows) {
            iCol = 0; lng = this.data.lng0;
            while (iCol < this.data.ncols) {
                let v = this.data.rows[iRow][iCol];
                let hayDatos = v !== null && v !== undefined;                
                let point = window.geoportal.mapa.map.latLngToContainerPoint([lat, lng]);
                let circulo = new Konva.Circle({
                    x: point.x,
                    y: point.y,
                    radius: 6,
                    stroke: 'white',
                    strokeWidth: 2,
                    fill:hayDatos?"red":undefined,
                    opacity : this.capa.opacidad / 100
                });
                circulo.lat = lat;
                circulo.lng = lng;
                circulo.on("mouseenter", _ => {
                    let html = "<div class='tooltip-titulo'>" + this.capa.nombre + "</div>";
                    html += "<hr class='my-1 bg-white' />";
                    html += "<div class='tooltip-contenido'>";
                    html += "<table class='w-100'>";
                    html += "<tr>";
                    html += "<td class='icono-tooltip'><i class='fas fa-lg fa-tag'></i></td>";
                    html += "<td class='propiedad-tooltip'>Latitud:</td>";
                    html += "<td class='valor-tooltip'>" + circulo.lat + "</td>";
                    html += "</tr>";
                    html += "<tr>";
                    html += "<td class='icono-tooltip'><i class='fas fa-lg fa-tag'></i></td>";
                    html += "<td class='propiedad-tooltip'>Longitud:</td>";
                    html += "<td class='valor-tooltip'>" + circulo.lng + "</td>";
                    html += "</tr>";
                    if (hayDatos) {
                        html += "<hr class='my-1 bg-white' />";
                        html += "<tr>";
                        html += "<td class='icono-tooltip'><i class='fas fa-lg fa-tag'></i></td>";
                        html += "<td class='propiedad-tooltip'>Valor:</td>";
                        html += "<td class='valor-tooltip'>" + window.geoportal.formateaValor(this.capa.codigoProveedor + "." + this.capa.codigo, v) + " [" + this.capa.unit + "]</td>";
                        html += "</tr>";
                    }
                    html += "</table>";
                    html += "</div>";
                    window.geoportal.showTooltip(point.x + 15, point.y, html, point.x - 15);
                });
                circulo.on("mouseout", e => {
                    window.geoportal.hideTooltip();
                    window.geoportal.mapa.limpiaPuntoDatos();
                });   
                this.konvaLayer.add(circulo);

                iCol++; lng += this.data.dx;
            }
            iRow++; lat += this.data.dy;
        }
        this.konvaLayer.draw(); 
    }

    cambioOpacidadCapa(opacidad) {
        this.panelPuntos.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Puntos";
    }
}

window.geoportal.capas.registraVisualizador("base", "puntos-con-datos", VisualizadorPuntosConDatos, "Puntos con Datos", "base/img/puntos.svg");
