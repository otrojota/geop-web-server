class FechaCapa extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "fecha";  
        this.options = options;
        this.capa = options.item;        
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
        this.refrescaTitulo();
        if (this.capa.tiempoFijo) {
            this.edFijar.checked = true;
            this.edTiempo.value = TimeUtils.fromUTCMillis(this.capa.tiempoFijo);
            this.edTiempo.show();
        } else {
            this.edFijar.checked = false;            
            this.edTiempo.hide();
        }
        this.edFijar.checked = this.capa.tiempoFijo?true:false;
        
    }
    refrescaTitulo() {
        if (this.capa.tiempoFijo) {
            this.titulo.text = "Tiempo Fijo: " + TimeUtils.fromUTCMillis(this.capa.tiempoFijo).format("DD/MM/YYYY HH:mm");
        } else {
            this.titulo.text = "Fijar Tiempo";
        }
    }
    onEdFijar_change() {
        if (this.edFijar.checked) {
            this.edTiempo.value = TimeUtils.now;
            this.edTiempo.show();
            this.capa.tiempoFijo = this.edTiempo.value.valueOf();
            this.capa.cambioTiempo();
        } else {
            this.edTiempo.hide();
            this.capa.tiempoFijo = null;
            this.capa.cambioTiempo();
        }
    }
    onEdTiempo_change() {
        this.capa.tiempoFijo = this.edTiempo.value.valueOf();
        this.capa.cambioTiempo();
    }
}
ZVC.export(FechaCapa);