class PropParticulas extends ZCustomController {
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
        this.titulo.text = "Propieades Partículas";
        if (!this.edNParticulas.view.noUiSlider) {
            noUiSlider.create(this.edNParticulas.view, {
                start: this.visualizador.nParticulas,
                step:1000,
                range: {min: 1000,max: 50000}
            });
        }
        this.edNParticulas.view.noUiSlider.on("change", v => {
            let value = parseInt(v[0]);
            this.visualizador.nParticulas = value;
        });
        if (!this.edVelocidad.view.noUiSlider) {
            noUiSlider.create(this.edVelocidad.view, {
                start: this.visualizador.velocidad,
                step:0.05,
                range: {min: 0.01,max: 1}
            });
        }
        this.edVelocidad.view.noUiSlider.on("change", v => {
            let value = parseFloat(v[0]);
            this.visualizador.velocidad = value;
        });
    }
}
ZVC.export(PropParticulas);