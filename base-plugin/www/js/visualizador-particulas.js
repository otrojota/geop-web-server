class VisualizadorParticulas extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
            nParticulas:10000,
            retina:true,
            velocidad:0.70,
            escala:{
                dinamica:true,
                nombre:"Magma - MatplotLib"
            }
        }
        let conf = $.extend(defaultConfig, config);
        super("particulas", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:180, width:300,
            configSubPaneles:{}
        }       
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.windglPNG;
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
        this.wind = null;
        window.geoportal.mapa.eliminaCapaMapa(this.lyParticulas);    
    }
    refresca() {
        super.refresca();
        this.startWorking(); 
        this.capa.resuelveConsulta("windglPNG", {}, async (err, data) => {
            if (err) {                
                this.finishWorking();
                this.mensajes.addError(err.toString());
                console.error(err);
                return;
            }
            this.mensajes.parse(data);
            console.log("data", data);
            this.data = data;
            await (new Promise(resolve => {
                let img = new Image();
                img.crossOrigin = "anonymous";
                img.src = this.capa.getURLResultado(data.textureFile);
                img.onload = _ => {
                    data.image = img;
                    resolve();
                }
            }));
            await this.repinta(data);
            this.finishWorking();
        })
    }    

    async repinta() {
        let data = this.data;
        console.log("data", data);

        let baseURL = window.location.origin + window.location.pathname;
        if (baseURL.endsWith("/")) baseURL = baseURL.substr(0, baseURL.length - 1);
        let escala = await EscalaGeoportal.porNombre(this.config.escala.nombre, baseURL);
        escala.dinamica = this.config.escala.dinamica;
        escala.actualizaLimites(0, 1);

        this.rampColors = {};
        for (let v=0; v<=1; v+=0.05) {
            this.rampColors[v] = escala.getColor(v);
        }

        let p0 = window.geoportal.mapa.map.latLngToContainerPoint([data.lat0, data.lng0]);
        let p1 = window.geoportal.mapa.map.latLngToContainerPoint([data.lat1, data.lng1]);
        this.canvas.style.left = p0.x + "px";
        this.canvas.style.top = p1.y + "px";
        this.canvas.style.width = (p1.x - p0.x + 1) + "px";
        this.canvas.style.height = (p0.y - p1.y + 1) + "px";
        const pxRatio = this.config.retina?2:1;
        this.canvas.width = this.canvas.clientWidth * pxRatio;
        this.canvas.height = this.canvas.clientHeight * pxRatio;

        if (!this.wind) {
            const gl = this.canvas.getContext('webgl', {antialiasing: false});
            this.wind = new WindGL(gl);
            this.frame();
        } else {
            this.wind.resize();
        }
        this.wind.numParticles = this.config.nParticulas;
        this.wind.speedFactor = this.config.velocidad;
        this.wind.setColorRamp(this.rampColors);
        this.wind.setWind(data);
    }

    frame() {
        if (!this.wind) return;
        if (this.wind.windData) this.wind.draw();
        requestAnimationFrame(_ => this.frame());
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
        return this.capa.nombre + " / Partículas";
    }
}

window.geoportal.capas.registraVisualizador("base", "particulas", VisualizadorParticulas, "Partículas", "base/img/particulas.svg");
