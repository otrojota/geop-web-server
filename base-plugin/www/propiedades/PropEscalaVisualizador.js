class PropEscalaVisualizador extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "escala";  
        this.options = options;
        this.visualizador = options.item;
        this.finishWorkingListener = _ => {
            this.edMin.value = this.visualizador.escala.min;
            this.edMax.value = this.visualizador.escala.max;
            this.escala.actualizaLimites(this.visualizador.escala.min, this.visualizador.escala.max);
            this.escala.refrescaPreview($(this.previewEscala.view));
        }
        this.visualizador.addWorkingListener("finish", this.finishWorkingListener);
        //this.escala = await EscalaGeoportal.creaDesdeConfig(this.visualizador.escala);
        this.escala = await EscalaGeoportal.porNombre(this.visualizador.escala.nombre);
        this.edTipoEscala.setRows(EscalaGeoportal.getBibliotecaEscalas());
    } 
    async destruye() {
        this.visualizador.removeWorkingListener(this.finishWorkingListener)
    }
    get config() {
        let c = this.visualizador.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.visualizador.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.visualizador.configPanel.configSubPaneles[this.codigo];
    }
    onImgAbierto_click() {
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
        if (this.visualizador.escala.nombre) this.edTipoEscala.value = this.visualizador.escala.nombre;
        this.edAutomatica.checked = this.visualizador.escala.dinamica;
        if (this.visualizador.escala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        if (this.visualizador.escala.min !== undefined) this.edMin.value = this.visualizador.escala.min;
        if (this.visualizador.escala.max !== undefined) this.edMax.value = this.visualizador.escala.max;
        if (this.visualizador.escala.min !== undefined) {
            this.escala.actualizaLimites(this.visualizador.escala.min, this.visualizador.escala.max);
            this.escala.refrescaPreview($(this.previewEscala.view));
        }
    }
    onEdAutomatica_change() {
        this.visualizador.escala.dinamica = this.edAutomatica.checked;
        if (this.visualizador.escala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        this.visualizador.refresca();
    }
    onEdMin_change() {
        let v = parseFloat(this.edMin.value);
        if (!isNaN(v)) this.visualizador.escala.min = v;
        this.visualizador.refresca();
    }
    onEdMax_change() {
        let v = parseFloat(this.edMax.value);
        if (!isNaN(v)) this.visualizador.escala.max = v;
        this.visualizador.refresca();
    }
    async onEdTipoEscala_change() {
        this.visualizador.escala.nombre = this.edTipoEscala.value;
        this.visualizador.refresca();
        this.escala = await EscalaGeoportal.porNombre(this.visualizador.escala.nombre);
        this.escala.actualizaLimites(this.visualizador.escala.min, this.visualizador.escala.max);
        this.escala.refrescaPreview($(this.previewEscala.view));
    }
}
ZVC.export(PropEscalaVisualizador);