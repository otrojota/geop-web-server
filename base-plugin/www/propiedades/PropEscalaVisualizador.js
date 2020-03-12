class PropEscalaVisualizador extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "escala";  
        this.options = options;
        this.visualizador = options.item;
        this.finishWorkingListener = _ => {
            let hayLimites = this.visualizador.escala.min !== undefined && this.visualizador.escala.max !== undefined;
            if (hayLimites) {
                this.edMin.value = this.visualizador.escala.min;
                this.edMax.value = this.visualizador.escala.max;
                this.escala.actualizaLimites(this.visualizador.escala.min, this.visualizador.escala.max);
            }
            this.escala.refrescaPreview($(this.previewEscala.view));
        }
        this.visualizador.addWorkingListener("finish", this.finishWorkingListener);
        this.escala = await EscalaGeoportal.porNombre(this.visualizador.escala.nombre);
        this.edTipoEscala.setRows(EscalaGeoportal.getBibliotecaEscalas());
        this.mouseOutListener = e => {
            this.unidad.view.style.removeProperty("background-color");
            let hayLimites = this.visualizador.escala.min !== undefined && this.visualizador.escala.max !== undefined;
            this.unidad.text = hayLimites?this.nombreUnidad:"";
        }
        this.mouseMoveListener = e => {
            let hayLimites = this.visualizador.escala.min !== undefined && this.visualizador.escala.max !== undefined;
            if (!hayLimites) return;
            let x = e.clientX - e.target.getBoundingClientRect().left;
            let v = this.escala.min + (this.escala.max - this.escala.min) * x / this.previewEscala.size.width;
            let color = this.escala.getColor(v);
            this.unidad.view.style["background-color"] = color;
            let fmt = GeoPortal.round(v, 2).toLocaleString() + " [" + this.nombreUnidad + "]";
            this.unidad.text = fmt;
        }
        this.previewEscala.view.addEventListener("mouseout", this.mouseOutListener);
        this.previewEscala.view.addEventListener("mousemove", this.mouseMoveListener);
    } 
    async destruye() {
        this.visualizador.removeWorkingListener(this.finishWorkingListener)
        this.previewEscala.view.removeEventListener("mouseout", this.mouseOutListener, false);
        this.previewEscala.view.removeEventListener("mousemove", this.mouseMoveListener, false);
    }
    get config() {
        let c = this.visualizador.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.visualizador.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.visualizador.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    refresca() {
        this.nombreUnidad = "";
        if (this.visualizador.escala.unidad) {
            this.nombreUnidad = this.visualizador.escala.unidad;
        } else {
            if (this.visualizador.capa && this.visualizador.capa.unidad) {
                this.nombreUnidad = this.visualizador.capa.unidad;
            }
        }
        let hayLimites = this.visualizador.escala.min !== undefined && this.visualizador.escala.max !== undefined;
        if (hayLimites) this.unidad.text = this.nombreUnidad;
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
        if (this.visualizador.escala.bloqueada) this.edTipoEscala.disable();
        this.edAutomatica.checked = this.visualizador.escala.dinamica;
        if (this.visualizador.escala.bloqueada) this.edAutomatica.disable();
        if (this.visualizador.escala.dinamica || this.visualizador.escala.bloqueada) {
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
        } else {
            this.escala.actualizaLimites(0,1);
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