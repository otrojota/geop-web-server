class Top extends ZCustomController {
    onThis_init() {
        window.geoportal.panelTop = this;
        this.mostrandoAgregar = false;        
        this.panelAgregar.hide();
        this.mostrandoAgregarObjeto = false;        
        this.panelAgregarObjeto.hide();
    }
    alternaPanelAgregar() {
        this.mostrandoAgregar = !this.mostrandoAgregar;
        if (this.mostrandoAgregar) {
            this.panelAgregar.refresca();
            this.panelAgregar.show();
        }
        else this.panelAgregar.hide();
    }
    onPanelAgregar_alterna() {this.alternaPanelAgregar()}
    onCmdAgregarAMapa_click() {this.alternaPanelAgregar()}
    doResize() {
        let {width, height} = this.size;
        let delta1 = width - (this.leftM.size.width + this.rightM.size.width);
        if (delta1 > (this.centerM.size.width + 20)) {
            // desktop
            this.rightM.view.style.left = (width - this.rightM.size.width) + "px";
            this.centerM.view.style.left = (this.leftM.size.width + delta1 / 2 - this.centerM.size.width / 2) + "px";
            this.centerM.view.style.top = 0;
        } else {
            // mobile
            this.rightM.view.style.left = (width - this.rightM.size.width) + "px";
            this.centerM.view.style.left = (width / 2 - this.centerM.size.width / 2) + "px";
            this.centerM.view.style.top = this.leftM.size.height + "px";
        }
    }
    onCmdAlternaMenu_click() {
        this.triggerEvent("alternaMenu");
    }
    onCmdZoomIn_click() {window.geoportal.mapa.zoomIn()}
    onCmdZoomOut_click() {window.geoportal.mapa.zoomOut()}
    async onEdBuscarUbicacion_change() {
        let filtro = this.edBuscarUbicacion.value.trim();
        if (filtro.length < 4) return;
        let pos = window.geoportal.mapa.map.getCenter();
        this.iconoBuscar.addClass("fa-spin fa-spinner");
        this.iconoBuscar.removeClass("fa-search");
        let ubis;
        try {
            ubis = await zPost("busca.plc", {filtro:filtro, maxResults:10, lat:pos.lat, lng:pos.lng});
        } catch(err) {
            console.error(err);
        } finally {
            this.iconoBuscar.removeClass("fa-spin fa-spinner");
            this.iconoBuscar.addClass("fa-search");
        }
        if (!ubis || !ubis.results || !ubis.results.length) return;
        let rows = ubis.results.map((l, i) => ({
            code:i,
            label:l.highlightedTitle + " - " + parseInt(l.distance / 1000) + "[km]",
            icon:l.category == "city-town-village"?"img/iconos/ciudad.svg":"img/iconos/ubicacion.svg",
            distancia:l.distance,
            pos:l.position
        }));
        this.zpop = new ZPop(this.leftM.view, rows,
            {
                vMargin:2, hMargin:4, 
                onClick:(code, row) => {
                    window.geoportal.mapa.map.panTo(row.pos);
                    return true;
                }
            }
        ).show();
    }

    onCmdAgregarObjeto_click() {
        this.zpop = new ZPop(this.cmdAgregarObjeto.view, 
            [{
                code:"punto", icon:"img/iconos/punto.svg", label:"Agregar Punto"
            }, {
                code:"ruta", icon:"img/iconos/ruta.svg", label:"Agregar Ruta"
            }, {
                code:"area", icon:"img/iconos/area.svg", label:"Agregar Área Rectangular"
            }],
            {
                vMargin:10, hMargin:-2, 
                onClick:code => {
                    window.geoportal.iniciaAgregarObjeto(code);
                    return true;
                }
            }
        ).show();
    }

    async iniciaAgregarObjeto(tipo) {
        if (this.mostrandoPanelAgregar) await this.alternaPanelAgregar();
        this.mostrandoPanelAgregarObjeto = true;
        this.panelAgregarObjeto.show();
        this.panelAgregarObjeto.refresca();
        this.doResize();
    }
    cancelaAgregarObjeto() {
        this.mostrandoPanelAgregarObjeto = false;
        this.panelAgregarObjeto.hide();
    }
    agregoObjeto(objeto) {
        this.mostrandoPanelAgregarObjeto = false;
        this.panelAgregarObjeto.hide();
    }
}
ZVC.export(Top);