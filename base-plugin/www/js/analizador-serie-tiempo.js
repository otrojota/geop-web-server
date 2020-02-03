class AnalizadorSerieTiempo extends AnalizadorObjeto {
    static aplicaAObjeto(o) {
        return o instanceof Punto;        
    }
    constructor(objeto, config) {
        super("serie-tiempo", objeto, config);
    }
    get variable() {return this.config.variable}
    get variable2() {return this.config.variable2}
    get tiempo() {return this.config.tiempo}

    getPanelesPropiedades() {        
        return [{
            codigo:"vars",
            path:"base/propiedades/PropSerieTiempoVars"
        }];
    }
    getRutaPanelAnalisis() {
        return "base/analisis/SerieTiempo"
    }
}

window.geoportal.capas.registraAnalizador("base", "serie-tiempo", AnalizadorSerieTiempo, "Serie de Tiempo", "base/img/serie-tiempo.svg");