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
        for (let i=0; i<this.paneles.length; i++) {
            await this.paneles[i].destruye();
            await this.paneles[i].deactivate();
        }
        this.contenedorPaneles.view.innerHTML = "";
    }
    async crea() {
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
    }
    refresca() {
        this.titulo.text = this.item.getTituloPanel();
        this.paneles.forEach(p => p.refresca())
    }
    cambioNombre() {
        this.titulo.text = this.item.getTituloPanel();
    }
}
ZVC.export(PanelPropiedades);