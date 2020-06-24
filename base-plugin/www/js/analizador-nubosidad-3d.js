class AnalizadorNubosidadArea3D extends Analizador {
    static aplicaAObjetoCapa(o, c) {
        return o instanceof Area;        
    }
    constructor(objeto, capa, config) {        
        super("nubosidad-3d", objeto, capa, config);
    }

    getPanelesPropiedades() {        
        return [];
    }
    getRutaPanelAnalisis() {
        return "base/analisis/Nubosidad3D"
    }
}
window.geoportal.capas.registraAnalizador("base", "nubosidad-3d", AnalizadorNubosidadArea3D, "Nubosidad 3-D", "base/img/3d.svg");