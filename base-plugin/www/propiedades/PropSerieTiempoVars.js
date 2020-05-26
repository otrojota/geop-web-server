class PropSerieTiempoVars extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "vars";  
        this.options = options;
        this.analizador = options.analizador; 
        let dataObject = this.analizador.objeto.capa.tipo == "dataObjects"?this.analizador.objeto:null;
        this.arbolAgregar = await window.geoportal.getArbolAgregarAMapa("serieTiempo", dataObject, this.analizador.capa.codigoDimension, null, true);
        this.zpop = null;
    }    
    async destruye() {}
    get config() {
        let c = this.analizador.config.paneles[this.codigo];
        if (c) return c;
        this.analizador.config.paneles[this.codigo] = {
            abierto:true
        }
        return this.analizador.config.paneles[this.codigo];
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
        this.titulo.text = "Variables";
        this.refrescaVar1();
        this.refrescaVar2();
    }

    refrescaVar1() {
        let consulta = this.analizador.variable || ConsultaGeoportal.nuevoSeleccionadorVacio();
        this.contenedorVar1.html = consulta.getHTML(true);
        consulta.registraListeners(this.contenedorVar1, {
            arbolItems:this.arbolAgregar,
            onSelecciona:consulta => {
                this.analizador.config.variable = consulta;
                consulta.construyeDescripcionFiltros()
                    .then(_ => {
                        this.refrescaVar1();
                        if (this.analizador.propTiempoListener) this.analizador.propTiempoListener();
                        this.options.contenedor.refrescaPanelAnalisis();
                    })
            },
            onElimina:_ => {
                this.analizador.config.variable = null;
                this.refrescaVar1();
                if (this.analizador.propTiempoListener) this.analizador.propTiempoListener();
                this.options.contenedor.refrescaPanelAnalisis();
            },
            onChange:_ => {
                this.refrescaVar1();
                if (this.analizador.propTiempoListener) this.analizador.propTiempoListener();
                this.options.contenedor.refrescaPanelAnalisis();
            }
        })
    }
    refrescaVar2() {
        let consulta = this.analizador.variable2 || ConsultaGeoportal.nuevoSeleccionadorVacio("[Comparar con Variable]");
        this.contenedorVar2.html = consulta.getHTML(true);
        consulta.registraListeners(this.contenedorVar2, {
            arbolItems:this.arbolAgregar,
            onSelecciona:consulta => {
                this.analizador.config.variable2 = consulta;
                consulta.construyeDescripcionFiltros()
                    .then(_ => {
                        this.refrescaVar2();
                        if (this.analizador.propTiempoListener) this.analizador.propTiempoListener();
                        this.options.contenedor.refrescaPanelAnalisis();
                    })
            },
            onElimina:_ => {
                this.analizador.config.variable2 = null;
                this.refrescaVar2();
                if (this.analizador.propTiempoListener) this.analizador.propTiempoListener();
                this.options.contenedor.refrescaPanelAnalisis();
            },
            onChange:_ => {
                this.refrescaVar2();
                if (this.analizador.propTiempoListener) this.analizador.propTiempoListener();
                this.options.contenedor.refrescaPanelAnalisis();
            }
        })
    }
}
ZVC.export(PropSerieTiempoVars);