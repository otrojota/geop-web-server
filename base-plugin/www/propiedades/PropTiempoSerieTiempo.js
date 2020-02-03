class PropTiempoSerieTiempo extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "tiempo-serie-tiempo";  
        this.options = options;
        this.analizador = options.analizador;    
    }    
    async destruye() {}
    get config() {
        let c = this.analizador.config.paneles[this.codigo];
        if (c) return c;
        this.analizador.config.paneles[this.codigo] = {
            abierto:false
        }
        return this.analizador.config.paneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
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
        this.refrescaTitulo();
        let tiempo = this.analizador.config.tiempo;
        this.edTipoTiempo.setRows([{
            codigo:"relativo", nombre:"Relativo al Mapa"
        }, {
            codigo:"fijo", nombre:"Límites Fijos"
        }], tiempo.tipo);        
        if (tiempo.tipo == "relativo") {
            this.tiempoRelativo.show();
            this.tiempoFijo.hide();            
            this.edFrom.value = tiempo.from;
            this.edTo.value = tiempo.to;
        } else {
            this.tiempoRelativo.hide();
            this.tiempoFijo.show();            
            if (!tiempo.fromDate || !tiempo.toDate) {
                tiempo.fromDate = TimeUtils.now.valueOf() - 24*60*60*1000;
                tiempo.toDate = TimeUtils.now.valueOf();
            }
            this.edFromDate.value = TimeUtils.fromUTCMillis(tiempo.fromDate);
            this.edToDate.value = TimeUtils.fromUTCMillis(tiempo.toDate);
        }
    }
    refrescaTitulo() {
        let tiempo = this.analizador.config.tiempo;        
        if (tiempo.tipo == "relativo") {
            this.titulo.text = "Tiempo Relativo: [" + tiempo.from + ", " + tiempo.to + "]";
        } else {
            this.titulo.text = "Tiempo Fijo";
        }
    }
    async onEdFrom_change() {
        let v = parseFloat(this.edFrom.value);
        if (isNaN(v)) return;
        this.analizador.config.tiempo.from = v;
        this.refrescaTitulo();
        await this.options.contenedor.refrescaPanelAnalisis();
    }
    async onEdTo_change() {
        let v = parseFloat(this.edTo.value);
        if (isNaN(v)) return;
        this.analizador.config.tiempo.to = v;
        this.refrescaTitulo();
        await this.options.contenedor.refrescaPanelAnalisis();
    }
    async onEdFromDate_change() {
        this.analizador.config.tiempo.fromDate = this.edFromDate.value.valueOf();
        this.refrescaTitulo();
        await this.options.contenedor.refrescaPanelAnalisis();
    }
    async onEdToDate_change() {
        this.analizador.config.tiempo.fromDate = this.edToDate.value.valueOf();
        this.refrescaTitulo();
        await this.options.contenedor.refrescaPanelAnalisis();
    }

    async onEdTipoTiempo_change() {
        this.analizador.config.tiempo.tipo = this.edTipoTiempo.value;
        this.refresca();
        await this.options.contenedor.refrescaPanelAnalisis();
    }
}
ZVC.export(PropTiempoSerieTiempo);