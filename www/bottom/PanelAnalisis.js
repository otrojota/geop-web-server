class PanelAnalisis extends ZCustomController {
    get configAnalisis() {
        if (!this.objeto) return null;
        return this.objeto.configAnalisis;
    }

    onThis_init() {
        this.paneles = [];
        this.onRefrescado = null;
        this.rowAnalizador.pos = {left:0, top:0};
        interact(this.vsplitAnalisis.view).draggable({
            startAxis:"x", lockAxis:"x",
            listeners:{
                move: e => {
                    let p = this.vsplitAnalisis.pos;
                    p.left += e.dx;
                    if (p.left < 30) p.left = 30;
                    if (p.left > this.size.width - 30) p.left = this.size.width - 30;
                    this.vsplitAnalisis.pos = {left:p.left, top:p.top}
                },
                end: e => {
                    let p = this.vsplitAnalisis.pos;
                    if (this.objeto) {
                        this.objeto.configAnalisis.width = p.left;
                        this.doResize();
                    }
                }
            }            
        });
    }
    async crea() {
        await this.refresca();
    }
    async destruye() {
        this.destruyePaneles();
        await this.destruyePanelAnalisis();
        this.objeto = null;
    }

    async refresca() {
        this.objeto = window.geoportal.capas.getGrupoActivo().itemActivo;        
        this.refrescaAnalizadores();
        this.doResize();
    }
    
    async refrescaAnalizadores() {
        let analizadores = window.geoportal.capas.getAnalizadoresAplicables(this.objeto);
        this.edAnalizador.setRows(analizadores, this.configAnalisis.analizador);
        await this.refrescaDetallesAnalizador();
    }    
    doResize() {
        let s = this.size;
        if (!this.objeto) return;
        this.vsplitAnalisis.pos = {left:this.configAnalisis.width, top:0}
        this.vsplitAnalisis.size = {width:6, height:s.height};
        this.rowAnalizador.size = {width:this.configAnalisis.width, height:39};
        this.propiedadesAnalisis.size = {width:this.configAnalisis.width - 4, height:s.height - 33}
        this.contenedorAnalisis.pos = {left:this.configAnalisis.width + 6, top:0}
        this.contenedorAnalisis.size = {width:s.width - this.configAnalisis.width - 6, height:s.height}
        if (this.contenedorAnalisis.content.doResize) this.contenedorAnalisis.content.doResize();
    }
    onEdAnalizador_change() {
        this.refrescaDetallesAnalizador();
    }
    async refrescaDetallesAnalizador() {
        await this.destruyePaneles();
        await this.destruyePanelAnalisis();
        let definicionAnalizador = this.edAnalizador.selectedRow;
        this.iconoAnalizador.view.setAttribute("src", definicionAnalizador.icono);
        if (!this.configAnalisis.analizadores[definicionAnalizador.codigo]) {
            this.configAnalisis.analizadores[definicionAnalizador.codigo] = {};
        }
        if (!this.configAnalisis.analizadores[definicionAnalizador.codigo].paneles) {
            this.configAnalisis.analizadores[definicionAnalizador.codigo].paneles = {};
        }
        let configAnalisis = this.configAnalisis.analizadores[definicionAnalizador.codigo];
        this.analizador = new (definicionAnalizador.clase)(this.objeto, configAnalisis);
        await this.creaPaneles();
        await this.creaPanelAnalisis();
        await this.refrescaPaneles();
        await this.refrescaPanelAnalisis();
    }

    async destruyePaneles() {
        for (let i=0; i<this.paneles.length; i++) {
            await this.paneles[i].destruye();
            await this.paneles[i].deactivate();
        }
        this.propiedadesAnalisis.view.innerHTML = "";
    }
    async destruyePanelAnalisis() {
        await this.contenedorAnalisis.load("common/Empty");
    }
    async creaPaneles() {
        this.paneles = [];
        let paneles = [{codigo:"mensajes", path:"bottom/MensajesAnalisis"}].concat(this.analizador.getPanelesPropiedades());
        let html = paneles.reduce((html, panel) => {
            html += "<div id='panprop-" + panel.codigo + "' class='subpanel-propiedades' data-z-component='" + panel.path + "'></div>";
            return html;
        }, "");
        this.propiedadesAnalisis.html = html;
        for (let i=0; i<paneles.length; i++) {
            let panel = paneles[i];
            let subPanelContainer = this.propiedadesAnalisis.find("#panprop-" + panel.codigo);
            let controller = await ZVC.fromElement(subPanelContainer, {analizador:this.analizador, contenedor:this});
            this.paneles.push(controller);
        }
    }
    async creaPanelAnalisis() {
        await this.contenedorAnalisis.load(this.analizador.getRutaPanelAnalisis(), {contenedor:this, analizador:this.analizador});
    }
    async refrescaPaneles() {
        for (let i=0; i<this.paneles.length; i++) {
            let panel = this.paneles[i];
            await panel.refresca();
        }
    }

    async refrescaPanelAnalisis() {
        if (this.contenedorAnalisis.content.refresca) {
            await this.contenedorAnalisis.content.refresca(this.objeto);
            if (this.onRefrescado) await this.onRefrescado();
        }
    }

    async redibujaPanelAnalisis() {
        if (this.contenedorAnalisis.content.redibuja) {
            this.iniciaTrabajando();            
            await this.contenedorAnalisis.content.redibuja();
            this.finalizaTrabajando();
        }
    }

    cambioTiempo() {
        return this.refrescaPanelAnalisis();
    }
    async movioObjeto(objeto) {
        if (this.objeto && this.objeto.id == objeto.id) {
            await this.refrescaPanelAnalisis();
        }
    }
    iniciaTrabajando() {
        this.iconoAnalizador.hide();
        this.iconoTrabajando.show();
    }
    finalizaTrabajando() {
        this.iconoAnalizador.show();
        this.iconoTrabajando.hide();
    }

    async cambioMensajesItem(idItem) {
        if (!this.analizador || this.analizador.id != idItem) return;
        this.paneles[0].refresca();
    }
}

ZVC.export(PanelAnalisis)