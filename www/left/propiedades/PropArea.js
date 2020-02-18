class PropArea extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "props";  
        this.options = options;
        this.area = options.item;
    }    
    async destruye() {}
    get config() {
        let c = this.area.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.area.configPanel.configSubPaneles[this.codigo] = {
            abierto:true
        }
        return this.area.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onEdNombre_change() {
        this.area.nombre = this.edNombre.value;
        this.options.contenedor.cambioNombre();
        window.geoportal.editoObjeto("area", this.area);
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
        this.titulo.text = "Propiedades del Área";
        this.edNombre.value = this.area.nombre;
    }
}
ZVC.export(PropArea);