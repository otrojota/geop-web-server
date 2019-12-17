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
    }
    async destruye() {
        window.geoportal.mapa.eliminaCapaMapa(this.lyBandas);
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
        this.capa.resuelveConsulta("isobandas", args, (err, geoJSON) => {
            if (err) {
                console.error(err);
                return;
            }
            // Aplicar color
            EscalaGeoportal.creaDesdeConfig(this.config.escala)
                .then(escala => {
                    escala.actualizaLimites(min, max);
                    geoJSON.features.forEach(f => {
                        let value = (f.properties.minValue + f.properties.maxValue) / 2;
                        f.properties.value = value;
                        f.properties.color = escala.getColor(value);
                        f.properties.type = "isoband";
                    });
                    this.geoJSON = geoJSON;
                    this.repinta();
                })
                .catch(err => console.error(err));            
        });;
    }

    repinta() {
        this.lyBandas.clearLayers();
        this.lyBandas.addData(this.geoJSON);
    }
}

window.geoportal.capas.registraVisualizador("base", "isobandas", VisualizadorIsobandas, "Isobandas", "base/img/isobandas.svg");
