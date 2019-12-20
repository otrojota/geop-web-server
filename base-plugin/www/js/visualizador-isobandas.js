class VisualizadorIsobandas extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
            resolucion:2,
            escala:{
                dinamica:true,
                tipo:"esquemaPG",
                url:"/js/escalas-pg/nasa-oc-sst.pg"
            }
        }
        let conf = $.extend(defaultConfig, config);
        super("isobandas", capa, conf);
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.isobandas;
    }

    async crea() {
        this.panelBandas = window.geoportal.mapa.creaPanelMapa(this.capa, "bandas" + parseInt(Math.random() * 10000), 3);
        this.panelBandas.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelBandas);
        this.styleFunction = feature => {
            return {fillColor:feature.properties.color, fillOpacity:1.0, opacity:1.0, color:feature.properties.color, weight:0.5}
        };
        this.lyBandas = L.geoJSON([], {            
            style:this.styleFunction,
            pane:this.panelBandas.id
        }).addTo(window.geoportal.mapa.map);        
        this.worker = cw((arg, cb) => {
            try {
                let url = arg.url;
                let config = arg.config;
                let baseURL = arg.baseURL;
                importScripts("base/js/shapefile-0.6.6.js", "../js/geoportal-escalas.js");                
                shapefile.read(url)
                    .then(geoJSON => {
                        EscalaGeoportal.creaDesdeConfig(config.escala, baseURL)
                            .then(escala => {
                                escala.actualizaLimites(arg.min, arg.max);
                                geoJSON.features.forEach(f => {
                                    let value = (f.properties.minValue + f.properties.maxValue) / 2;
                                    f.properties.value = value;
                                    f.properties.color = escala.getColor(value);
                                    f.properties.type = "isoband";
                                });
                                this.geoJSON = geoJSON;
                                cb({isobandas:geoJSON});
                            })
                            .catch(err => cb({error:err})); 
                    })
                    .catch(err => cb({error:err}));
                } catch(err) {
                    cb(err);
                }
        });
    }
    async destruye() {
        window.geoportal.mapa.eliminaCapaMapa(this.lyBandas);
        this.worker.close().then(_ => this.worker = null);
    }
    refresca() {
        this.lyBandas.clearLayers();
        this.capa.getPreConsulta((err, preconsulta) => {
            if (err) {
                console.error(err);
                return;
            }
            this.preconsulta = preconsulta;
            this.refresca2();
        })
    }
    refresca2() {
        let min = this.preconsulta.min, max = this.preconsulta.max;
        if (min === max) throw "No hay datos";
        let step = this.config.step;
        if (this.config.autoStep || step === undefined) {
            step = Math.pow(10, parseInt(Math.log10(max - min) - 1));
            while (parseInt((max - min) / step) > 30) step *= 2;
        } else {
            if ((max - min) / step > 50) throw "Demasiadas Bandas, aumente el incremento"
        }
        step /= this.config.resolucion;
        let args = JSON.parse(JSON.stringify(this.preconsulta));
        args.incremento = step;
        //args.incremento = 4;
        let t0 = new Date();
        console.log("consultando ...");
        this.capa.resuelveConsulta("isobandas", args, (err, ret) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("respuesta en " + (new Date() - t0) + "[ms]", ret)
            let shpURL = this.capa.getURLResultado(ret.fileName);
            let baseURL = window.location.origin + window.location.pathname;
            if (baseURL.endsWith("/")) baseURL = baseURL.substr(0, baseURL.length - 1);
            this.worker.data({url:shpURL, config:this.config, min:min, max:max, baseURL:baseURL})
                .then(ret => {
                    if (ret.error) {
                        console.error(ret.error);
                        return;
                    }
                    this.geoJSON = ret.isobandas;
                    this.repinta();
                })           
        });;
    }

    repinta() {
        this.lyBandas.clearLayers();
        this.lyBandas.addData(this.geoJSON);
    }
}

window.geoportal.capas.registraVisualizador("base", "isobandas", VisualizadorIsobandas, "Isobandas", "base/img/isobandas.svg");
