class PropEscalaObservadorGeoJson extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "escala-observador";  
        this.options = options;
        this.capa = options.item;
        this.observador = this.capa.observadorGeoJson;
        this.observador.setCambioEscalaListener(_ => {
            this.edMin.value = this.observador.configEscala.min;
            this.edMax.value = this.observador.configEscala.max;
            this.escala.actualizaLimites(this.observador.configEscala.min, this.observador.configEscala.max);
            this.escala.refrescaPreview($(this.previewEscala.view));
        });
        this.escala = await EscalaGeoportal.porNombre(this.observador.configEscala.nombre);
        this.edTipoEscala.setRows(EscalaGeoportal.getBibliotecaEscalas());
    } 
    async destruye() {
        this.observador.setCambioEscalaListener(null);
    }
    get config() {
        let c = this.observador.capa.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.observador.capa.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.observador.capa.configPanel.configSubPaneles[this.codigo];
    }

    informaCambio() {
        this.observador.cambioEscala();
    }

    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
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
        this.titulo.text = "Configurar Escala";
        if (this.observador.configEscala.nombre) this.edTipoEscala.value = this.observador.configEscala.nombre;
        this.edAutomatica.checked = this.observador.configEscala.dinamica;
        if (this.observador.configEscala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        if (this.observador.configEscala.min !== undefined) this.edMin.value = this.observador.configEscala.min;
        if (this.observador.configEscala.max !== undefined) this.edMax.value = this.observador.configEscala.max;
        if (this.observador.configEscala.min !== undefined) {
            this.escala.actualizaLimites(this.observador.configEscala.min, this.observador.configEscala.max);
            this.escala.refrescaPreview($(this.previewEscala.view));
        }
    }
    onEdAutomatica_change() {
        this.observador.configEscala.dinamica = this.edAutomatica.checked;
        if (this.observador.configEscala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        this.informaCambio();
    }
    onEdMin_change() {
        let v = parseFloat(this.edMin.value);
        if (!isNaN(v)) this.observador.configEscala.min = v;
        this.informaCambio();
    }
    onEdMax_change() {
        let v = parseFloat(this.edMax.value);
        if (!isNaN(v)) this.observador.configEscala.max = v;
        this.informaCambio();
    }
    async onEdTipoEscala_change() {
        this.observador.configEscala.nombre = this.edTipoEscala.value;
        this.escala = await EscalaGeoportal.porNombre(this.observador.configEscala.nombre);
        this.escala.actualizaLimites(this.observador.configEscala.min, this.observador.configEscala.max);
        this.escala.refrescaPreview($(this.previewEscala.view));
        this.informaCambio();
    }
}
ZVC.export(PropEscalaObservadorGeoJson);