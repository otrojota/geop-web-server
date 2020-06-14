class AnalizadorSerieTiempo extends Analizador {
    static aplicaAObjetoCapa(o, c) {
        return o?true:false;
    }
    constructor(objeto, capa, config) {
        super("serie-tiempo", objeto, capa, config);
        if (config.variable) {
            if (typeof config.variable == "string") {
                config.variable = ConsultaGeoportal.nuevaVariableCapa(config.variable);                
            } else if (!(config.variable instanceof ConsultaGeoportal)) {
                config.variable = new ConsultaGeoportal(config.variable);
                this.inicializarVariable = true;
            }
        } else {
            config.variable = ConsultaGeoportal.nuevaVariableCapa("gfs4.TMP_2M");
        }
        if (config.variable2) {
            if (typeof config.variable == "string") {
                config.variable2 = ConsultaGeoportal.nuevaVariableCapa(config.variable2);
            } else if (!(config.variable2 instanceof ConsultaGeoportal)) {
                config.variable2 = new ConsultaGeoportal(config.variable2);
                this.inicializarVariable2 = true;
            }
        }
        if (!config.tiempo) config.tiempo = {tipo:"relativo", from:-2, to:4};
        if (!config.tiempo.temporalidad) config.tiempo.temporalidad = "1d";
    }
    get variable() {return this.config.variable}
    get variable2() {return this.config.variable2}
    get tiempo() {return this.config.tiempo}

    async init() {
        if (this.inicializarVariable && this.variable.tipo == "queryMinZ") {
            let variables = await window.minz.getVariables();
            this.variable.spec.variable = variables.find(v => v.code == this.variable.spec.variableMinZ);
            await this.variable.construyeDescripcionFiltros();
            if (this.variable.variable.options && this.variable.variable.options.icon) {
                if (this.variable.variable.options.icon.startsWith("${")) {
                    let p = this.variable.variable.options.icon.indexOf("}");
                    let codProveedor = this.variable.variable.options.icon.substr(2, p - 2);
                    let proveedor = window.geoportal.getProveedor(codProveedor);
                    this.variable.spec.icono = proveedor.url + "/" + this.variable.variable.options.icon.substr(p+1);
                }
            }
        }
        if (this.inicializarVariable2 && this.variable2.tipo == "queryMinZ") {
            let variables = await window.minz.getVariables();
            this.variable2.spec.variable = variables.find(v => v.code == this.variable2.spec.variableMinZ);
            await this.variable2.construyeDescripcionFiltros();
            if (this.variable2.variable.options && this.variable2.variable.options.icon) {
                if (this.variable2.variable.options.icon.startsWith("${")) {
                    let p = this.variable2.variable.options.icon.indexOf("}");
                    let codProveedor = this.variable2.variable.options.icon.substr(2, p - 2);
                    let proveedor = window.geoportal.getProveedor(codProveedor);
                    this.variable2.spec.icono = proveedor.url + "/" + this.variable2.variable.options.icon.substr(p+1);
                }
            }
        }
    }

    getPanelesPropiedades() {        
        return [{
            codigo:"vars",
            path:"base/propiedades/PropSerieTiempoVars"
        }, {
            codigo:"tiempo-serie-tiempo",
            path:"base/propiedades/PropTiempoSerieTiempo"
        }];
    }
    getRutaPanelAnalisis() {
        return "base/analisis/SerieTiempo"
    }
}

window.geoportal.capas.registraAnalizador("base", "serie-tiempo", AnalizadorSerieTiempo, "Serie de Tiempo", "base/img/serie-tiempo.svg");