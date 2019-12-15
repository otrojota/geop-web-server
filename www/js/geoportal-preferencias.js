const defMapa = {
    mapaBase:"esri-world-physical",
    etiquetas:true
}
class PrreferenciasGeoPortal {    
    constructor() {
        this._mapa = null;
    }
    get mapa() {
        if (this._mapa) return this._mapa;
        let j = window.localStorage.getItem("pref-mapa");
        if (j) {
            try {
                this._mapa = JSON.parse(j);
            } catch {}
        }
        if (this._mapa) return this._mapa;
        this._mapa = defMapa;
        return this._mapa;
    }
    saveMapa() {
        window.localStorage.setItem("pref-mapa", JSON.stringify(this._mapa));
    }
    get mapaBase() {return this.mapa.mapaBase}
    set mapaBase(codigo) {
        this.mapa.mapaBase = codigo;
        this.saveMapa();
        window.geoportal.mapa.cambioMapaBase();
    }
    get mapaEtiquetas() {return this.mapa.etiquetas}
    set mapaEtiquetas(etiquetas) {
        this.mapa.etiquetas = etiquetas; 
        this.saveMapa()
        window.geoportal.mapa.cambioEtiquetas();
    }
}
window.geoportal.preferencias = new PrreferenciasGeoPortal();