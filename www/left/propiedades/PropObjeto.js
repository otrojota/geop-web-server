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
    onEdLatitud_change() {
        let v = parseFloat(this.edLatitud.value);
        if (isNaN(v)) return;
        if (v < -89 || v > 89) return;
        this.objeto.lat = v;
        window.geoportal.mapa.movioObjeto(this.objeto);
    }
    onEdLongitud_change() {
        let v = parseFloat(this.edLongitud.value);
        if (isNaN(v)) return;
        if (v < -180 || v > 180) return;
        this.objeto.lng = v;
        window.geoportal.mapa.movioObjeto(this.objeto);
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
        if (tipo == "Punto") {
            this.coordenadas.show();
            console.log("punto", this.objeto);
            this.edLatitud.value = this.objeto.lat;
            this.edLongitud.value = this.objeto.lng;
            if (!this.objeto.coordenadasEditables) {
                this.edLatitud.disable();
                this.edLongitud.disable();
            }
        } else {
            this.coordenadas.hide();
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