class VisualizadorIsolineas extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {
            lineWidth:1,
            lineColor:"black",
            autoStep:true
        }
        let conf = $.extend(defaultConfig, config);
        super("isolineas", capa, conf);        
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.isolineas;
    }

    async crea() {
        this.panelCurvas = window.geoportal.mapa.creaPanelMapa(this.capa, "curvas" + parseInt(Math.random() * 10000), 6);
        this.panelCurvas.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelCurvas);
        this.panelMarkers = window.geoportal.mapa.creaPanelMapa(this.capa, "markers", 7);
        this.capa.registraPanelMapa(this.panelMarkers);
        this.styleFunction = feature => {
            return {color: this.config.lineColor, weight: this.config.lineWidth, opacity: 1.0}
        };
        this.lyCurvas = L.geoJSON([], {            
            style:this.styleFunction,
            pane:this.panelCurvas.id
        }).addTo(window.geoportal.mapa.map);
        this.worker = cw((url, cb) => {
            try {
                importScripts("base/js/shapefile-0.6.6.js");
                shapefile.read(url)
                    .then(geoJSON => {
                        let marcadores = [];
                        geoJSON.features.forEach(f => {
                            if (f.geometry.type == "LineString") {
                                let v = Math.round(f.properties.value * 100) / 100;
                                let n = f.geometry.coordinates.length;
                                let med = parseInt((n - 0.1) / 2);
                                let p0 = f.geometry.coordinates[med], p1 = f.geometry.coordinates[med+1];
                                let lng = (p0[0] + p1[0]) / 2;
                                let lat = (p0[1] + p1[1]) / 2;
                                marcadores.push({lat:lat, lng:lng, value:v});
                            }
                        });
                        cb({isolineas:geoJSON, marcadores:marcadores});
                    })
                    .catch(err => cb({error:err}));
                } catch(err) {
                    cb(err);
                }
        });
    }
    async destruye() {
        window.geoportal.mapa.eliminaCapaMapa(this.lyCurvas);
        window.geoportal.mapa.eliminaPanelMapa(this.panelMarkers);
        this.worker.close().then(_ => this.worker = null);
    }
    refresca() {
        this.lyCurvas.clearLayers();
        this.panelMarkers.innerHTML = "";
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
            if ((max - min) / step > 50) throw "Demasiadas Líneas, aumente el incremento"
        }
        let args = JSON.parse(JSON.stringify(this.preconsulta));
        args.incremento = step;
        let t0 = new Date();
        console.log("consultando ...");
        this.capa.resuelveConsulta("isolineas", args, (err, ret) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log("respuesta en " + (new Date() - t0) + "[ms]", ret)
            let shpURL = this.capa.getURLResultado(ret.fileName);
            this.worker.data(shpURL)
                .then(ret => {
                    if (ret.error) {
                        console.error(ret.error);
                        return;
                    }
                    this.geoJSON = ret.isolineas;
                    this.marcadores = ret.marcadores;
                    this.repinta();
                })
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
}

window.geoportal.capas.registraVisualizador("base", "isolineas", VisualizadorIsolineas, "Isolíneas", "base/img/isolineas.svg");
