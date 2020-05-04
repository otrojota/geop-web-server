class GeoJsonObserva extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "geojson-observa";  
        this.options = options;
        this.capa = options.item;
        this.arbolAgregar = await window.geoportal.getArbolAgregarObservadorGeoJson(this.capa);
        this.edHPos.setRows([{pos:"izquierda", nombre:"Izquierda"}, {pos:"centro", nombre:"Centro"}, {pos:"derecha", nombre:"Derecha"}]);
        this.edVPos.setRows([{pos:"arriba", nombre:"Arriba"}, {pos:"centro", nombre:"Centro"}, {pos:"abajo", nombre:"Abajo"}]);
    }    
    async destruye() {}
    get config() {
        let c = this.capa.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.capa.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.capa.configPanel.configSubPaneles[this.codigo];
    }
    get mostrarEnMapa() {return this.config.mostrarEnMapa}

    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onCmdObservar_click() {                
        this.zpop = new ZPop(this.caretObservar.view, this.arbolAgregar, {vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, onClick:async (codigo, item) => {
            this.config.itemObservado = item.item;
            this.capa.observadorGeoJson = ObservadorGeoJson.creaObservador(this.capa, item.item);
            await this.capa.observadorGeoJson.refresca();
            this.capa.cambioObservadorGeoJson();
            if (!this.capa.configPanel.flotante) {
                if (window.capasController) {
                    await window.capasController.refrescaPanelPropiedades(true);
                }
            } else {
                let panelCapa = window.geoportal.capas.getGrupoActivo().getPanelesFlotantes().find(p => p.idItem == this.capa.id);
                if (panelCapa) {
                    await panelCapa.creaDesde(null);
                    await panelCapa.creaDesde(this.capa);
                }
            }
        }});
        this.zpop.show();
    }
    refresca() {
        if (this.config.abierto) {
            this.imgAbierto.removeClass("fa-plus-square");
            this.imgAbierto.addClass("fa-minus-square");
            this.contenido.show();
        } else {
            this.imgAbierto.removeClass("fa-minus-square");
            this.imgAbierto.addClass("fa-plus-square");
            this.contenido.hide();
        }
        if (!this.capa.observadorGeoJson) {
            this.cntObserva.hide();
            return;
        };
        this.cntObserva.show();
        this.titulo.text = this.capa.observadorGeoJson.getTituloPanel();
        this.cmdObservar.text = this.capa.observadorGeoJson.getNombreItem();
        this.edMostrarEnMapa.checked = this.config.mostrarEnMapa;
        this.edHPos.value = this.config.hPos;
        this.edVPos.value = this.config.vPos;
    }

    onEdMostrarEnMapa_change() {
        this.config.mostrarEnMapa = this.edMostrarEnMapa.checked;
        this.capa.cambioObservadorGeoJson();
    }
    onEdHPos_change() {
        this.config.hPos = this.edHPos.value;
        this.capa.cambioObservadorGeoJson();
    }
    onEdVPos_change() {
        this.config.vPos = this.edVPos.value;
        this.capa.cambioObservadorGeoJson();
    }
}
ZVC.export(GeoJsonObserva);