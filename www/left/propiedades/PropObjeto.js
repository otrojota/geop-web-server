class PropObjeto extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "prop-objeto";  
        this.options = options;
        this.objeto = options.item;
    }    
    async destruye() {}
    get config() {
        let c = this.objeto.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.objeto.configPanel.configSubPaneles[this.codigo] = {
            abierto:true
        }
        return this.objeto.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onEdNombre_change() {
        this.objeto.nombre = this.edNombre.value;
        this.options.contenedor.cambioNombre();
        window.geoportal.editoObjeto(this.objeto.tipo, this.objeto);
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
        let tipo = this.objeto.tipo || "tipo no indicado";
        tipo = tipo.substr(0,1).toUpperCase() + tipo.substr(1);
        this.titulo.text = "Propiedades del " + tipo;
        this.edNombre.value = this.objeto.nombre;
        if (this.objeto.nombreEditable) {
            this.edNombre.enable();
        } else {
            this.edNombre.disable();
        }
        if (this.objeto.properties) {
            this.grupoPropiedades.show();
            let html = Object.keys(this.objeto.properties).reduce((html, nombre) => {
                return html += 
                    `<tr>
                        <td style="vertical-align:top;"><img src="img/iconos/info.svg" class="mr-2" style="height:16px;" /></td>
                        <td class="text-muted small";">${nombre}</td>
                        <td class="text-muted small";">${this.objeto.properties[nombre]}</td>
                    </tr>`;
            }, "");
            this.contenedorPropiedades.html = "<table style='width:100%;'>" + html + "</table><hr class='my-1'/>";
        } else {
            this.grupoPropiedades.hide();
        }
    }
}
ZVC.export(PropObjeto);