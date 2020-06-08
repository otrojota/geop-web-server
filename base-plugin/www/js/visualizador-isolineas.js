class VisualizadorIsolineas extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
            lineWidth:1,
            lineColor:"#000000",
            autoStep:true
        }
        let conf = $.extend(defaultConfig, config);
        super("isolineas", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:280, width:300,
            configSubPaneles:{}
        }       
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.isolineas;
    }

    get lineWidth() {return this.config.lineWidth}
    set lineWidth(w) {this.config.lineWidth = w; this.repinta();}
    get lineColor() {return this.config.lineColor}
    set lineColor(c) {this.config.lineColor = c; this.repinta();}
    get autoStep() {return this.config.autoStep}
    set autoStep(a) {this.config.autoStep = a; this.refresca()}
    get step() {return this.config.step}
    set step(s) {this.config.step = s; this.refresca()}

    async crea() {
        this.panelCurvas = window.geoportal.mapa.creaPanelMapa(this.capa, "curvas" + parseInt(Math.random() * 10000), 6);
        this.panelCurvas.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelCurvas);
        this.panelMarkers = window.geoportal.mapa.creaPanelMapa(this.capa, "markers", 7);
        this.panelMarkers.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelMarkers);
        this.styleFunction = feature => {
            return {color: this.config.lineColor, weight: this.config.lineWidth, opacity: 1.0}
        };
        this.lyCurvas = L.geoJSON([], {            
            style:this.styleFunction,
            pane:this.panelCurvas.id
        }).addTo(window.geoportal.mapa.map);
        this.worker = new Worker("base/js/heavy-workers.js");
        this.worker.onmessage = e => this.workerMessage(e.data);
        this.workerOpIndex = 0;
        this.workerCallbacks = [];
    }
    async destruye() {
        window.geoportal.mapa.eliminaCapaMapa(this.lyCurvas);
        window.geoportal.mapa.eliminaPanelMapa(this.panelMarkers);
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
        super.refresca();
        this.startWorking();
        this.lyCurvas.clearLayers();
        this.panelMarkers.innerHTML = "";
        this.capa.getPreConsulta((err, preconsulta) => {
            if (err) {
                this.finishWorking();
                this.mensajes.addError(err.toString());
                console.error(err);
                return;
            }
            this.preconsulta = preconsulta;
            this.mensajes.parse(preconsulta);
            try {
                this.refresca2();
            } catch(err) {
                this.mensajes.addError(err.toString());
                throw err;
            }
        })
    }
    refresca2() {
        let min = this.preconsulta.min, max = this.preconsulta.max;
        console.log("preconsulta", this.preconsulta);  
        if (min === max) throw "No hay datos";
        let step = this.config.step;
        if (this.config.autoStep || step === undefined) {
            step = Math.pow(10, parseInt(Math.log10(max - min) - 1));
            while (parseInt((max - min) / step) < 10) step /= 2;
            while (parseInt((max - min) / step) > 30) step *= 2;
            this.config.step = step;
            this.mensajes.addInformacion("Se usa incremento calculado entre líneas: " + step);
        } else {
            if ((max - min) / step > 50) throw "Demasiadas Líneas, aumente el incremento"
        }
        let args = JSON.parse(JSON.stringify(this.preconsulta));
        args.incremento = step;
        this.capa.resuelveConsulta("isolineas", args, (err, ret) => {
            if (err) {
                this.finishWorking();
                this.mensajes.addError(err.toString());
                console.error(err);
                return;
            }
            let shpURL = this.capa.getURLResultado(ret.fileName);
            this.doInWorker("getIsolineas", {url:shpURL})
                .then(ret => {
                    if (ret.error) {
                        this.finishWorking();
                        this.mensajes.addError(ret.error);
                        console.error(ret.error);
                        return;
                    }
                    this.geoJSON = ret.isolineas;
                    this.marcadores = ret.marcadores;
                    this.repinta();
                    this.finishWorking();
                })
                .catch(err => {
                    this.finishWorking();
                    console.error(error);
                });
        });;
    }

    repinta() {
        this.lyCurvas.clearLayers();
        this.lyCurvas.addData(this.geoJSON);        
        this.marcadores.forEach(m => {
            let icon = L.divIcon({className: 'iso-label', html:"" + m.value});
            let marker = L.marker([m.lat, m.lng], {icon:icon, opacity:1.0, pane:this.panelMarkers.id});
            marker.addTo(window.geoportal.mapa.map);
        })
    }

    cambioOpacidadCapa(opacidad) {
        this.panelCurvas.style.opacity = this.capa.opacidad / 100;
        this.panelMarkers.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"base/propiedades/PropIsolineas"
        }];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Isolineas";
    }
}

window.geoportal.capas.registraVisualizador("base", "isolineas", VisualizadorIsolineas, "Isolíneas", "base/img/isolineas.svg");
