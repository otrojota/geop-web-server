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
        console.log("refrescando desde grupos", window.geoportal.capas.grupos);
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
                icono:"img/iconos/carpeta-abierta.svg",
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
            e.onclick = _ => {
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.tipo == "grupo") {
                    window.geoportal.capas.activaGrupo(item.indice);
                } else {
                    throw "Tipo de item '" + item.tipo + "' no se reconoce como seleccionable";
                }
                this.refresca();
            }
        });
        this.cntItems.findAll(".eliminador-item").forEach(e => {
            e.onclick = _ => {
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.tipo == "grupo") {
                    if (window.geoportal.capas.grupos.length == 1) return;
                    window.geoportal.capas.removeGrupo(item.indice);
                } else if (item.tipo == "capa") {
                    item.grupo.removeCapa(item.indice);
                } else {
                    throw "Tipo de item '" + item.tipo + "' no se reconoce como eliminable";
                }
                this.refresca();
            }
        });
    }

    getHTMLItems(items, nivel, indicePadre) {
        let html = items.reduce((html, item, i) => {
            let subitems = item.items?item.items:[];
            let indiceNivel = "" + (indicePadre?(indicePadre + "-" + i):i)
            this.mapaItems[indiceNivel] = item;
            html += "<tr data-indice-nivel='" + indiceNivel + "'>";            
            html += "<td style='width:14px; text-align:left;'>";
            if (subitems.length) {
                html += "<i class='fas fa-lg fa-caret-right'></i>";
            } else {
                html += "";
            }
            html += "</td>";
            html += "<td><img src='" + item.icono + "' style='width:18px; padding-right:2px; '/></td>";
            html += "<td style='width:20px; border-left: 1px solid gray; padding-left:2px; '>";
            let nombreSeleccionable = true;
            if (item.seleccionable || item.activable) {
                if (item.activable) { 
                    if (item.activo) {
                        html += "    <i class='far fa-lg fa-check-square activador-item'></i>";
                    } else {
                        html += "    <i class='far fa-lg fa-square activador-item'></i>";
                        nombreSeleccionable = false;
                    }
                } else {
                    if (item.seleccionado) {
                        html += "    <i class='far fa-lg fa-dot-circle seleccionador-item'></i>";
                    } else {
                        html += "    <i class='far fa-lg fa-circle seleccionador-item'></i>";
                    }
                }
            } else {
                html += "&nbsp;";
            }
            html += "</td>";
            html += "<td class='" + (nombreSeleccionable?"nombre-item":"") + "' style='padding-left:" + (nivel * 8) + "px;'>" + item.nombre + "</td>";
            html += "<td>";
            if (item.eliminable) {
                html += "<i class='far fa-trash-alt eliminador-item' style='cursor: pointer; '></i>";
            } else {
                html += "";
            }
            html += "</tr>";
            html += this.getHTMLItems(subitems, nivel+1, indiceNivel);
            return html;
        }, "");
        return html;
    }

    onCmdAgregarGrupo_click() {
        let g = new GrupoCapas("Nuevo Grupo de Capas");
        window.geoportal.capas.addGrupo(g);
        this.refresca();
    }
}
ZVC.export(Capas);