class PropGrupo extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "props";  
        this.options = options;
        this.grupo = options.item;        
    }    
    async destruye() {}
    get config() {
        let c = this.grupo.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.grupo.configPanel.configSubPaneles[this.codigo] = {
            abierto:true
        }
        return this.grupo.configPanel.configSubPaneles[this.codigo];
    }
    onImgAbierto_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onEdNombre_change() {
        this.grupo.nombre = this.edNombre.value;
        this.options.contenedor.cambioNombre();
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
        this.titulo.text = "Propiedades del Grupo";
        this.edNombre.value = this.grupo.nombre;
    }
}
ZVC.export(PropGrupo);