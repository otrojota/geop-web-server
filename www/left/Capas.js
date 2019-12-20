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
                icono:"img/iconos/carpeta-abierta.svg",
                items:grupo.getItems()
            }
            this.items.push(item);
        }
        html = "<table class='tabla-items-capas mt-1'>";
        html += this.getHTMLItems(this.items, 0, null);
        html += "</table>";
        this.cntItems.html = html;
        this.cntItems.findAll(".seleccionador-item").forEach(e => {
            e.onclick = _ => {
                let tr = e.parentNode.parentNode;
                let indiceNivel = tr.getAttribute("data-indice-nivel");
                let item = this.mapaItems[indiceNivel];
                if (item.seleccionado) item.capa.desactivaVisualizador(item.codigo);
                else item.capa.activaVisualizador(item);
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
            html += "<td>";
            if (subitems.length) {
                html += "<i class='fas fa-caret-right'></i>";
            } else {
                html += "";
            }
            html += "</td>";
            html += "<td><img src='" + item.icono + "' style='width:20px;'/></td>";
            html += "<td style='width:20px;'>";
            let nombreSeleccionable = true;
            if (item.seleccionable) {
                if (item.seleccionado) {
                    html += "    <i class='far fa-lg fa-check-square seleccionador-item'></i>";
                } else {
                    html += "    <i class='far fa-lg fa-square seleccionador-item'></i>";
                    nombreSeleccionable = false;
                }
            } else {
                html += "&nbsp;";
            }
            html += "</td>";
            html += "<td class='" + (nombreSeleccionable?"nombre-item":"") + "' style='padding-left:" + (nivel * 8) + "px;'>" + item.nombre + "</td>";
            html += "</tr>";
            html += this.getHTMLItems(subitems, nivel+1, indiceNivel);
            return html;
        }, "");
        return html;
    }
}
ZVC.export(Capas);