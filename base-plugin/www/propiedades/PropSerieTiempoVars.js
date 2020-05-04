class PropSerieTiempoVars extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "vars";  
        this.options = options;
        this.analizador = options.analizador; 
        let dataObject = this.analizador.objeto.capa.tipo == "dataObjects"?this.analizador.objeto:null;
        this.arbolAgregar = await window.geoportal.getArbolAgregarAMapa("serieTiempo", dataObject);
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
        let nombreVar = "[Variable Principal]";
        let urlIconoVar = "img/iconos/limpio.svg";
        let variable = this.analizador.config.variable;
        let nivel = this.analizador.config.nivelVariable || 0;
        if (variable) {
            let defVariable = window.geoportal.getVariable(variable);
            //let capa = window.geoportal.capasDisponibles[variable];
            //nombreVar = capa.nombre;
            nombreVar = defVariable.nombre;
            //urlIconoVar = capa.urlIcono;
            urlIconoVar = defVariable.urlIcono;
            this.delVar1.show();
            //if (capa.niveles && capa.niveles.length > 1) {
            if (defVariable.niveles && defVariable.niveles.length > 1) {
                if (!this.edNivel1.view.noUiSlider) {
                    noUiSlider.create(this.edNivel1.view, {
                        start: nivel,
                        step:1,
                        //range: {'min': 0,'max': capa.niveles.length - 1}
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
        //this.lblNivel1.text = window.geoportal.capasDisponibles[this.analizador.config.variable].niveles[n].descripcion;
        this.lblNivel1.text = window.geoportal.getVariable(this.analizador.config.variable).niveles[n].descripcion;
    }
    refrescaVar2() {
        let nombreVar = "[Comparar con Variable]";
        let urlIconoVar = "img/iconos/limpio.svg";
        let variable = this.analizador.config.variable2;
        let nivel = this.analizador.config.nivelVariable2 || 0;
        if (variable) {
            let defVariable = window.geoportal.getVariable(variable);
            //let capa = window.geoportal.capasDisponibles[variable];
            //nombreVar = capa.nombre;
            nombreVar = defVariable.nombre;
            //urlIconoVar = capa.urlIcono;
            urlIconoVar = defVariable.urlIcono;
            this.delVar2.show();
            //if (capa.niveles && capa.niveles.length > 1) {
            if (defVariable.niveles && defVariable.niveles.length > 1) {
                if (!this.edNivel2.view.noUiSlider) {
                    noUiSlider.create(this.edNivel2.view, {
                        start: nivel,
                        step:1,
                        //range: {'min': 0,'max': capa.niveles.length - 1}
                        range: {'min': 0,'max': defVariable.niveles.length - 1}
                    });
                }
                this.edNivel2.view.noUiSlider.on("slide", v => {
                    let value = parseInt(v[0]);
                    this.refrescaNombreNivel2(value);
                });
                this.edNivel2.view.noUiSlider.on("change", v => {
                    let value = parseInt(v[0]);
                    this.analizador.config.nivelVariable2 = value;
                    this.options.contenedor.refrescaPanelAnalisis();
                });
                this.refrescaNombreNivel2(nivel);
                this.grpNivel2.show();
            } else {
                this.grpNivel2.hide();
            }
        } else {
            this.delVar2.hide();
            this.grpNivel2.hide();
        }
        this.lblVar2.text = nombreVar;
        this.iconoVar2.setAttribute("src", urlIconoVar);
    }
    refrescaNombreNivel2(n) {
        //this.lblNivel2.text = window.geoportal.capasDisponibles[this.analizador.config.variable2].niveles[n].descripcion;
        this.lblNivel2.text = window.geoportal.getVariable(this.analizador.config.variable2).niveles[n].descripcion;
    }

    onLblVar1_click() {
        this.zpop = new ZPop(this.caretVar1.view, this.arbolAgregar, {vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, onClick:(codigo, item) => {
            let codigoVariable = item.capa.codigoProveedor + "." + item.code;
            let variable = window.geoportal.getVariable(codigoVariable);
            //this.analizador.config.variable = item.capa.codigoProveedor + "." + item.capa.codigo ;
            this.analizador.config.variable = codigoVariable;
            //let nivelInicial = item.capa.nivelInicial;
            let nivelInicial = variable.nivelInicial;
            if (nivelInicial === undefined) nivelInicial = 0;
            this.analizador.config.nivelVariable = nivelInicial;
            this.refrescaVar1();
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
    onLblVar2_click() {
        this.zpop = new ZPop(this.caretVar2.view, this.arbolAgregar, {vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, onClick:(codigo, item) => {
            let codigoVariable = item.capa.codigoProveedor + "." + item.code;
            let variable = window.geoportal.getVariable(codigoVariable);
            //this.analizador.config.variable2 = item.capa.codigoProveedor + "." + item.capa.codigo ;
            this.analizador.config.variable2 = codigoVariable;
            //let nivelInicial = item.capa.nivelInicial;
            let nivelInicial = variable.nivelInicial;
            if (nivelInicial === undefined) nivelInicial = 0;
            this.analizador.config.nivelVariable2 = nivelInicial;
            this.refrescaVar2();
            this.options.contenedor.refrescaPanelAnalisis();
        }});
        this.zpop.show();
    }
    onDelVar2_click() {
        this.analizador.config.variable2 = null;
        this.analizador.config.nivelVariable2 = null;
        this.refrescaVar2();
        this.options.contenedor.refrescaPanelAnalisis();
    }
}
ZVC.export(PropSerieTiempoVars);