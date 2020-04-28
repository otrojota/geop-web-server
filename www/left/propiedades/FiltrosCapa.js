class FiltrosCapa extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "filtros";  
        this.options = options;
        this.capa = options.item;                
    }    
    async destruye() {}
    get config() {
        let c = this.capa.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.capa.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.capa.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onEdNombre_change() {
        this.capa.nombre = this.edNombre.value;
        this.options.contenedor.cambioNombre();
        window.geoportal.editoObjeto("capa", this.capa);
    }
    refresca() {   
        if (this.config.abierto) {
            this.imgAbierto.removeClass("fa-plus-square");
            this.imgAbierto.addClass("fa-minus-square");
            this.contenido.show();
        } else {
            this.imgAbierto.removeClass("fa-minus-square");
            this.imgAbierto.addClass("fa-plus-square");
            this.contenido.hide();
        }
        this.titulo.text = "Filtrar Elementos";
        let html = "";
        this.capa.filtros.forEach((f, i) => {
            let todos = f.filtros.reduce((suma, s) => (suma + (s.activo?1:0)), 0) == f.filtros.length;
            if (html) html += "<hr class='my-1' />";
            html += `<label class="etiqueta-subpanel-propiedades mb-0">${f.titulo} - <span data-id-filtro="${i}" class="todos" style="cursor: pointer; ">Todos <i class="far ml-2 ${todos?"fa-check-square":"fa-square"}"></i></span></label>`;
            html += "<ul>";
            f.filtros.forEach((s, j) => {
                html += `<li class="filtro" style="cursor: pointer;" data-id-filtro="${i}" data-id-subfiltro="${j}"><i class="far ${s.activo?"fa-check-square":"fa-square"} mr-2"></i>${s.nombre}</li>`;
            });
            html += "</ul>";            
        });
        this.contenido.html = html;
        $(this.contenido.view).find(".filtro").click(e => {
            let ed = $(e.currentTarget);
            let i = parseInt(ed.data("id-filtro"));
            let j = parseInt(ed.data("id-subfiltro"));
            this.capa.filtros[i].filtros[j].activo = !this.capa.filtros[i].filtros[j].activo;
            this.refresca();
            this.capa.cambioFiltros();
        });
        $(this.contenido.view).find(".todos").click(e => {
            let ed = $(e.currentTarget);
            let i = parseInt(ed.data("id-filtro"));
            let f = this.capa.filtros[i];
            let todos = f.filtros.reduce((suma, s) => (suma + (s.activo?1:0)), 0) == f.filtros.length;
            f.filtros.forEach(s => s.activo = todos?false:true);
            this.refresca();
            this.capa.cambioFiltros();
        });
    }
}
ZVC.export(FiltrosCapa);