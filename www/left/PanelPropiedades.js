class PanelPropiedades extends ZCustomController {
    onThis_init() {
        this.paneles = [];
    }
    get idItem() {
        if (!this.item) return null;
        return this.item.id;
    }
    get configPanel() {
        if (!this.item) return null;
        return this.item.configPanel;
    }
    get height() {
        return this.configPanel?this.configPanel.height:0;
    }
    set height(h) {
        if (!this.configPanel) return;
        this.configPanel.height = h;
    }
    get width() {
        return this.configPanel?this.configPanel.width:0;
    }
    set width(w) {
        if (!this.configPanel) return;
        this.configPanel.width = w;
    }
    doResize() {
        let s = this.size;
        this.root.size = s;
        this.filaTitulo.size = {width:s.width, height:22};
        this.pin.pos = {left:s.width - 20, top:4};
        this.contenedorPaneles.pos = {left:0, top:23}
        this.contenedorPaneles.size = {width: s.width, height: s.height - 27}
    }
    async destruye() {
        this.contenedorPaneles.view.onscroll = null;
        for (let i=0; i<this.paneles.length; i++) {
            await this.paneles[i].destruye();
            await this.paneles[i].deactivate();
        }
        this.contenedorPaneles.view.innerHTML = "";
    }
    async crea() {
        if (this.item.configPanel.flotante) {
            this.root.removeClass("panel-propiedades-fijo");
            this.root.addClass("panel-propiedades-flotante");
            this.pin.view.src = "img/iconos/floating.svg";
            interact(this.filaTitulo.view).draggable({     
                listeners:{
                    move: e => {
                        let pos = this.pos;
                        let size = this.size;
                        let parentWidth = this.view.parentNode.clientWidth;
                        let parentHeight = this.view.parentNode.clientHeight;
                        pos.left += e.dx;
                        if (pos.left < 0) pos.left = 0;
                        if (pos.left > parentWidth - size.width) pos.left = parentWidth - size.width;
                        pos.top += e.dy;                        
                        if (pos.top < 0) pos.top = 0;
                        if (pos.top > parentHeight - size.height) pos.top = parentHeight - size.height;
                        this.pos = pos;
                    },
                    end: e => {
                        let pos = this.pos;
                        let size = this.size;
                        let xm = pos.left + size.width / 2;
                        let ym = pos.top + size.height / 2;
                        let parentWidth = this.view.parentNode.clientWidth;
                        let parentHeight = this.view.parentNode.clientHeight;
                        let x, y;
                        if (xm > parentWidth / 2) {
                            x = -(parentWidth - (pos.left + size.width));
                        } else {
                            x = pos.left;
                        }
                        if (ym > parentHeight / 2) {
                            y = -(parentHeight - (pos.top + size.height));
                        } else {
                            y = pos.top;
                        }
                        this.item.configPanel.x = x;
                        this.item.configPanel.y = y;
                    }
                }            
            });
            interact(this.view).resizable({
                edges: { left: true, right: true, bottom: true, top: true },
                modifiers: [
                    interact.modifiers.restrictEdges({
                        outer: 'parent'
                    }),
                    interact.modifiers.restrictSize({
                        min: { width: 100, height: 50 }
                    })
                ],
                listeners:{
                    move:e => {
                        let pos = this.pos;
                        let size = this.size;
                        pos.left += e.deltaRect.left;
                        pos.top += e.deltaRect.top;                                                
                        size.width = e.rect.width;
                        size.height = e.rect.height;
                        let parentWidth = this.view.parentNode.clientWidth;
                        let parentHeight = this.view.parentNode.clientHeight;
                        if (pos.left < 0) pos.left = 0;
                        if (pos.left > parentWidth - size.width) pos.left = parentWidth - size.width;
                        if (pos.top < 0) pos.top = 0;
                        if (pos.top > parentHeight - size.height) pos.top = parentHeight - size.height;
                        this.pos = pos;
                        this.size = size;
                        this.doResize();
                    },
                    end: e => {
                        let pos = this.pos;
                        let size = this.size;
                        let xm = pos.left + size.width / 2;
                        let ym = pos.top + size.height / 2;
                        let parentWidth = this.view.parentNode.clientWidth;
                        let parentHeight = this.view.parentNode.clientHeight;
                        let x, y;
                        if (xm > parentWidth / 2) {
                            x = -(parentWidth - (pos.left + size.width));
                        } else {
                            x = pos.left;
                        }
                        if (ym > parentHeight / 2) {
                            y = -(parentHeight - (pos.top + size.height));
                        } else {
                            y = pos.top;
                        }
                        this.item.configPanel.x = x;
                        this.item.configPanel.y = y;
                        this.item.configPanel.width = size.width;
                        this.item.configPanel.height = size.height;
                    }
                }
            })
        }
        this.paneles = [];
        let paneles = this.item.getPanelesPropiedades();
        let html = paneles.reduce((html, panel) => {
            html += "<div id='panprop-" + panel.codigo + "' class='subpanel-propiedades' data-z-component='" + panel.path + "'></div>";
            return html;
        }, "");
        this.contenedorPaneles.html = html;
        for (let i=0; i<paneles.length; i++) {
            let panel = paneles[i];
            let subPanelContainer = this.contenedorPaneles.find("#panprop-" + panel.codigo);
            let controller = await ZVC.fromElement(subPanelContainer, {item:this.item, contenedor:this});
            this.paneles.push(controller);
        }
    }
    async creaDesde(item) {
        if (this.item) {
            if (item) {
                if (item.id != this.item.id) await this.destruye();
            } else {
                await this.destruye();
            }
        }
        this.item = item;        
        if (!this.item) return;
        await this.crea();
        this.refresca();
        setTimeout(_ => {
            if (this.item.configPanel.scrollTop) {
                this.contenedorPaneles.view.scrollTop = this.item.configPanel.scrollTop;
                console.log("creado con scroll", this.item.configPanel.scrollTop)
            }
            this.contenedorPaneles.view.onscroll = _ => {
                this.item.configPanel.scrollTop = this.contenedorPaneles.view.scrollTop;
            }    
        }, 100);
    }
    refresca() {
        this.titulo.text = this.item.getTituloPanel();
        this.paneles.forEach(p => p.refresca())
    }
    cambioNombre() {
        this.titulo.text = this.item.getTituloPanel();
    }

    async onPin_click() {
        if (this.configPanel.flotante) {
            this.configPanel.flotante = false;
            await window.geoportal.capas.getGrupoActivo().destruyePanelFlotante(this.item);
            window.capasController.refrescaPanelPropiedades();
        } else {
            this.configPanel.flotante = true;
            await window.geoportal.capas.getGrupoActivo().creaPanelFlotante(this.item);
            this.refresca();
            window.capasController.refrescaPanelPropiedades();
        }
    }
}
ZVC.export(PanelPropiedades);