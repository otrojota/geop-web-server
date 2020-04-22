class ObservadorGeoJsonMinZ extends ObservadorGeoJson {
    static aplicaAItem(item) {
        return item.ruta?true:false;
    }
 
    // item: {variable, ruta}
    constructor(capa, item) {
        super(capa, item);
        this.min = undefined;
        this.max = undefined;
        if (!this.config.configEscala) {
            this.config.configEscala = {
                dinamica:true,
                nombre:"HSL Lineal Simple",
                unidad:"s/u"
            }
        }
        if (this.config.mostrarEnMapa === undefined) this.config.mostrarEnMapa = true;
        if (!this.config.hPos) this.config.hPos = "izquierda";
        if (!this.config.vPos) this.config.vPos = "arriba";
    }

    get config() {
        let c = this.capa.configPanel.configSubPaneles["geojson-observa"];
        if (c) return c;
        this.capa.configPanel.configSubPaneles["geojson-observa"] = {
            abierto:false
        }
        return this.capa.configPanel.configSubPaneles["geojson-observa"];
    }
    get configEscala() {return this.config.configEscala}
    get mostrarEnMapa() {return this.config.mostrarEnMapa}
    get hPos() {return this.config.hPos}
    get vPos() {return this.config.vPos}

    getTituloPanel() {return "Observar Variable: " + this.item.variable.name}
    getNombreItem() {return this.item.variable.name}

    getPanelesPropiedades() {
        return [{
            codigo:"geojson-escala-observa",
            path:"base/propiedades/PropEscalaObservadorGeoJson"
        }]
    }

    construyeFiltro(filtro, path, valor) {
        let elementosPath = path.split(".");
        let elementoFiltro = filtro;
        elementosPath.forEach((e, i) => {
            if (i == (elementosPath.length - 1)) elementoFiltro[e] = valor;
            else {
                let nuevoElementoFiltro;
                if (!elementoFiltro[e]) {
                    nuevoElementoFiltro = {};
                    elementoFiltro[e] = nuevoElementoFiltro;
                } else {
                    nuevoElementoFiltro = elementoFiltro[e];
                }
                elementoFiltro = nuevoElementoFiltro;
            }
        });
        return filtro;
    }

    async refresca() {
        try {
            this.min = undefined;
            this.max = undefined;
            let {t0, t1} = window.minz.normalizaTiempo(this.item.variable.temporality, window.geoportal.tiempo);
            let visGeoJson = this.capa.listaVisualizadoresActivos.find(v => v instanceof VisualizadorGeoJSON);
            if (!visGeoJson) throw "Capa GeoJSON sin VisualizadorGeoJson";
            let geoJson = visGeoJson.geoJSON;
            let queries = geoJson.features.reduce((lista, f) => {
                if (f.properties._codigoDimension) {                    
                    lista.push({codigoVariable:this.item.variable.code, filter:this.construyeFiltro({}, this.item.ruta, f.properties._codigoDimension), startTime:t0, endTime:t1, codigoDimension:f.properties._codigoDimension, running:false});
                }
                return lista;
            }, []);
            this.queriesPendientes = queries;
            this.summaries = {};
            await (new Promise((resolve, reject) => {
                let n = this.queriesPendientes.length - 1;
                while (n >= 0 && this.queriesPendientes.filter(q => !q.running).length > 0) {
                    this.iniciaSiguienteQuery(resolve, reject);
                }    
            }));
            await this.recreaEscala();
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    async iniciaSiguienteQuery(resolve, reject) {
        let q = this.queriesPendientes.find(q => !q.running);
        if (q) {
            q.running = true;
            try {
                let summary = await window.minz.queryPeriodSummary(q.codigoVariable, q.startTime, q.endTime, q.filter);
                if (summary.value !== undefined) {
                    if (this.min === undefined || summary.value < this.min) this.min = summary.value;
                    if (this.max === undefined || summary.value > this.max) this.max = summary.value;
                }
                this.summaries[q.codigoDimension] = summary;
                let idx = this.queriesPendientes.findIndex(q2 => q2.codigoDimension == q.codigoDimension);
                this.queriesPendientes.splice(idx, 1);
                if (!this.queriesPendientes.length) {
                    resolve()
                } else {
                    if (this.queriesPendientes.filter(q => !q.running).length) {
                        this.iniciaSiguienteQuery(resolve, reject);
                    }
                }
            } catch(error) {
                console.error(error);
            }
        }
    }

    async recreaEscala() {
        this.escala = await EscalaGeoportal.porNombre(this.configEscala.nombre, window.location.origin + window.location.pathname)
        if (this.configEscala.dinamica) {
            this.configEscala.min = this.min;
            this.configEscala.max = this.max;
        }
        this.escala.actualizaLimites(this.configEscala.min, this.configEscala.max);
        if (this.getCambioEscalaListener()) this.getCambioEscalaListener()();
    }

    async cambioEscala() {
        let visGeoJson = this.capa.listaVisualizadoresActivos.find(v => v instanceof VisualizadorGeoJSON);
        if (!visGeoJson) throw "Capa GeoJSON sin VisualizadorGeoJson";
        await this.recreaEscala();
        visGeoJson.repinta();
    }

    getValorDeFeature(f) {
        let sum = this.summaries[f.properties._codigoDimension];
        if (!sum || sum.value === undefined) return undefined;
        return sum.value;
    }
    getValorFormateadoDeFeature(f) {        
        let v = this.getValorDeFeature(f);
        if (v === undefined) return undefined;
        return GeoPortal.round(v, this.item.variable.options.decimals).toLocaleString() + " [" + this.item.variable.options.unit + "]";
    }
    getColorDeFeature(f) {
        let v = this.getValorDeFeature(f);
        return v === undefined?undefined:this.escala.getColor(v);
    }
}

ObservadorGeoJson.registraClaseObservadora(ObservadorGeoJsonMinZ);