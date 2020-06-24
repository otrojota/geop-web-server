const coloresBordes = {
    "cmdAgregarAMapa":"#1779ba",
    "cmdCapasActivas":"#8f908f",
    "cmdAgregarObjeto":"#65e394",
    "cmdEstaciones":"#d67060"
}

class Top extends ZCustomController {
    onThis_init() {
        window.geoportal.panelTop = this;
        this.mostrandoAgregar = false;        
        this.panelAgregar.hide();
        this.mostrandoAgregarObjeto = false;        
        this.panelAgregarObjeto.hide();
    }
    escondePanelAgregar() {
        if (this.mostrandoAgregar) this.alternaPanelAgregar();
    }
    alternaPanelAgregar() {
        this.mostrandoAgregar = !this.mostrandoAgregar;
        if (this.mostrandoAgregar) {
            this.panelAgregar.refresca();
            this.panelAgregar.show();
            window.geoportal.panelTop.activaOpcionMenu("cmdAgregarAMapa", true)
        } else {
            this.panelAgregar.hide();
            window.geoportal.panelTop.activaOpcionMenu("cmdAgregarAMapa", false)
        }
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
    onCmdZoomIn_click() {window.geoportal.mapa.zoomIn()}
    onCmdZoomOut_click() {window.geoportal.mapa.zoomOut()}
    onIconoBuscar_click() {
        this.edBuscarUbicacion.value = "";
        this.onEdBuscarUbicacion_change();
    }
    muestraLupa() {
        this.iconoBuscar.removeClass("fa-times");
        this.iconoBuscar.addClass("fa-search");
    }
    muestraLimpiador() {
        this.iconoBuscar.removeClass("fa-search");
        this.iconoBuscar.addClass("fa-times");
    }
    async onEdBuscarUbicacion_change() {
        if (this.ignoreNextChange) {
            this.ignoreNextChange = false;
            return;
        }
        if (this.buscador) this.buscador.abort();
        if (this.zpop) {
            this.zpop.close();
            this.zpop = null;
        }

        let filtro = this.edBuscarUbicacion.value.trim();
        if (!filtro.length) {
            this.muestraLupa();
            return;
        } else if (filtro.length < 4) {
            this.muestraLimpiador();
            return;
        };
        
        let pos = window.geoportal.mapa.map.getCenter();
        this.iconoBuscar.removeClass("fa-search");
        this.iconoBuscar.removeClass("fa-times");
        this.iconoBuscar.addClass("fa-spin fa-spinner");
        
        this.buscador = zPost("busca.plc", {filtro:filtro, maxResults:10, lat:pos.lat, lng:pos.lng}, ubis => {
            this.iconoBuscar.removeClass("fa-spin fa-spinner");
            this.muestraLimpiador();
            this.buscador = null;
            if (!ubis || !ubis.results || !ubis.results.length) return;
            let rows = ubis.results.map((l, i) => ({
                code:i,
                label:l.highlightedTitle + " - " + parseInt(l.distance / 1000) + "[km] - " + "[" + l.category + "]",
                icon:l.category == "city-town-village"?"img/iconos/ciudad.svg":"img/iconos/ubicacion.svg",
                distancia:l.distance,
                pos:l.position,
                textoOriginal:l.title
            }))
                .filter(r => (!isNaN(r.distancia) && r.textoOriginal))
                .sort((r1, r2) => (r1.distancia - r2.distancia))
            this.zpop = new ZPop(this.leftM.view, rows,
                {
                    vMargin:2, hMargin:4, 
                    onClick:(code, row) => {                        
                        this.ignoreNextChange = true;
                        this.edBuscarUbicacion.value = row.textoOriginal;
                        window.geoportal.mapa.map.panTo(row.pos);
                        return true;
                    },
                    onMouseEnter:(code, row) => {                        
                        window.geoportal.mapa.map.flyTo(row.pos, 8, {animate:true, duration:0.5});
                        if (this.timerResalta) clearTimeout(this.timerResalta);
                        this.timerResalta = setTimeout(_ => window.geoportal.mapa.resaltaPunto(row.pos[0], row.pos[1]), 600);                        
                    }
                }
            ).show();
        }, error => {
            console.error(error);
            this.iconoBuscar.removeClass("fa-spin fa-spinner");
            this.iconoBuscar.addClass("fa-search");
            this.buscador = null;
        })
    }

    onCmdAgregarObjeto_click() {
        this.escondePanelAgregar();
        this.zpop = new ZPop(this.cmdAgregarObjeto.view, 
            [{
                code:"punto", icon:"img/iconos/punto.svg", label:"Agregar Punto"
            }, {
            //    code:"ruta", icon:"img/iconos/ruta.svg", label:"Agregar Ruta"
            //}, {
                code:"area", icon:"img/iconos/area.svg", label:"Agregar Área Rectangular"
            }],
            {
                vMargin:10, hMargin:-2, 
                onClick:code => {
                    window.geoportal.iniciaAgregarObjeto(code);
                    return true;
                },
                onClose:_ => this.activaOpcionMenu("cmdAgregarObjeto", false)
            }
        ).show();
        this.activaOpcionMenu("cmdAgregarObjeto", true)
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

    onCmdCapasActivas_click() {
        this.escondePanelAgregar();
        window.geoportal.capas.seleccionaPanelCapas();
    }

    onCmdEstaciones_click() {
        this.escondePanelAgregar();
        this.zpop = new ZPop(this.cmdEstaciones.view, geoportal.getCapasEstaciones(),
            {
                vMargin:10, hMargin:-2, 
                onClick:(code, item) => {
                    console.log("agrega capa estaciones", code, item);
                    window.geoportal.capas.add(item.capa);
                    return true;
                },
                onClose:_ => this.activaOpcionMenu("cmdEstaciones", false)
            }
        ).show();
        this.activaOpcionMenu("cmdEstaciones", true)
    }

    activaOpcionMenu(opcion, activar) {
        let boton = this.find("#" + opcion);
        if (activar) {
            boton.style.setProperty("border-bottom", "2px solid " + coloresBordes[opcion]);
        } else {
            boton.style.removeProperty("border-bottom");
        }
    }
}
ZVC.export(Top);