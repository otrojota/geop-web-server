class VisualizadorGeoJSON extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {}
        let conf = $.extend(defaultConfig, config);
        super("geojson", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:180, width:300,
            configSubPaneles:{}
        }       
    }
    static aplicaACapa(capa) {
        return capa.tipo == "vectorial" && capa.formatos.geoJSON;
    }

    async crea() {
        this.panelMapa = window.geoportal.mapa.creaPanelMapa(this.capa, "geojson" + parseInt(Math.random() * 10000), 6);
        this.panelMapa.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelMapa);
        let options = {
            pane:this.panelMapa.id,
            onEachFeature:function(feature, layer) {
                console.log("onEach", feature);
                layer.on("mouseover", function() {
                    console.log("mouseover", this);
                });
                layer.on("mouseoout", function() {
                    console.log("mouseout", this);
                })
            }
        };
        if (this.capa.config.estilos) options.style = eval("(" + this.capa.config.estilos + ")");
        this.lyGeoJSON = L.geoJSON([], options).addTo(window.geoportal.mapa.map);
    }
    async destruye() {
        window.geoportal.mapa.eliminaCapaMapa(this.lyGeoJSON);
        window.geoportal.mapa.eliminaPanelMapa(this.panelMapa);
    }

    getGeoJSON() {
        return new Promise((resolve, reject) => {
            this.capa.resuelveConsulta("geoJSON", {}, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }
    async refresca() {
        try {
            this.startWorking();
            super.refresca();
            this.lyGeoJSON.clearLayers();
            this.geoJSON = await this.getGeoJSON();
            console.log("geoJSON", this.geoJSON);
            this.repinta();
        } catch(error) {
            this.mensajes.addError(error.toString());
            console.error(error);
        } finally {
            this.finishWorking();
        }
    }

    repinta() {
        this.lyGeoJSON.clearLayers();
        this.lyGeoJSON.addData(this.geoJSON);        
    }

    cambioOpacidadCapa(opacidad) {
        this.panelMapa.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Geo JSON";
    }
}

window.geoportal.capas.registraVisualizador("base", "geojson", VisualizadorGeoJSON, "Geo-JSON", "base/img/geojson.svg");
