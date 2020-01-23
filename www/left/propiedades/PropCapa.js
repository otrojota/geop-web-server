class PropCapa extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "props";  
        this.options = options;
        this.capa = options.item;                
    }    
    async destruye() {}
    get config() {
        let c = this.capa.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.capa.configPanel.configSubPaneles[this.codigo] = {
            abierto:true
        }
        return this.capa.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onEdNombre_change() {
        this.capa.nombre = this.edNombre.value;
        this.options.contenedor.cambioNombre();
        window.geoportal.editoObjeto("capa", this.capa);
    }
    refresca() {              
        if (!this.edOpacidad.view.noUiSlider) {
            noUiSlider.create(this.edOpacidad.view, {
                start: this.capa.opacidad,
                step:5,
                range: {'min': 0,'max': 100}
            });
        }
        this.edOpacidad.view.noUiSlider.on("slide", v => {
            let value = parseFloat(v[0]);
            this.capa.opacidad = value;
        });
        if (this.config.abierto) {
            this.imgAbierto.removeClass("fa-plus-square");
            this.imgAbierto.addClass("fa-minus-square");
            this.contenido.show();
        } else {
            this.imgAbierto.removeClass("fa-minus-square");
            this.imgAbierto.addClass("fa-plus-square");
            this.contenido.hide();
        }
        this.titulo.text = "Propiedades de la Capa";
        this.edNombre.value = this.capa.nombre;
    }
}
ZVC.export(PropCapa);