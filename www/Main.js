const leftWidth = 340;
const topHeight = 44;

class Main extends ZCustomController {
    onThis_init() {
        this.leftOpen = true;
        this.auxiliarOpen = false;
        this.auxiliar.hide();
        this.analisisOpen = false;
        this.hsplitAnalisis.hide();
        this.panelAnalisis.hide();
        interact(this.hsplitAnalisis.view).draggable({
            startAxis:"y", lockAxis:"y",
            listeners:{
                move: e => {
                    let p = this.hsplitAnalisis.pos;
                    p.top += e.dy;
                    if (p.top < 30) p.top = 30;
                    if (p.top > this.size.height - 30) p.top = this.size.height - 30;
                    this.hsplitAnalisis.pos = {left:p.left, top:p.top}
                },
                end: e => {
                    let p = this.hsplitAnalisis.pos;
                    if (this.panelAnalisis.capa) {
                        this.panelAnalisis.configAnalisis.height = window.innerHeight - p.top - 6;
                        this.doResize();
                    }
                }
            }            
        });
        Highcharts.setOptions({
            global:{
                timezone:window.timeZone
            }
        });
        zPost("getMinZConfig.ly", {}, config => {
            window.minz = new MinZClient(config.url, config.token, config.espacios);
        }, error => console.error(error));
    }
    async onThis_activated() {
        $(window).resize(() => {            
	        this.doResize();
        });
        this.left.pos = {left:0, top:0};
        this.top.pos = {left:0, top:0};
        this.mapa.pos = {left:0, top:0};
        this.panelAnalisis.pos = {left:0, top:200}
        this.doResize();
        window.geoportal.admAnalisis = this;
        await window.geoportal.init();
        // Autologin
        let storedSesion = localStorage.getItem("sesion");
        if (storedSesion) {
            try {
                let sesion = await zPost("autoLogin.usu", {token:JSON.parse(storedSesion).token});
                if (sesion) {
                    window.sesionUsuario = sesion;
                    window.zSecurityToken = sesion.token;
                    this.left.refrescaSesion();
                    return;
                } 
            } catch(error) {
                console.error(error);
            }
        }
    }
    doResize() {
        let w = window.innerWidth;
        let h = window.innerHeight;
        this.size = {width:w, height:h}
        let altoAnalisis = this.panelAnalisis.capa?this.panelAnalisis.configAnalisis.height:80;
        if (altoAnalisis > h - 30) altoAnalisis = h-30;
        if (altoAnalisis < 30) altoAnalisis = 30;

        if (this.leftOpen) {
            this.left.size = {width:leftWidth, height:h}
            this.left.show();
            this.left.doResize();
            this.top.pos = {left:leftWidth + 1, top:0};
            this.top.size = {width:w - leftWidth - 1, height:topHeight}
            this.mapa.pos = {left:leftWidth + 1, top:0};
            this.central.pos = {left:leftWidth + 1, top:0};            
            if (this.auxiliarOpen) {
                this.auxiliar.pos = {left:leftWidth + 1, top:0};            
                this.auxiliar.size = {width:w - leftWidth - 1, height:h}
                this.auxiliar.doResize();
            }
            if (this.analisisOpen) {
                this.mapa.size = {width:w - leftWidth - 1, height:h - altoAnalisis - 7}
                this.central.size = {width:w - leftWidth - 1, height:h - altoAnalisis - 7}
                this.hsplitAnalisis.pos = {left:leftWidth + 1, top:h - altoAnalisis - 6}
                this.hsplitAnalisis.size = {width:w - leftWidth - 1, height:6}
                this.panelAnalisis.pos = {left:leftWidth + 1, top:h - altoAnalisis}
                this.panelAnalisis.size = {width:w - leftWidth - 1, height:altoAnalisis}
            } else {
                this.mapa.size = {width:w - leftWidth - 1, height:h}
                this.central.size = {width:w - leftWidth - 1, height:h}                
            }
        } else {
            this.left.hide();
            this.auxiliarOpen = false;
            this.auxiliar.hide();
            this.top.pos = {left:0, top:0};
            this.top.size = {width:w, height:topHeight}
            this.mapa.pos = {left:0, top:0};
            this.central.pos = {left:0, top:0};
            if (this.analisisOpen) {
                this.mapa.size = {width:w, height:h - altoAnalisis - 7}
                this.central.size = {width:w, height:h - altoAnalisis - 7}
                this.hsplitAnalisis.pos = {left:0, top:h - altoAnalisis - 6}
                this.hsplitAnalisis.size = {width:w, height:6}
                this.panelAnalisis.pos = {left:0, top:h - altoAnalisis}
                this.panelAnalisis.size = {width:w, height:altoAnalisis}
            } else {
                this.mapa.size = {width:w, height:h}
                this.central.size = {width:w, height:h}
            }
        }
        this.top.doResize();
        this.mapa.doResize();
        this.central.doResize();
        if (this.analisisOpen) this.panelAnalisis.doResize();
    }

    onTop_alternaMenu() {
        this.leftOpen = !this.leftOpen;
        this.doResize();
    }

    async alternaAnalisis() {
        if (this.analisisOpen) {
            this.analisisOpen = false;
            await this.panelAnalisis.destruye();
            this.panelAnalisis.hide();
            this.hsplitAnalisis.hide();
            this.doResize();
        } else {
            this.analisisOpen = true;
            await this.panelAnalisis.crea();
            this.panelAnalisis.show();
            this.hsplitAnalisis.show();
            this.doResize();
        }
    }

    async ajustaPanelAnalisis() {
        let grupoActivo = window.geoportal.capas.getGrupoActivo();
        let itemActivo = grupoActivo.itemActivo;
        if (!itemActivo || !(itemActivo instanceof ObjetoGeoportal)) {
            if (this.analisisOpen) this.alternaAnalisis();
            return;
        }        
        let analizadores = window.geoportal.capas.getAnalizadoresAplicables(itemActivo);
        if (!analizadores.length) {
            if (this.analisisOpen) this.alternaAnalisis();
            return;
        }
        if (!this.analisisOpen) {
            await this.alternaAnalisis();
        } else {
            await this.panelAnalisis.refresca();
        }
        this.doResize();
    }

    async cambioTiempo() {
        await this.panelAnalisis.cambioTiempo();
    }
    async movioObjeto(objeto) {
        await this.panelAnalisis.movioObjeto(objeto);
    }

    onLeft_aseguraVisible() {
        if (!this.leftOpen) {
            this.onTop_alternaMenu();
        }
    }

    async cambioMensajesItem(idItem) {
        if (this.panelAnalisis) {
            await this.panelAnalisis.cambioMensajesItem(idItem);
        }
    }

    onAuxiliar_open() {
        if (!this.leftOpen) this.leftOpen = true;
        this.auxiliarOpen = true;
        this.auxiliar.show();
        this.doResize();
    }
    onAuxiliar_close() {
        this.auxiliarOpen = false;
        this.auxiliar.hide();
        this.doResize();
    }
}
ZVC.export(Main);