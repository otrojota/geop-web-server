class VisualizadorTiles extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {}
        let conf = $.extend(defaultConfig, config);
        super("tiles", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:280, width:300,
            configSubPaneles:{}
        }
        this.escala = config.escala;
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.tiles;
    }
    static get hidden() {return true}

    async crea() {
        this.panelMapa = window.geoportal.mapa.creaPanelMapa(this.capa, "tiles" + parseInt(Math.random() * 10000), 4);
        this.panelMapa.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelMapa);   
    }
    async destruye() {
        if (this.lyTiles) window.geoportal.mapa.eliminaCapaMapa(this.lyTiles);
        window.geoportal.mapa.eliminaPanelMapa(this.panelMapa);
    }

    async refresca() {
        try {
            this.startWorking();
            super.refresca();
            let url;
            if (this.capa.helper) url = this.capa.helper.getTilesUrl(this.capa);
            if (!url) url = capa.config.options.tilesUrl;
            if (!this.lyTiles) {
                let options = {pane:this.panelMapa.id};
                options.tiempo = parseInt(window.geoportal.tiempo / 1000);        
                this.lyTiles = L.tileLayer(url, options).addTo(window.geoportal.mapa.map);
            } else {
                this.lyTiles.setUrl(url);
            }
        } catch(error) {
            this.mensajes.addError(error.toString());
            console.error(error);
        } finally {
            this.finishWorking();
        }
    }

    cambioOpacidadCapa(opacidad) {
        this.panelMapa.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"escala",
            path:"base/propiedades/PropEscalaVisualizador"
        }];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Capa Tiles";
    }    
}

window.geoportal.capas.registraVisualizador("base", "tiles", VisualizadorTiles, "Tiles", "base/img/tiles.svg");
