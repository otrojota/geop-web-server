class AnalizadorSerieTiempo extends AnalizadorObjeto {
    static aplicaAObjeto(o) {
        return o instanceof Punto;        
    }
    constructor(objeto, config) {
        super("serie-tiempo", objeto, config);
    }
}

window.geoportal.capas.registraAnalizador("base", "serie-tiempo", AnalizadorSerieTiempo, "Serie de Tiempo", "base/img/serie-tiempo.svg");