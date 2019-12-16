class PanelAgregar extends ZCustomController {
    onThis_init() {
        this.items = [];
    }
    refresca() {
        this.edBuscadorAgregar.value = "";
        this.doBuscar();
    }

    onEdBuscadorAgregar_change() {this.doBuscar()}
    onLimpiador_click() {
        this.edBuscadorAgregar.value = "";
        this.doBuscar();
    }

    buscaItemsEnNivel(nivel, filtro, found, added) {
        for (let i=0; i<nivel.length; i++) {
            let item = nivel[i];
            if (item.items) {
                this.buscaItemsEnNivel(item.items, filtro, found, added);
            } else {
                if (!added[item.code] && item.label.toLowerCase().indexOf(filtro) >= 0) {
                    found.push(item);
                    added[item.code] = true;
                }
            }
        }
    }
    doBuscar() {
        let filtro = this.edBuscadorAgregar.value.trim().toLowerCase();
        if (!filtro) {
            this.limpiador.hide();
            this.lupa.show();
            this.doShow(this.items);
            return;
        }
        this.limpiador.show();
        this.lupa.hide();
        let found = [];
        this.buscaItemsEnNivel(this.items, filtro, found, {});
        this.doShow(found);
    }

    onCmdCerrarAgregar_click() {
        this.triggerEvent("alterna")
    }
    cierra() {
        if (this.subPop) {
            this.subPop.close();
            this.subPop = null;
        }
    }
    refresca() {
        this.items = window.geoportal.getArbolAgregarAMapa();
        this.doShow(this.items);
    }
    doShow(items) {
        this.expandedItems = items;
        this.paintItems(items);
    }

    isImage(icon) {
        let p = icon.lastIndexOf(".");
        if (p <= 0) return false;
        let ext = icon.substr(p+1).toLowerCase();
        return ",svg,png,jpg,jpeg,ico,".indexOf(ext) > 0;
    }
    getIconHTML(item) {
        let float = "float-left";
        let html = "<div class='agregar-item-icon " + float + "'>";
        if (!item.icon) {
            html += "<span></span>";
        } else if (this.isImage(item.icon)) {
            let iconInvert = item.iconInvert?" agregar-item-icon-invert":"";
            html += "<img src='" + item.icon + "' class='" + iconInvert + "' />";
        } else {
            html += "<i class='" + item.icon + "'></i>"
        }
        html += "</div>";
        return html;
    }
    getLabelHTML(item) {        
        return "<div class='agregar-item-label' >" + item.label + "</div>";
    }
    paintItems(items) {
        let html = "";
        items.forEach(item => {
            html += "<div class='agregar-item-container' data-code='" + item.code + "'>";
            html += this.getIconHTML(item);
            html += this.getLabelHTML(item);
            if (item.items) {
                html += "<i class='fas fa-caret-right float-right ml-2 mt-1'></i>";
            }
            html += "</div>";
        });
        this.cntOpcionesAgregar.html = html;
        this.cntOpcionesAgregar.findAll(".agregar-item-container").forEach(cnt => {
            cnt.onmouseenter = e => {
                this.cntOpcionesAgregar.findAll(".agregar-item-container").forEach(cnt => {
                    cnt.classList.remove("agregar-item-active");
                });
                cnt.classList.add("agregar-item-active");
                let code = cnt.getAttribute("data-code");
                let item = this.expandedItems.find(i => i.code == code);
                if (!item) {
                    console.log("no encuentra item", code);
                    return;
                };
                if (item.items) {
                    if (this.subPop) {
                        this.subPop.close();
                        this.subPop = null;
                    }
                    let hPos = "right";
                    let vPos = "justify-top";
                    this.subPop = new ZPop($(cnt), item.items, {
                        hPos:hPos, hMargin:10, vPos:vPos, vMargin:0,
                        subItemsAt:"right",
                        subHMargin:10,
                        subVMargin:0,
                        onClick:(code, item) => {
                            this.doClick(code, item);
                        }
                    })
                    this.subPop.show();
                }
            };
        });
        this.cntOpcionesAgregar.findAll(".agregar-item-container").forEach(cnt => {
            cnt.onclick = e => {
                let code = cnt.getAttribute("data-code");    
                let item;
                if (this.showingSearchResults) {
                    item = this.foundItems.find(i => i.code == code);
                } else {     
                    item = this.expandedItems.find(i => i.code == code);
                }
                if (!item.items) {
                    if (this.subPop) {
                        this.subPop.close();
                        this.subPop = null;
                    }
                    this.doClick(code, item);                
                } 
            };
        });
    }

    doClick(code, item) {
        if (item.tipo == "capa") {
            window.geoportal.capas.add(item.capa);
        }
    }
}

ZVC.export(PanelAgregar)