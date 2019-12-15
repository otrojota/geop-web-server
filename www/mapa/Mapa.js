class Mapa extends ZCustomController {
    onThis_activated() {
        window.geoportal.mapa = new MapaGeoPortal(this.contenedorMapa);
    }
    doResize() {
        let w = this.view.clientWidth;
        let h = this.view.clientHeight;
        this.contenedorMapa.size = {width:w, height:h};
        window.geoportal.mapa.doResize();
    }
}
ZVC.export(Mapa);