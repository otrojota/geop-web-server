class Capas extends ZCustomController {
    async onThis_init() {        
        this.mostrandoPanelPropiedades = false;
        this.workingListeners = [];  // {item:capa|visualizador, listener:function}
        await this.refresca();
        window.geoportal.addListenerEdicion((tipo, objeto) => {
            this.refresca();
        });
        interact(this.hsplit.view).draggable({
            startAxis:"y", lockAxis:"y",
            listeners:{
                move: e => {
                    this.panelPropiedades.height -= e.dy;
                    if (this.panelPropiedades.height < 70) this.panelPropiedades.height = 70;
                    if (this.panelPropiedades.height > this.size.height - 70) this.panelPropiedades.height = this.size.height - 70;
                    this.doResize();
                }
            }            
        });
    }
    onThis_activated() {
        window.capasController = this;
    }
    onThis_deactivated() {
        window.capasController = null;
    }
    async capaAgregada(capa) {
        await this.refresca();
    }
    async capaRemovida(capa) {
        await this.refresca();
    }

    getCapaDeItem(item) {
        if (!item) return null;
        if (item instanceof GrupoCapas) return null;
        if (item instanceof Capa) return item;
        if (item.capa) return item.capa;
        console.error("No se pudo determinar la capa del item", item);
        return null;
    }

    async refresca() {
        this.workingListeners.forEach(l => l.item.removeWorkingListener(l.listener));
        this.workingListeners = [];
        this.mapaItems = {};
        this.mapaItemsPorId = {};
        this.items = [];
        for (let i=0; i<window.geoportal.capas.grupos.length; i++) {
            let grupo = window.geoportal.capas.getGrupo(i);
            let item = {
                tipo:"grupo",
                indice:i,
                nombre:grupo.nombre,
                seleccionable:true,
                seleccionado:grupo.activo,
                eliminable:true,
                icono:grupo.abierto?"img/iconos/carpeta-abierta.svg":"img/iconos/carpeta-cerrada.svg",
                abierto:grupo.abierto,
                activo:grupo.activo,
                items:grupo.getItems(),
                item:grupo
            }
            this.items.push(item);
        }
        html = "<table class='tabla-items-capas mt-1'>";
        html += this.getHTMLItems(this.items, 0, null);
        html += "</table>";
        this.cntItems.html = html;
        this.cntItems.findAll(".activador-item").forEach(e => {
            e.onclick = async _ => {
                let grupoActivo = window.geoportal.capas.getGrupoActivo();
                let idItemActivo = grupoActivo.itemActivo?grupoActivo.itemActivo.id:null;
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.tipo == "visualizador") {
                    if (item.activo) {
                        if (item.item.id == idItemActivo) grupoActivo.itemActivo = item.item.capa;
                        await item.capa.desactivaVisualizador(item.codigo);
                    } else {
                        await item.capa.activaVisualizador(item);
                    }
                } else if (item.tipo == "filtro") {
                    item.item.activo = !item.item.activo;
                    await item.capa.cambioFiltros();
                } else {                    
                    throw "Tipo de item '" + item.tipo + "' no se reconoce como activable";
                }
                this.refresca();
            }
        });
        this.cntItems.findAll(".seleccionador-item").forEach(e => {
            e.onclick = async _ => {
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.tipo == "grupo") {
                    await window.geoportal.capas.activaGrupo(item.indice);
                } else {
                    throw "Tipo de item '" + item.tipo + "' no se reconoce como seleccionable";
                }
                this.refresca();
            }
        });
        this.cntItems.findAll(".eliminador-item").forEach(e => {
            e.onclick = async _ => {
                let grupoActivo = window.geoportal.capas.getGrupoActivo();
                let idItemActivo = grupoActivo.itemActivo?grupoActivo.itemActivo.id:null;
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.tipo == "grupo") {
                    if (window.geoportal.capas.grupos.length == 1) return;
                    this.showDialog("common/WConfirm", {
                            message:`¿Confirma que desea eliminar el grupo de capas '${item.nombre}'?`,
                            title:"Esta Operación no se puede deshacer"
                        }, 
                        async _ => {
                            await window.geoportal.capas.removeGrupo(item.indice);
                            window.geoportal.admAnalisis.ajustaPanelAnalisis();
                            this.refresca();
                        })                    
                } else if (item.tipo == "capa") {
                    this.showDialog("common/WConfirm", {
                        message:`¿Confirma que desea eliminar la capa '${item.nombre}'?`,
                        title:"Esta Operación no se puede deshacer"
                    }, 
                    async _ => {
                        let capaDeItem = this.getCapaDeItem(this.mapaItemsPorId[idItemActivo]);
                        if (capaDeItem && capaDeItem.id == item.item.id) {
                            grupoActivo.itemActivo = grupoActivo;
                        }
                        item.grupo.removeCapa(item.indice);
                        window.geoportal.admAnalisis.ajustaPanelAnalisis();
                        this.refresca();
                    })   
                } else if (item.tipo == "objeto") {
                    this.showDialog("common/WConfirm", {
                        message:`¿Confirma que desea eliminar el objeto '${item.nombre}'?`,
                        title:"Esta Operación no se puede deshacer"
                    }, 
                    async _ => {
                        if (item.item.id == idItemActivo) grupoActivo.itemActivo = grupoActivo;
                        item.item.capa.removeObjeto(item.item);
                        window.geoportal.mapa.dibujaObjetos();    
                        window.geoportal.admAnalisis.ajustaPanelAnalisis();
                        this.refresca();
                    })  
                } else {
                    throw "Tipo de item '" + item.tipo + "' no se reconoce como eliminable";
                }
            }
        });
        this.cntItems.findAll(".nombre-item").forEach(e => {
            e.onclick = _ => {
                let tr = e.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                let refrescar = false;
                if (item.items && item.items.length) {
                    if (item.tipo == "grupo") {
                        let grupo = window.geoportal.capas.getGrupo(item.indice);
                        //grupo.abierto = !grupo.abierto;
                    } else if (item.tipo == "capa") {
                        let capa = item.grupo.capas[item.indice];
                        //capa.abierto = !capa.abierto;
                    }
                    refrescar = true;
                }
                if (tr.getAttribute("data-grupo-activo") == "true") {
                    this.seleccionaItem(item);
                    refrescar = true;
                }
                if (refrescar) this.refresca();
            }
        });
        this.cntItems.findAll(".abridor").forEach(e => {
            e.onclick = _ => {
                let idItem = e.getAttribute("data-id-item");
                let item = this.mapaItemsPorId[idItem];
                item.abierto = !item.abierto;
                this.refresca();
            }
        });
        await this.refrescaPanelPropiedades();
    }

    async refrescaPanelPropiedades(forzarCreacion) {        
        let itemActivo = window.geoportal.capas.getGrupoActivo().itemActivo;
        if (itemActivo.configPanel && !itemActivo.configPanel.flotante) {
            if (itemActivo.id == this.panelPropiedades.idItem && !forzarCreacion) {
                await this.panelPropiedades.refresca();
            } else {
                if (forzarCreacion) {
                    await this.panelPropiedades.creaDesde(null);
                }
                await this.panelPropiedades.creaDesde(itemActivo)
                this.mostrandoPanelPropiedades = true;
                this.panelPropiedades.show();
                this.doResize();
                this.panelPropiedades.inicializaScroll();
            }
        } else if (this.mostrandoPanelPropiedades) {
            this.mostrandoPanelPropiedades = false;
            await this.panelPropiedades.creaDesde(null);
            this.panelPropiedades.hide();
            this.doResize();
        }   
    }

    getHTMLItems(items, nivel, indicePadre, inactivo) {
        let grupoActivo = window.geoportal.capas.getGrupoActivo();
        let idItemActivo = grupoActivo.itemActivo?grupoActivo.itemActivo.id:null;
        if (items.length > 700) {
            items = [{
                tipo:"advertencia", activo:false, icono:"img/iconos/advertencia.svg",
                nombre:"Demasiados elementos [" + items.length + "]"
            }]
        }
        let html = items.reduce((html, item, i) => {
            let grupoInactivo = inactivo || (item.tipo == "grupo" && !item.activo);
            let subitems = item.items?item.items:[];
            let indiceNivel = "" + (indicePadre?(indicePadre + "-" + i):i)
            this.mapaItems[indiceNivel] = item;
            if (item.item) this.mapaItemsPorId[item.item.id] = item.item;
            if (!indicePadre && i > 0) {
                html += "<tr><td colspan='4' style='height:10px;'></td></tr>";
            }
            let claseFila = (item.item && item.item.id == idItemActivo)?"fila-item-capa-activo":"fila-item-capa";
            if (item.tipo == "grupo") claseFila += " fila-grupo";
            html += "<tr class='" + claseFila + "' data-indice-nivel='" + indiceNivel + "' style='" + (grupoInactivo?"opacity:0.5;":"") + "' data-grupo-activo='" + (!grupoInactivo) + "' >";            
            html += "<td style='width:14px; text-align:left;'>";
            if (subitems.length) {
                if (item.item.abierto) {
                    html += "<i class='fas fa-lg fa-caret-down abridor' " + (item.item?"data-id-item='" + item.item.id + "'":"") + "></i>";
                } else {
                    html += "<i class='fas fa-lg fa-caret-right abridor' " + (item.item?"data-id-item='" + item.item.id + "'":"") + "></i>";
                }
            } else {
                html += "";
            }
            html += "</td>";
            if (item.items && item.items.length) {
                html += "<td style='width:22px;'><img src='" + item.icono + "' class='abridor' " + (item.item?"data-id-item='" + item.item.id + "'":"") + " style='width:18px; padding-right:2px; '/></td>";
            } else {
                html += "<td style='width:22px;'><img src='" + item.icono + "' style='width:18px; padding-right:2px; '/></td>";
            }
            html += "<td style='width:20px; border-left: 1px solid gray; padding-left:2px; '>";
            let nombreSeleccionable = true;
            if (item.seleccionable || item.activable) {
                if (item.activable) { 
                    if (grupoInactivo) {
                        if (item.activo) {
                            html += "    <i class='far fa-lg fa-check-square'></i>";
                        } else {
                            html += "    <i class='far fa-lg fa-square'></i>";
                            nombreSeleccionable = false;
                        }    
                    } else {
                        if (item.activo) {
                            html += "    <i class='far fa-lg fa-check-square activador-item'></i>";
                            if (item.tipo == "filtro") nombreSeleccionable = false;
                        } else {
                            html += "    <i class='far fa-lg fa-square activador-item'></i>";
                            nombreSeleccionable = false;
                        }    
                    }
                } else {
                    if (grupoInactivo && item.tipo != "grupo") {
                        if (item.seleccionado) {
                            html += "    <i class='far fa-lg fa-dot-circle'></i>";
                        } else {
                            html += "    <i class='far fa-lg fa-circle'></i>";
                        }    
                    } else {
                        if (item.seleccionado) {
                            html += "    <i class='far fa-lg fa-dot-circle seleccionador-item'></i>";
                        } else {
                            html += "    <i class='far fa-lg fa-circle seleccionador-item'></i>";
                        }    
                    }
                }
            } else {
                html += "&nbsp;";
            }
            html += "</td>";
            html += "<td class='" + (nombreSeleccionable?"nombre-item":"") + "' style='padding-left:" + (nivel * 8) + "px;' " + (item.item?"data-id-item='" + item.item.id + "'":"") + ">" + item.nombre + "</td>";
            html += "<td>";
            if (item.eliminable && (!grupoInactivo || item.tipo == "grupo") && !(item.tipo == "grupo" && items.length == 1)) {
                html += "<i class='far fa-trash-alt eliminador-item' style='cursor: pointer; '></i>";
            } else {
                html += "";
            }
            html += "<td>";
            if (item.item) {
                if (item.item.isWorking) {
                    html += "<i class='fas fa-spin fa-spinner' style='display: inline-block; ' data-id-item='" + item.item.id + "'></i>";
                } else {
                    html += "<i class='fas fa-spin fa-spinner' style='display: none; ' data-id-item='" + item.item.id + "'></i>";
                }
            }
            html += "</td>";
            html += "<td>";
            if (item.item && item.item.mensajes) {
                let display = "display:none; ";
                let src = "";
                if (item.item.mensajes.nAdvertencias) {
                    display = "";
                    src = "img/iconos/advertencia.svg";
                }
                if (item.item.mensajes.nErrores) {
                    display = "";
                    src = "img/iconos/error.svg";
                }
                html += "<img class='estado-mensajes' style='" + display + "width:14px;' src='" + src + "'  data-id-item='" + item.item.id + "' />";
            }
            html += "</td>";
            if (item.item && item.item.addWorkingListener) {
                let startWorkingListener = _ => {
                    let img = this.cntItems.find(".fa-spinner[data-id-item='" + item.item.id + "']");
                    img.style.display = "inline-block";
                };
                this.workingListeners.push({item:item.item, listener:startWorkingListener});
                item.item.addWorkingListener("start", startWorkingListener);
                let finishWorkingListener = _ => {
                    let img = this.cntItems.find(".fa-spinner[data-id-item='" + item.item.id + "']");
                    img.style.display = "none";
                };
                this.workingListeners.push({item:item.item, listener:finishWorkingListener});
                item.item.addWorkingListener("finish", finishWorkingListener);
                let refrescarWorkingListener = async _ => {
                    await this.refresca();
                };
                this.workingListeners.push({item:item.item, listener:refrescarWorkingListener});
                item.item.addWorkingListener("refrescar", refrescarWorkingListener);
            }
            html += "</tr>";            
            if (subitems.length && item.item.abierto) {
                html += this.getHTMLItems(subitems, nivel+1, indiceNivel, grupoInactivo);
            }
            return html;
        }, "");
        return html;
    }

    async onCmdAgregarGrupo_click() {
        let g = new GrupoCapas("Nuevo Grupo de Capas");
        await window.geoportal.capas.addGrupo(g);
        this.refresca();
    }

    doResize() {
        let s = this.size;        
        if (this.mostrandoPanelPropiedades) {
            let h = this.panelPropiedades.height;
            this.scrollerItems.view.style.height = (s.height - h - 34 - 6) + "px";
            this.panelPropiedades.view.style.height = h + "px";
            this.panelPropiedades.doResize();
        } else {
            this.scrollerItems.view.style.height = s.height + "px";
        }
    }

    seleccionaItem(item) {        
        let grupoActivo = window.geoportal.capas.getGrupoActivo();        
        grupoActivo.itemActivo = item.item;
        if (item.tipo == "objeto") {            
            window.geoportal.mapa.seleccionaObjeto(item.item);
            window.geoportal.mapa.dibujaObjetos();
            item.item.aseguraVisible();
        } else {
            window.geoportal.admAnalisis.ajustaPanelAnalisis();
        }
    }

    async cambiosMensajes(listaIdsCambiados) {
        listaIdsCambiados.forEach(async id => {
            let img = this.cntItems.find(".estado-mensajes[data-id-item=\"" + id + "\"]");
            let item = this.mapaItemsPorId[id];
            if (img) {
                if (item.mensajes.nErrores) {
                    img.src = "img/iconos/error.svg";
                    img.style.display = "block";
                } else if (item.mensajes.nAdvertencias) {
                    img.src = "img/iconos/advertencia.svg";
                    img.style.display = "block";
                } else {
                    img.src = "";
                    delete img.style.display;
                }
                await this.panelPropiedades.cambioMensajesItem(item);
            }
            if (item && item.mensajes) {
                let flotante = window.geoportal.capas.getGrupoActivo().getPanelesFlotantes().find(p => p.item && p.item.id == id);
                if (flotante) await flotante.cambioMensajesItem(item);
            }
        });
    }
}
ZVC.export(Capas);