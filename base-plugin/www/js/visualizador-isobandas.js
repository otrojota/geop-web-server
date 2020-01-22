class VisualizadorIsobandas extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
            autoStep:2,
            escala:{
                dinamica:true,
                nombre:"sst - NASA OceanColor",
                min:0, max:1
            }
        }
        let conf = $.extend(defaultConfig, config);
        super("isobandas", capa, conf);
        this.configPanel = {
            flotante:false,
            height:200, width:300,
            configSubPaneles:{}
        }  
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.isobandas;
    }

    get autoStep() {return this.config.autoStep}
    set autoStep(a) {this.config.autoStep = a; this.refresca()}
    get step() {return this.config.step}
    set step(s) {this.config.step = s; this.refresca()}
    get escala() {return this.config.escala}    

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
        this.worker = new Worker("base/js/heavy-workers.js");
        this.worker.onmessage = e => this.workerMessage(e.data);
        this.workerOpIndex = 0;
        this.workerCallbacks = [];
    }
    async destruye() {
        window.geoportal.mapa.eliminaCapaMapa(this.lyBandas);
        if (this.worker) this.worker.terminate();
        this.worker = undefined;
    }
    doInWorker(operation, data) {
        return new Promise((onOk, onError) => {
            this.workerCallbacks[this.workerOpIndex] = {onOk:onOk, onError:onError};
            this.worker.postMessage({operation:operation, operationId:this.workerOpIndex++, data:data});
        });
    }
    workerMessage(data) {
        let cb = this.workerCallbacks[data.id];
        if (!cb) {
            console.error("Respuesta de worker sin callback:" + data.id);
            return;
        }
        delete this.workerCallbacks[data.id];
        if (data.error) {
            cb.onError(data.error);
        } else {
            cb.onOk(data.data);
        }        
    }
    refresca() {
        this.startWorking();
        this.lyBandas.clearLayers();
        this.capa.getPreConsulta((err, preconsulta) => {
            if (err) {
                this.finishWorking();
                console.error(err);
                return;
            }
            this.preconsulta = preconsulta;
            this.refresca2();
        })
    }
    refresca2() {
        let min, max;
        if (this.config.escala.dinamica) {
            min = this.preconsulta.min;
            max = this.preconsulta.max;
            this.config.escala.min = min;
            this.config.escala.max = max;
            if (min === max) throw "No hay datos";
        } else {
            min = this.config.escala.min;
            max = this.config.escala.max;
        }
        
        let step = this.config.step;
        if (this.config.autoStep || step === undefined) {
            step = Math.pow(10, parseInt(Math.log10(max - min) - 1));
            while (parseInt((max - min) / step) > 60) step *= 2;
            this.config.step = step;
        } else {
            if ((max - min) / step > 100) throw "Demasiadas Bandas, aumente el incremento"
        }
        let args = JSON.parse(JSON.stringify(this.preconsulta));
        args.incremento = step;
        this.capa.resuelveConsulta("isobandas", args, (err, ret) => {
            if (err) {
                this.finishWorking();
                console.error(err);
                return;
            }
            let shpURL = this.capa.getURLResultado(ret.fileName);
            let baseURL = window.location.origin + window.location.pathname;
            if (baseURL.endsWith("/")) baseURL = baseURL.substr(0, baseURL.length - 1);
            //this.worker.data({url:shpURL, config:this.config, min:min, max:max, baseURL:baseURL})
            this.doInWorker("getIsobandas", {url:shpURL, config:this.config, min:min, max:max, baseURL:baseURL})
                .then(ret => {
                    if (ret.error) {
                        this.finishWorking();
                        console.error(ret.error);
                        return;
                    }
                    this.geoJSON = ret.isobandas;
                    this.repinta();
                    this.finishWorking();
                })           
        });;
    }

    repinta() {
        this.lyBandas.clearLayers();
        this.lyBandas.addData(this.geoJSON);
    }
    cambioOpacidadCapa(opacidad) {
        this.panelBandas.style.opacity = opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"base/propiedades/PropIsobandas"
        }, {
            codigo:"escala",
            path:"base/propiedades/PropEscalaVisualizador"
        }];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Isobandas";
    }
}

window.geoportal.capas.registraVisualizador("base", "isobandas", VisualizadorIsobandas, "Isobandas", "base/img/isobandas.svg");
