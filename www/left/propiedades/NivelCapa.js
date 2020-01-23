class NivelCapa extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "nivel";  
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
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    refresca() {
        if (!this.edNivel.view.noUiSlider) {
            noUiSlider.create(this.edNivel.view, {
                start: this.capa.nivel,
                step:1,
                range: {'min': 0,'max': this.capa.niveles.length - 1}
            });
        }
        this.edNivel.view.noUiSlider.on("slide", v => {
            let value = parseInt(v[0]);
            this.refrescaNombreNivel(value);
        });
        this.edNivel.view.noUiSlider.on("change", v => {
            let value = parseInt(v[0]);
            this.capa.nivel = value;
            this.capa.cambioNivel();
            this.refrescaTitulo();
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
        this.refrescaNombreNivel(this.capa.nivel);
        this.refrescaTitulo();
    }

    refrescaNombreNivel(n) {
        this.lblNivel.text = this.capa.niveles[n].descripcion;
    }
    refrescaTitulo() {
        this.titulo.text = "Nivel: " + this.capa.niveles[this.capa.nivel].descripcion;
    }
}
ZVC.export(NivelCapa);