class PropRectArea3D extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "prop";  
        this.options = options;
        this.analizador = options.analizador; 
        this.arbolAgregar = window.geoportal.getArbolAgregarAMapa("matrizRectangular");
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
        this.titulo.text = "Lat/Lng/ Variable Z";
        this.refrescaVar1();
        this.edEscalarLngLat.checked = this.analizador.config.escalarLngLat;
        this.edEscalarZ.checked = this.analizador.config.escalarZ;
        this.chequeaEscalaZ();
    }

    chequeaEscalaZ() {
        if (!this.analizador.config.variable || !this.analizador.config.escalarLngLat) {
            this.rowEscalarZ.hide();
            this.analizador.config.escalarZ = false;
            return;
        }
        let defVariable = window.geoportal.getVariable(this.analizador.config.variable);
        if (defVariable.unidad != "m") {
            this.rowEscalarZ.hide();
            this.analizador.config.escalarZ = false;
            return;
        }
        this.rowEscalarZ.show();
        this.rowEscalarZ.checked = this.analizador.config.escalarZ;
        if (!this.analizador.config.escalarZ) {
            this.rowFactorEscalaZ.hide();
        } else {
            this.edFactorEscalaZ.value = this.analizador.config.factorEscalaZ;
            this.rowFactorEscalaZ.show("flex");
        }
    }

    onEdEscalarLngLat_change() {
        this.analizador.config.escalarLngLat = this.edEscalarLngLat.checked;
        this.chequeaEscalaZ();
        this.options.contenedor.redibujaPanelAnalisis();
    }
    onEdEscalarZ_change() {
        this.analizador.config.escalarZ = this.edEscalarZ.checked;
        this.chequeaEscalaZ();
        this.options.contenedor.redibujaPanelAnalisis();
    }
    onEdFactorEscalaZ_change() {
        let v = parseFloat(this.edFactorEscalaZ.value);
        if (isNaN(v) || v < 0) return;
        this.analizador.config.factorEscalaZ = v;
        this.options.contenedor.redibujaPanelAnalisis();
    }

    refrescaVar1() {
        let nombreVar = "[Variable Principal]";
        let urlIconoVar = "img/iconos/limpio.svg";
        let variable = this.analizador.config.variable;
        let nivel = this.analizador.config.nivelVariable || 0;
        if (variable) {
            let defVariable = window.geoportal.getVariable(variable);
            nombreVar = defVariable.nombre;
            urlIconoVar = defVariable.urlIcono;
            this.delVar1.show();
            if (defVariable.niveles && defVariable.niveles.length > 1) {
                if (!this.edNivel1.view.noUiSlider) {
                    noUiSlider.create(this.edNivel1.view, {
                        start: nivel,
                        step:1,
                        range: {'min': 0,'max': defVariable.niveles.length - 1}
                    });
                }
                this.edNivel1.view.noUiSlider.on("slide", v => {
                    let value = parseInt(v[0]);
                    this.refrescaNombreNivel1(value);
                });
                this.edNivel1.view.noUiSlider.on("change", v => {
                    let value = parseInt(v[0]);
                    this.analizador.config.nivelVariable = value;
                    this.options.contenedor.refrescaPanelAnalisis();
                });
                this.refrescaNombreNivel1(nivel);
                this.grpNivel1.show();
            } else {
                this.grpNivel1.hide();
            }
        } else {
            this.delVar1.hide();
            this.grpNivel1.hide();
        }
        this.lblVar1.text = nombreVar;
        this.iconoVar1.setAttribute("src", urlIconoVar);
    }
    refrescaNombreNivel1(n) {
        this.lblNivel1.text = window.geoportal.getVariable(this.analizador.config.variable).niveles[n].descripcion;
    }

    onLblVar1_click() {
        this.zpop = new ZPop(this.caretVar1.view, this.arbolAgregar, {vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, onClick:(codigo, item) => {
            let codigoVariable = item.capa.codigoProveedor + "." + item.code;
            let variable = window.geoportal.getVariable(codigoVariable);
            this.analizador.config.variable = codigoVariable;
            let nivelInicial = variable.nivelInicial;
            if (nivelInicial === undefined) nivelInicial = 0;
            this.analizador.config.nivelVariable = nivelInicial;
            this.refrescaVar1();
            this.chequeaEscalaZ();
            this.options.contenedor.refrescaPanelAnalisis();
        }});
        this.zpop.show();
    }
    onDelVar1_click() {
        this.analizador.config.variable = null;
        this.analizador.config.nivelVariable = null;
        this.refrescaVar1();
        this.options.contenedor.refrescaPanelAnalisis();
    }

}
ZVC.export(PropRectArea3D);