class PropIsobandas extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "props";  
        this.options = options;
        this.visualizador = options.item;
        this.finishWorkingListener = _ => {
            this.edStep.value = this.visualizador.step;
        }
        this.visualizador.addWorkingListener("finish", this.finishWorkingListener);
    }    
    async destruye() {
        console.log("destruyendo finishWorkingListener");
        this.visualizador.removeWorkingListener(this.finishWorkingListener)
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
        this.titulo.text = "Propieades Isobandas";
        this.edAutomatico.checked = this.visualizador.autoStep;
        if (this.visualizador.autoStep) {
            this.edStep.disable();
        } else {
            this.edStep.enable();
        }
        if (this.visualizador.step) this.edStep.value = this.visualizador.step;
    }
    onEdAutomatico_change() {
        this.visualizador.autoStep = this.edAutomatico.checked;
        if (this.visualizador.autoStep) {
            this.edStep.disable();
        } else {
            this.edStep.enable();
        }
    }
    onEdStep_change() {
        let v = parseFloat(this.edStep.value);
        if (!isNaN(v)) this.visualizador.step = v;
    }
}
ZVC.export(PropIsobandas);