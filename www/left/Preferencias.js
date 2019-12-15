class Preferencias extends ZCustomController {
    onThis_activated() {
        this.edMapaBase.setRows(window.geoportal.mapa.getListaMapas(), window.geoportal.preferencias.mapaBase);
        this.actualizaEtiquetas();        
    }
    onEdMapaBase_change() {
        window.geoportal.preferencias.mapaBase = this.edMapaBase.value;
    }
    onImgLabels_click() {
        window.geoportal.preferencias.mapaEtiquetas = !window.geoportal.preferencias.mapaEtiquetas;
        this.actualizaEtiquetas();
    }
    onLblLabels_click() {
        window.geoportal.preferencias.mapaEtiquetas = !window.geoportal.preferencias.mapaEtiquetas;
        this.actualizaEtiquetas();
    }
    actualizaEtiquetas() {
        this.imgLabels.removeClass("fa-check-square fa-square");
        let e = window.geoportal.preferencias.mapaEtiquetas;
        if (e) {
            this.imgLabels.addClass("fa-check-square");
        } else {
            this.imgLabels.addClass("fa-square");
        }
    }
}
ZVC.export(Preferencias);