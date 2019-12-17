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
    }
    async destruye() {
        window.geoportal.mapa.eliminaCapaMapa(this.lyCurvas);
        window.geoportal.mapa.eliminaPanelMapa(this.panelMarkers);
    }
    refresca() {
        this.lyCurvas.clearLayers();
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
        console.log("preconsulta desde visualizador", this.preconsulta);
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
        this.capa.resuelveConsulta("isolineas", args, (err, geoJSON) => {
            if (err) {
                console.error(err);
                return;
            }
            this.geoJSON = geoJSON;
            this.repinta();
        });;
    }

    repinta() {
        this.lyCurvas.clearLayers();
        this.lyCurvas.addData(this.geoJSON);
    }
}

window.geoportal.capas.registraVisualizador("base", "isolineas", VisualizadorIsolineas, "Isolíneas", "base/img/isolineas.svg");
