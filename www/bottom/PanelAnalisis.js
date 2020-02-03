class PanelAnalisis extends ZCustomController {
    get configAnalisis() {
        if (!this.objeto) return null;
        return this.objeto.configAnalisis;
    }

    onThis_init() {
        this.paneles = [];
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
        this.objeto = null;
    }

    async refresca() {
        this.objeto = window.geoportal.capas.getGrupoActivo().itemActivo;        
        this.refrescaAnalizadores();
        this.doResize();
    }
    
    refrescaAnalizadores() {
        let analizadores = window.geoportal.capas.getAnalizadoresAplicables(this.objeto);
        this.edAnalizador.setRows(analizadores, this.configAnalisis.analizador);
        this.refrescaDetallesAnalizador();
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
    }
    onEdAnalizador_change() {
        this.refrescaDetallesAnalizador();
    }
    async refrescaDetallesAnalizador() {
        await this.destruyePaneles();
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
        await this.refrescaPaneles();
    }

    async destruyePaneles() {
        for (let i=0; i<this.paneles.length; i++) {
            await this.paneles[i].destruye();
            await this.paneles[i].deactivate();
        }
        this.propiedadesAnalisis.view.innerHTML = "";
    }
    async creaPaneles() {
        this.paneles = [];
        let paneles = this.analizador.getPanelesPropiedades();
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
    async refrescaPaneles() {
        for (let i=0; i<this.paneles.length; i++) {
            let panel = this.paneles[i];
            await panel.refresca();
        }
    }

    async refrescaPanelAnalisis() {
        
    }
}

ZVC.export(PanelAnalisis)