class VisualizadorVectores extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
            resolucion:40,
            escala:{
                dinamica:true,
                nombre:"SAGA - 04"
            }
        }
        let conf = $.extend(defaultConfig, config);
        super("vectores", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:180, width:300,
            configSubPaneles:{}
        }       
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.uv;
    }

    get resolucion() {return this.config.resolucion}
    set resolucion(r) {
        this.config.resolucion = r;
        this.refresca();
    }
    get escala() {return this.config.escala}

    async crea() {
        let div = document.createElement("DIV");
        div.style["pointer-events"] = "all";        
        this.panelVectores = window.geoportal.mapa.creaPanelMapa(this.capa, "vectores" + parseInt(Math.random() * 10000), 5);
        this.panelVectores.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelVectores);

        this.konvaStage = new Konva.Stage({
            id:"ks" + this.panelVectores.id,
            container:div,
            width:200,
            height:200
        });
        this.konvaLayer = new Konva.Layer();  
        this.konvaStage.add(this.konvaLayer);

        this.lyVectores = new L.customLayer({
            container:div,
            minZoom:0, maxZoom:18, opacity:1, visible:true, zIndex:1500,
            pane:this.panelVectores.id
        }).addTo(window.geoportal.mapa.map);

        this.lyVectores.on("layer-render", _ => {
            var size = this.lyVectores._bounds.getSize();
            this.konvaStage.width(size.x);
            this.konvaStage.height(size.y);    
            this.konvaLayer.destroyChildren();
            this.konvaLayer.draw();
        });
    }
    async destruye() {
        this.konvaStage.destroy();
        window.geoportal.mapa.eliminaCapaMapa(this.lyVectores);
    }
    refresca() {
        super.refresca();
        this.startWorking();
        this.konvaLayer.destroyChildren();
        this.konvaLayer.draw();
        this.capa.resuelveConsulta("uv", {
            resolution:this.resolucion
        }, async (err, data) => {
            if (err) {
                this.finishWorking();
                this.mensajes.addError(err.toString());
                console.error(err);
                return;
            }
            this.data = data;
            this.mensajes.parse(data);
            this.magnitudes = [];
            this.minMagnitud = undefined;
            this.maxMagnitud = undefined;
            for (let i=0; i<data.data.length; i+=2) {
                let u = this.data.data[i];
                let v = this.data.data[i+1];
                let magnitud = null;
                if (u !== undefined && v !== undefined && u !== null && v !== null) {
                    magnitud = Math.sqrt(u * u + v * v);
                    // caso especial .. vectores sin magnitud pueden llegar aproximados (i.e. 0.9999999999999999)
                    if (Math.abs(1 - magnitud) < 0.0000000001) magnitud = 1;
                    if (this.minMagnitud === undefined || magnitud < this.minMagnitud) this.minMagnitud = magnitud;
                    if (this.maxMagnitud === undefined || magnitud > this.maxMagnitud) this.maxMagnitud = magnitud;
                }
                this.magnitudes.push(magnitud);
            }
            if (this.minMagnitud === undefined || this.maxMagnitud === undefined) {
                this.finishWorking();
                this.mensajes.addError("No hay Datos");
                throw "No hay datos (min == max)";
            }
            let min, max;
            if (this.config.escala.dinamica) {
                min = this.minMagnitud;
                max = this.maxMagnitud;
                this.config.escala.min = min;
                this.config.escala.max = max;
                if (min === max) {
                    let max = this.maxMagnitud;
                    this.maxMagnitud = max * 1.2;
                    this.minMagnitud = max - 8/10 * max;
                    this.minMagnitud = Number(Math.round(this.minMagnitud+'e4')+'e-4');
                    this.mensajes.addAdvertencia(`Usando vectores sin magnitud, se asume 80% de la escala [${this.minMagnitud} - ${this.maxMagnitud}]`);
                }
            } else {
                min = this.config.escala.min;
                max = this.config.escala.max;
            }
            let baseURL = window.location.origin + window.location.pathname;
            if (baseURL.endsWith("/")) baseURL = baseURL.substr(0, baseURL.length - 1);
            this.objEscala = await EscalaGeoportal.porNombre(this.config.escala.nombre, baseURL);
            this.objEscala.dinamica = this.config.escala.dinamica;
            this.objEscala.actualizaLimites(min, max);
            this.repinta();
        })
    }
    repinta() {
        this.konvaLayer.destroyChildren();
        var size = this.lyVectores._bounds.getSize();
        this.konvaStage.width(size.x);
        this.konvaStage.height(size.y);
        let lng = this.data.lng0, lat = this.data.lat0;
        let n=0;
        for (let iLat=0; iLat<this.data.resolution; iLat++) {
            lng = this.data.lng0;
            for (let iLng=0; iLng<this.data.resolution; iLng++) {
                let point = window.geoportal.mapa.map.latLngToContainerPoint([lat, lng]);
                let m = this.magnitudes[n], u = this.data.data[2*n], v = this.data.data[2*n + 1];
                if (m !== null) {
                    let len = Math.min(size.x / this.data.resolution, size.y / this.data.resolution) * 1.0;
                    let angle = Math.atan2(u, v) * 180 / Math.PI;
                    let scale = 0.3 + 0.7 * (m -this.minMagnitud) / (this.maxMagnitud - this.minMagnitud);
                    if (isNaN(scale)) scale = 1;
                    let arrow = new Konva.Arrow({
                        x: point.x,
                        y: point.y,
                        points:[0,  len / 2, 0, -len /2],
                        pointerLength: 5,
                        pointerWidth: 5,
                        stroke: this.objEscala.getColor(m),
                        strokeWidth: 2,
                        rotation:angle,
                        scaleX:scale, scaleY:scale
                    });
                    this.konvaLayer.add(arrow);
                }
                lng += this.data.deltaLng;
                n++;
            }
            lat += this.data.deltaLat;
        }
        this.konvaLayer.draw(); 
        this.finishWorking();   
    }

    cambioOpacidadCapa(opacidad) {
        this.panelVectores.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"base/propiedades/PropVectores"
        }, {
            codigo:"escala",
            path:"base/propiedades/PropEscalaVisualizador"
        }];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Vectores";
    }
}

window.geoportal.capas.registraVisualizador("base", "vectores", VisualizadorVectores, "Vectores", "base/img/vectores.svg");
