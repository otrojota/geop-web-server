class AnalizadorRectArea3D extends Analizador {
    static aplicaAObjetoCapa(o, c) {
        return o instanceof Area;        
    }
    constructor(objeto, capa, config) {
        if (!config.variable) {
            config.variable = "fixed.BATIMETRIA_2019";
            config.nivelVariable = 0;
            config.escalarLngLat = true;
            config.escalarZ = true;
            config.factorEscalaZ = 10;
            config.escala = {
                dinamica:true,
                nombre:"Agua -> Tierra"                                
            }
        }
        super("rect-area-3d", objeto, capa, config);
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