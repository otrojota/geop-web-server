class AnalizadorSerieTiempo extends Analizador {
    static aplicaAObjetoCapa(o, c) {
        return o?true:false;
    }
    constructor(objeto, capa, config) {
        super("serie-tiempo", objeto, capa, config);
        /*
        if (!config.variable) config.variable = "gfs4.TMP_2M";
        if (!config.nivelVariable) config.nivelVariable = 0;
        if (!config.tiempo) config.tiempo = {tipo:"relativo", from:-2, to:4};
        */
        console.log("creando analizador desde config", config);
        if (config.variable) {
            if (typeof config.variable == "string") {
                config.variable = ConsultaGeoportal.nuevaVariableCapa(config.variable);
            }
        } else {
            config.variable = ConsultaGeoportal.nuevaVariableCapa("gfs4.TMP_2M");
        }
        if (!config.tiempo) config.tiempo = {tipo:"relativo", from:-2, to:4};
    }
    get variable() {return this.config.variable}
    get variable2() {return this.config.variable2}
    get tiempo() {return this.config.tiempo}

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