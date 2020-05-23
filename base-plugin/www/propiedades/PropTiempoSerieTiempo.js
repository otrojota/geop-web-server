const unidadesTiempo = {"1d":"días", "1M":"meses", "1y":"años"}

class PropTiempoSerieTiempo extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "tiempo-serie-tiempo";  
        this.options = options;
        this.analizador = options.analizador;    
        this.analizador.propTiempoListener = _ => this.refresca();
    }    
    async destruye() {
        this.analizador.propTiempoListener = null;
    }
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
        let v = this.analizador.config.variable;
        if (!v) v = this.analizador.config.variable2;
        if (!v) {
            this.tiempoRelativo.hide();
            this.tiempoFijo.hide();
            return;            
        }
        let nivel = nivelesTemporalidad.indexOf(v.temporalidad);
        if (nivel < 6) nivel = 6; // minimo es 1d
        if (nivel > 7) nivel = 11; // 3M 4M 6M => 1y
        let niveles = [], nivelDefault = "1y", rangoDefault = [-6, 0];
        if (nivel <= 6) {
            niveles.push({codigo:"1d", nombre:"Diaria"});
            nivelDefault = "1d";
            rangoDefault = [-4, 2];
        }
        if (nivel <= 7) {
            niveles.push({codigo:"1M", nombre:"Mensual"});
            if (nivelDefault == "1y") nivelDefault = "1M";
        }
        niveles.push({codigo:"1y", nombre:"Anual"});
        let tempo = this.analizador.config.tiempo.temporalidad;
        console.log("tempo, defaut", tempo, nivelDefault)
        if (!tempo || !niveles.find(n => n.codigo == tempo)) {
            tempo = nivelDefault;
            this.analizador.config.tiempo.temporalidad = tempo;
            this.analizador.config.tiempo.from = rangoDefault[0];
            this.analizador.config.tiempo.to = rangoDefault[1];            
        }
        this.edTemporalidad.setRows(niveles, tempo);
        this.unidadFrom.text = unidadesTiempo[tempo];
        this.unidadTo.text = unidadesTiempo[tempo];

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
            console.log("usando temporalidad", tiempo.temporalidad);
            this.edFromDate.temporalidad = tiempo.temporalidad;
            this.edFromDate.finPeriodo = false;
            this.edFromDate.titulo = "Inicio del Período";
            this.edFromDate.value = tiempo.fromDate;
            this.edToDate.temporalidad = tiempo.temporalidad;
            this.edToDate.finPeriodo = true;
            this.edToDate.titulo = "Fin del Período";
            this.edToDate.value = tiempo.toDate;
        }
    }
    refrescaTitulo() {
        let tiempo = this.analizador.config.tiempo;        
        if (tiempo.tipo == "relativo") {
            this.titulo.text = "Tiempo Relativo: [" + tiempo.from + ", " + tiempo.to + "] " + unidadesTiempo[this.analizador.config.tiempo.temporalidad];
        } else {
            this.titulo.text = "Tiempo Fijo";
        }
    }
    async onEdTemporalidad_change() {
        this.analizador.config.tiempo.temporalidad = this.edTemporalidad.value;
        this.unidadFrom.text = unidadesTiempo[this.analizador.config.tiempo.temporalidad];
        this.unidadTo.text = unidadesTiempo[this.analizador.config.tiempo.temporalidad];
        this.refrescaTitulo();
        await this.options.contenedor.refrescaPanelAnalisis();
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
        this.analizador.config.tiempo.fromDate = this.edFromDate.value;
        this.refrescaTitulo();
        await this.options.contenedor.refrescaPanelAnalisis();
    }
    async onEdToDate_change() {
        this.analizador.config.tiempo.toDate = this.edToDate.value;
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