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
    get width() {
        return this.configPanel?this.configPanel.width:0;
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
        console.log("destruyendo panel de propiedades");
        for (let i=0; i<this.paneles.length; i++) {
            await this.paneles[i].destruye();
        }
        this.contenedorPaneles.view.innerHTML = "";
    }
    async crea() {
        this.paneles = [];
        let paneles = this.item.getPanelesPropiedades();
        for (let i=0; i<paneles.length; i++) {
            let panel = paneles[i];
            let html = "<div id='panprop-" + panel.codigo + "' class='subpanel-propiedades' data-z-component='" + panel.path + "'></div>";
            this.contenedorPaneles.view.innerHTML += html;
            let subPanelContainer = this.contenedorPaneles.find("#panprop-" + panel.codigo);
            let controller = await ZVC.fromElement(subPanelContainer, {item:this.item, contenedor:this});
            this.paneles.push(controller);
        }
    }
    async creaDesde(item) {
        console.log("creando panel desde item", item);
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