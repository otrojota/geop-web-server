class PropVectores extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "props";  
        this.options = options;
        this.visualizador = options.item;
    }    
    async destruye() {
    }
    get config() {
        let c = this.visualizador.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.visualizador.configPanel.configSubPaneles[this.codigo] = {
            abierto:true
        }
        return this.visualizador.configPanel.configSubPaneles[this.codigo];
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
        this.titulo.text = "Propieades Vectores";
        this.edResolucion.value = this.visualizador.resolucion;
    }
    onEdResolucion_change() {
        let w = parseInt(this.edResolucion.value);
        if (!isNaN(w) && w > 5 && w < 500) this.visualizador.resolucion = w;
    }
}
ZVC.export(PropVectores);