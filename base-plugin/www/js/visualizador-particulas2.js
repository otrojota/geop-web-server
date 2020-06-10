class VisualizadorParticulas2 extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
            nParticulas:300,
            retina:false,
            velocidad:0.70,
            escala:{
                dinamica:true,
                nombre:"Magma - MatplotLib",
                unidad:capa.unidad || "s/u"
            }
        }
        let conf = $.extend(defaultConfig, config);
        super("particulas", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:280, width:300,
            configSubPaneles:{}
        }       
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.uv;
    }

    get nParticulas() {return this.config.nParticulas}
    set nParticulas(r) {
        this.config.nParticulas = r;
        this.repinta();
    }
    get velocidad() {return this.config.velocidad}
    set velocidad(v) {
        this.config.velocidad = v;
        this.repinta();
    }
    get escala() {return this.config.escala}

    async crea() {
        let div = document.createElement("DIV");
        this.canvas = document.createElement("canvas");
        this.canvas.style["backgroun-color"] = "blue";
        this.canvas.style.position = "absolute";
        div.appendChild(this.canvas);
        this.panelParticulas = window.geoportal.mapa.creaPanelMapa(this.capa, "particulas" + parseInt(Math.random() * 10000), 5);
        this.panelParticulas.style.opacity = this.capa.config.opacidad / 100;
        this.capa.registraPanelMapa(this.panelParticulas);

        this.lyParticulas = new L.customLayer({
            container:div,
            minZoom:0, maxZoom:18, opacity:1, visible:true, zIndex:1500,
            pane:this.panelParticulas.id
        }).addTo(window.geoportal.mapa.map);

        this.lyParticulas.on("layer-render", _ => {
        });
    }
    async destruye() {
        if (this.windy) this.windy.stop();
        window.geoportal.mapa.eliminaCapaMapa(this.lyParticulas);  
    }
    clearCanvas() {
        let ctx = this.canvas.getContext("2d");
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);        
    }
    refresca() {
        super.refresca();        
        this.startWorking();
        if (this.windy) this.windy.stop();
        this.windy = null;
        this.clearCanvas();
        this.capa.resuelveConsulta("uv", {
            resolution:80
        }, async (err, data) => {
            if (err) {
                this.finishWorking();
                this.mensajes.addError(err.toString());
                console.error(err);
                return;
            }
            this.data = data;
            this.mensajes.parse(data);
            //console.log("data", data);
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
            this.colores = [];
            for (let i=min; i<= max; i += (max - min) / 20) {
                this.colores.push(this.objEscala.getColor(i));
            }
            this.repinta();
        })
    }
    repinta() {
        let data = this.data;
        let p0 = window.geoportal.mapa.map.latLngToContainerPoint([data.lat0, data.lng0]);
        let p1 = window.geoportal.mapa.map.latLngToContainerPoint([data.lat1, data.lng1]);
        let size = this.lyParticulas._bounds.getSize();
        this.canvas.style.left = "0";
        this.canvas.style.top = "0";
        this.canvas.style.width = size.x + "px";
        this.canvas.style.height = size.y + "px";

        const pxRatio = this.config.retina?2:1;
        this.canvas.width = this.canvas.clientWidth * pxRatio;
        this.canvas.height = this.canvas.clientHeight * pxRatio;

        // Preparar datos para windy
        let dataU = [], dataV = [];
        for (let i=0; i<this.data.data.length; i+=2) {
            dataU.push(this.data.data[i]);
            dataV.push(this.data.data[i+1]);
        }
        let windyGridData = [{
            header:{
                parameterCategory:"1",
                parameterNumber:"2",
                lo1:this.data.lng0,
                la1:this.data.lat0,
                dx:this.data.deltaLng,
                dy:this.data.deltaLat,
                nx:this.data.ncols,
                ny:this.data.nrows
            },
            data:dataU
        }, {
            header:{
                parameterCategory:"1",
                parameterNumber:"3"
            },
            data:dataV
        }]

        if (!this.windy) {
            this.windy = new Windy({
                canvas:this.canvas,
                map:window.geoportal.mapa.map,
                data:windyGridData,
                maxVelocity:this.maxMagnitud,
                minVelocity:this.minMagnitud,
                particleMultiplier:1 / this.nParticulas,
                velocityScale:this.velocidad / this.maxMagnitud,
                colorScale:this.colores
            })
        } else {
            this.windy.setData(windyGridData);
            this.windy.setOptions({
                maxVelocity:this.maxMagnitud,
                minVelocity:this.minMagnitud,
                particleMultiplier:1 / this.nParticulas,
                velocityScale:this.velocidad / this.maxMagnitud,
                colorScale:this.colores
            })
        }
        this.windy.start([
                [p0.x, p1.y],
                [p1.x, p0.y]
            ],
            p1.x - p0.x + 1, 
            p0.y - p1.y + 1,
            [
                [data.lng1, data.lat1],
                [data.lng0, data.lat0]
            ]
        )

        this.finishWorking();   
    }

    cambioOpacidadCapa(opacidad) {
        this.panelParticulas.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"base/propiedades/PropParticulas"
        }, {
            codigo:"escala",
            path:"base/propiedades/PropEscalaVisualizador"
        }];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Particulas";
    }
}

window.geoportal.capas.registraVisualizador("base", "particulas", VisualizadorParticulas2, "Particulas", "base/img/particulas.svg");
