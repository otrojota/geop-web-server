class PropEscalaAnalizador extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "escala";  
        this.options = options;
        this.analizador = options.analizador;
        this.options.contenedor.onRefrescado = _ => {
            this.edMin.value = this.analizador.escala.min;
            this.edMax.value = this.analizador.escala.max;
            this.escala.actualizaLimites(this.analizador.escala.min, this.analizador.escala.max);
            this.escala.refrescaPreview($(this.previewEscala.view));
        }
        this.escala = await EscalaGeoportal.porNombre(this.analizador.escala.nombre);
        this.edTipoEscala.setRows(EscalaGeoportal.getBibliotecaEscalas());
    } 
    async destruye() {
        this.options.contenedor.onRefrescado = null;
    }
    get config() {
        let c = this.analizador.config.paneles[this.codigo];
        if (c) return c;
        this.analizador.config.paneles[this.codigo] = {
            abierto:false
        }
        return this.analizador.config.paneles[this.codigo];
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
        if (this.analizador.escala.nombre) this.edTipoEscala.value = this.analizador.escala.nombre;
        this.edAutomatica.checked = this.analizador.escala.dinamica;
        if (this.analizador.escala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        if (this.analizador.escala.min !== undefined) this.edMin.value = this.analizador.escala.min;
        if (this.analizador.escala.max !== undefined) this.edMax.value = this.analizador.escala.max;
        if (this.analizador.escala.min !== undefined) {
            this.escala.actualizaLimites(this.analizador.escala.min, this.analizador.escala.max);
            this.escala.refrescaPreview($(this.previewEscala.view));
        }
    }
    onEdAutomatica_change() {
        this.analizador.escala.dinamica = this.edAutomatica.checked;
        if (this.analizador.escala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        this.options.contenedor.redibujaPanelAnalisis();
    }
    onEdMin_change() {
        let v = parseFloat(this.edMin.value);
        if (!isNaN(v)) this.analizador.escala.min = v;
        this.options.contenedor.redibujaPanelAnalisis();
    }
    onEdMax_change() {
        let v = parseFloat(this.edMax.value);
        if (!isNaN(v)) this.analizador.escala.max = v;
        this.options.contenedor.redibujaPanelAnalisis();
    }
    async onEdTipoEscala_change() {
        this.analizador.escala.nombre = this.edTipoEscala.value;
        this.options.contenedor.redibujaPanelAnalisis();
        this.escala = await EscalaGeoportal.porNombre(this.analizador.escala.nombre);
        this.escala.actualizaLimites(this.analizador.escala.min, this.analizador.escala.max);
        this.escala.refrescaPreview($(this.previewEscala.view));
    }
}
ZVC.export(PropEscalaAnalizador);