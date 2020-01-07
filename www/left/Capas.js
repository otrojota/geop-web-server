class Capas extends ZCustomController {
    onThis_init() {
        this.idxCapaSeleccionada = -1;
        this.refresca();
    }
    capaAgregada(capa) {
        this.refresca();
    }
    capaRemovida(capa) {
        this.refresca();
    }

    refresca() {
        this.mapaItems = {};
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
                items:grupo.getItems()
            }
            this.items.push(item);
        }
        html = "<table class='tabla-items-capas mt-1'>";
        html += this.getHTMLItems(this.items, 0, null);
        html += "</table>";
        this.cntItems.html = html;
        this.cntItems.findAll(".activador-item").forEach(e => {
            e.onclick = _ => {
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.tipo == "visualizador") {
                    if (item.activo) item.capa.desactivaVisualizador(item.codigo);
                    else item.capa.activaVisualizador(item);
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
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.tipo == "grupo") {
                    if (window.geoportal.capas.grupos.length == 1) return;
                    await window.geoportal.capas.removeGrupo(item.indice);
                } else if (item.tipo == "capa") {
                    item.grupo.removeCapa(item.indice);
                } else {
                    throw "Tipo de item '" + item.tipo + "' no se reconoce como eliminable";
                }
                this.refresca();
            }
        });
        this.cntItems.findAll(".nombre-item").forEach(e => {
            e.onclick = _ => {
                let tr = e.parentNode;
                console.log("tr", tr);
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                console.log("item", item);
                if (item.items && item.items.length) {
                    if (item.tipo == "grupo") {
                        let grupo = window.geoportal.capas.getGrupo(item.indice);
                        grupo.abierto = !grupo.abierto;
                        console.log("grupo", grupo);
                    } else if (item.tipo == "capa") {
                        let capa = item.grupo.capas[item.indice];
                        capa.abierto = !capa.abierto;
                        console.log("capa", capa);
                    }
                    this.refresca();
                }
            }
        });
    }

    getHTMLItems(items, nivel, indicePadre, inactivo) {
        let html = items.reduce((html, item, i) => {
            let grupoInactivo = inactivo || (item.tipo == "grupo" && !item.activo);
            let subitems = item.items?item.items:[];
            let indiceNivel = "" + (indicePadre?(indicePadre + "-" + i):i)
            this.mapaItems[indiceNivel] = item;
            if (!indicePadre && i > 0) {
                html += "<tr><td colspan='4' style='height:10px;'></td></tr>";
            }
            html += "<tr data-indice-nivel='" + indiceNivel + "' style='" + (grupoInactivo?"opacity:0.5;":"") + "'>";            
            html += "<td style='width:14px; text-align:left;'>";
            if (subitems.length) {
                if (item.abierto) {
                    html += "<i class='fas fa-lg fa-caret-down'></i>";
                } else {
                    html += "<i class='fas fa-lg fa-caret-right'></i>";
                }
            } else {
                html += "";
            }
            html += "</td>";
            html += "<td style='width:22px;'><img src='" + item.icono + "' style='width:18px; padding-right:2px; '/></td>";
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
            html += "<td class='" + (nombreSeleccionable?"nombre-item":"") + "' style='padding-left:" + (nivel * 8) + "px;'>" + item.nombre + "</td>";
            html += "<td>";
            if (item.eliminable && (!grupoInactivo || item.tipo == "grupo") && !(item.tipo == "grupo" && items.length == 1)) {
                html += "<i class='far fa-trash-alt eliminador-item' style='cursor: pointer; '></i>";
            } else {
                html += "";
            }
            html += "</tr>";
            if (subitems.length && item.abierto) {
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
}
ZVC.export(Capas);