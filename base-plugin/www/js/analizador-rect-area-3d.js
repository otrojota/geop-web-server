class AnalizadorRectArea3D extends AnalizadorObjeto {
    static aplicaAObjeto(o) {
        return o instanceof Area;        
    }
    constructor(objeto, config) {
        super("rect-area-3d", objeto, config);
    }

    get escala() {return this.config.escala}    

    getPanelesPropiedades() {        
        return [{
            codigo:"prop",
            path:"base/propiedades/PropRectArea3D"
        }, {
            codigo:"escala",
            path:"base/propiedades/PropEscalaAnalizador"
        }];
    }
    getRutaPanelAnalisis() {
        return "base/analisis/RectArea3D"
    }
}

window.geoportal.capas.registraAnalizador("base", "rect-area-3d", AnalizadorRectArea3D, "3D - Lat/Lng/Z", "base/img/3d.svg");