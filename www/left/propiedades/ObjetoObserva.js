class ObjetoObserva extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "observa";  
        this.options = options;
        this.objeto = options.item;
        let dataObject = this.objeto.capa.tipo == "dataObjects"?this.objeto:null;
        this.arbolAgregar = await window.geoportal.getArbolAgregarAMapa("valorEnPunto", dataObject, this.objeto.capa.codigoDimension);
    }    
    async destruye() {}
    get config() {
        let c = this.objeto.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.objeto.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.objeto.configPanel.configSubPaneles[this.codigo];
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
        this.titulo.text = "Observar Variables [" + this.objeto.observa.length + "]";

        let seleccionador = ConsultaGeoportal.nuevoSeleccionadorVacio("[Observar Nueva Variable]");
        let html = this.objeto.observa.reduce((html, o) => (html + "<hr class='my-1' />" + o.getHTML(false)), seleccionador.getHTML(true));
        this.contenido.html = html;
        seleccionador.registraListeners(this.contenido, {
            arbolItems:this.arbolAgregar,
            onSelecciona:consulta => {
                this.objeto.observa.push(consulta);
                this.refresca();
                this.objeto.recalculaValoresObservados();
            }
        });
        this.objeto.observa.forEach(o => {
            o.registraListeners(this.contenido, {
                onElimina:_ => {
                    let idx = this.objeto.observa.findIndex(oo => oo.id == o.id);
                    this.objeto.observa.splice(idx, 1);
                    this.refresca();
                    if (this.objeto.observa.length) this.objeto.recalculaValoresObservados();
                    else window.geoportal.mapa.callDibujaObjetos();
                },
                onChange:_ => {
                    this.refresca();
                    this.objeto.recalculaValoresObservados();
                }
            })
        });
    }
}
ZVC.export(ObjetoObserva);