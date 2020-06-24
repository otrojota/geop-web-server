function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

class Capa {
    static incWorking() {
        if (Capa.nWorking === undefined) Capa.nWorking = 0;
        if (!Capa.nWorking) {
            //console.log("START WORKINIG");
            window.geoportal.panelLeft.startWorking();
        }
        Capa.nWorking++;
    }
    static decWorking() {
        Capa.nWorking--;
        if (Capa.nWorking < 0) {
            console.warn("Capa nWorking < 0");
            Capa.nWorking = 0;
        }
        if (!Capa.nWorking) {
            //console.log("FINISH WORKING");
            window.geoportal.panelLeft.finishWorking();
        }
    }
    constructor(config) {
        this.id = uuidv4();
        this.config = JSON.parse(JSON.stringify(config));
        this.nivel = this.config.nivelInicial?config.nivelInicial:0;
        if (this.config.opacidad === undefined) this.config.opacidad = 80;
        this.visualizadoresActivos = {};
        this.preConsultando = false;
        this.consultando = false;
        this.listenersPreconsulta = null;
        this.listenersConsulta = [];
        this.preconsulta = null;
        this.resultadoConsulta = null;
        this.idBasePanel = window.geoportal.mapa.creaIdPanelesCapa();
        this.panelesMapa = [];
        this.nextIdConsulta = 1;
        this.tiempoFijo = null;
        this.configPanel = {
            flotante:false,
            height:340, width:300,
            configSubPaneles:{}
        }
        this.configAnalisis = {
            height:320, width:300,
            analizador:null,
            analizadores:{}
        }
        if (config.opciones && config.opciones.configAnalisis) {
            this.configAnalisis = config.opciones.configAnalisis;
        }
        this.workingListeners = []; // {accion:"start"|"finish"|"refrescar", listener:function}
        this.objetos = null;
        this.mensajes = new MensajesGeoportal(this, this.origen);
        if (this.tipo == "dataObjects") {
            if (!this.config.opciones || !this.config.opciones.geoJSON) {
                this.parseConfigDataObjects();
                this.invalida();
            }
        }
        this.codigoDimension = this.config.opciones?this.config.opciones.dimensionMinZ:null;
        this.observa = [];
    }
    get tipo() {return this.config.tipo}
    get codigo() {return this.config.codigo}
    get codigoProveedor() {return this.config.codigoProveedor}
    get urlProveedor() {
        if (this._urlProveedor) return this._urlProveedor;
        let prov = window.geoportal.proveedores.find(p => p.codigo == this.codigoProveedor);
        this._urlProveedor = prov.url;
        return this._urlProveedor;
    }
    get formatos() {return this.config.formatos}
    get niveles() {return this.config.niveles}
    get nivelInicial() {return this.config.nivelInicial}
    get tieneNiveles() {return this.niveles && this.niveles.length > 1}
    get nombre() {return this.config.nombre}
    set nombre(n) {this.config.nombre = n}
    get origen() {return this.config.origen}
    get grupos() {return this.config.grupos}
    get temporal() {return this.config.temporal}
    get tipo() {return this.config.tipo}
    get unidad() {return this.config.unidad}
    get icono() {return this.config.icono}
    get urlIcono() {return this.config.urlIcono}
    get opacidad() {return this.config.opacidad}
    set opacidad(o) {this.config.opacidad = o; this.cambioOpacidad()}
    get esObjetosUsuario() {return this.config.esObjetosUsuario?true:false}
    get tieneObjetos() {return this.esObjetosUsuario || this.tipo == "dataObjects"}

    addWorkingListener(accion, listener) {
        this.workingListeners.push({accion:accion, listener:listener});
    }
    removeWorkingListener(listener) {
        let idx = this.workingListeners.findIndex(l => l.listener == listener);
        if (idx >= 0) this.workingListeners.splice(idx,1);
    }
    startWorking() {
        if (!this.isWorking) Capa.incWorking();
        this.isWorking = true;
        this.workingListeners.filter(l => l.accion == "start").forEach(l => l.listener())
    }
    finishWorking() {
        if (this.isWorking) Capa.decWorking();
        this.isWorking = false;
        this.workingListeners.filter(l => l.accion == "finish").forEach(l => l.listener())
    }
    async triggerRefrescar() {
        let listeners = this.workingListeners.filter(l => l.accion == "refrescar");
        for (let i=0; i<listeners.length; i++) {
            await listeners[i].listener();
        }
    }

    registraPanelMapa(p) {this.panelesMapa.push(p)}
    getVisualizadoresAplicables() {
        let ret = [];
        window.geoportal.capas.clasesVisualizadores.forEach(c => {
            if (c.clase.aplicaACapa(this)) ret.push(c);
        })
        return ret;
    }
    async activaVisualizadoresIniciales() {        
        if (this.config.visualizadoresIniciales) {
            let lista = Object.keys(this.config.visualizadoresIniciales);
            for (let i=0; i<lista.length; i++) {
                let codVisualizador = lista[i];
                let configVisualizador = this.config.visualizadoresIniciales[codVisualizador];
                let clase = window.geoportal.capas.clasesVisualizadores.find(vis => vis.codigo == codVisualizador).clase;
                this.visualizadoresActivos[codVisualizador] = new (clase)(this, configVisualizador);
                await this.visualizadoresActivos[codVisualizador].crea();
            }
            delete this.config.visualizadoresIniciales;
        } else if (this.config.formatos.geoJSON) {
            this.visualizadoresActivos.geojson = new VisualizadorGeoJSON(this, {});
            await this.visualizadoresActivos.geojson.crea();
        }
    }
    crea() {
        this.listaVisualizadoresActivos.forEach(v => v.crea());
    }
    destruye() {
        this.listaVisualizadoresActivos.forEach(v => v.destruye());
        if (this.helper) this.helper.destruyeCapa(this);
    }
    getVisualizador(codigo) {return this.visualizadoresActivos[codigo]}
    getItems() {
        let items = [];
        let vis = this.getVisualizadoresAplicables();
        vis.forEach(v => {
            if (!v.clase.hidden) {
                let urlIcono = null;
                if (v.icono) urlIcono = v.codigoPlugin + "/" + v.icono;
                items.push({
                    tipo:"visualizador",
                    codigo:v.codigo,
                    nombre:v.nombre,
                    icono:v.icono,
                    urlIcono:urlIcono,
                    activable:true,
                    activo:this.visualizadoresActivos[v.codigo]?true:false,
                    item:this.visualizadoresActivos[v.codigo],
                    capa:this
                })
            }
        });
        if (this.objetos) {
            this.objetos.forEach(o => {
                items.push({
                    tipo:"objeto",
                    codigo:o.id,
                    nombre:o.nombre,
                    icono:o.iconoEnMapa?o.iconoEnMapa:o.getIcono(),
                    urlIcono:o.iconoEnMapa?o.iconoEnMapa:o.getIcono(),
                    activable:false,
                    eliminable:this.tipo == "dataObjects"?false:true,
                    item:o,
                    items:o.getItems(),
                    capa:this
                })
            })
        }
        if (this.formatos.geoJSON && this.visualizadoresActivos.geojson.tieneFiltros) {
            this.visualizadoresActivos.geojson.filtros.forEach((f, idx) => {
                items.push({
                    id:this.id + "-" + idx,
                    tipo:"filtro",
                    codigo:this.id + "-" + idx,
                    nombre:f.nombre,
                    icono:this.urlIcono,
                    activable:true,
                    activo:f.activo,
                    seleccionable:false,
                    eliminable:false,
                    item:f,
                    capa:this
                })
            })
        }
        return items;
    }
    async activaVisualizador(v, configVisualizador) {
        let clase = window.geoportal.capas.clasesVisualizadores.find(vis => vis.codigo == v.codigo).clase;
        this.visualizadoresActivos[v.codigo] = new (clase)(this, configVisualizador || {});
        await this.visualizadoresActivos[v.codigo].crea();
        window.geoportal.capas.getGrupoActivo().itemActivo = this.visualizadoresActivos[v.codigo];
        this.visualizadoresActivos[v.codigo].refresca();
    }
    desactivaVisualizador(codigo) {
        this.visualizadoresActivos[codigo].destruye();
        delete this.visualizadoresActivos[codigo];
    }
    get listaVisualizadoresActivos() {
        return Object.keys(this.visualizadoresActivos).map(codigo => (this.visualizadoresActivos[codigo]));
    }

    movioMapa() {
        if (this.tipo == "raster") this.invalida();
    }

    invalida() {
        if (this.preConsultando && this.listenersPreconsulta) {
            this.listenersPreconsulta.forEach(cb => cb("preconsulta cancelada"));
        }
        if (this.listenersConsulta && this.listenersConsulta.length) {
            this.listenersConsulta.forEach(cb => cb("consulta cancelada"));
        }
        this.preconsulta = null;
        this.listenersPreconsulta = null;
        this.listenersConsulta = [];
        this.preConsultando = false;
        this.nextIdConsulta++;
        this.listaVisualizadoresActivos.forEach(visualizador => visualizador.refresca());
        if (this.tipo == "dataObjects") this.cargaGeoJSONDataObjects();
    }
    getURLResultado(fileName) {
        let prov = window.geoportal.proveedores.find(p => p.codigo == this.codigoProveedor);
        return prov.url + "/resultados/" + fileName;
    }
    getPreConsulta(callback) { // (err, preconsulta)
        if (this.preConsulta) {
            callback(null, this.preConsulta);
            return;
        }
        if (this.preConsultando) {
            this.listenersPreconsulta.push(callback);
            return;
        }
        this.startWorking();
        this.preConsultando = true;
        this.listenersPreconsulta = [callback];
        let prov = window.geoportal.proveedores.find(p => p.codigo == this.codigoProveedor);
        let b = window.geoportal.mapa.getLimites();
        let idConsulta = this.nextIdConsulta;
        let tiempo = this.tiempoFijo?this.tiempoFijo:window.geoportal.tiempo;
        fetch(prov.url + "/preconsulta?capa=" + this.codigo + "&lng0=" + b.lng0 + "&lat0=" + b.lat0 + "&lng1=" + b.lng1 + "&lat1=" + b.lat1 + "&tiempo=" + tiempo + "&nivel=" + this.nivel)
            .then(res => {
                if (idConsulta != this.nextIdConsulta) return;
                if (res.status != 200) {
                    res.text().then(txt => {
                        this.listenersPreconsulta.forEach(cb => cb(txt));    
                    })
                    return;
                }
                res.text()
                    .then(txt => {
                        try {
                            this.preconsulta = JSON.parse(txt);
                            if (this.listenersPreconsulta) {
                                this.listenersPreconsulta.forEach(cb => {
                                    try {
                                        cb(null, this.preconsulta)
                                    } catch(error) {
                                        console.error("Error en listener preconsulta", error);
                                    }
                                });
                            }
                        } catch(err) {
                            console.error("Error interpretando respuesta como JSON", err);
                            console.log(txt);
                            this.mensajes.addError(txt);
                        }
                    })
                    .catch(err => {
                        console.error("Error interpretando respuesta de consulta", err);
                        res.text().then(txt => console.error(txt)).catch(e => console.error(e));
                    })
                    .finally(_ => {
                        this.preConsultando = false;
                        this.finishWorking();
                    });        
            })
            .catch(err => {
                console.error("Error en preconsulta");
                console.error(err);
                this.listenersPreconsulta.forEach(cb => cb(err));    
            })
            .finally(_ => {
                this.preConsultando = false;
                this.finishWorking();
            });
    }

    async resuelveConsulta(formato, args, callback) {
        this.startWorking();
        this.listenersConsulta.push(callback);
        let prov = window.geoportal.proveedores.find(p => p.codigo == this.codigoProveedor); 
        let idConsulta = this.nextIdConsulta;      
        if (!args) args = {};
        if (!args.codigoVariable) args.codigoVariable = this.codigo;
        if (!args.time) args.time = this.tiempoFijo?this.tiempoFijo:window.geoportal.tiempo;
        let b = window.geoportal.mapa.getLimites();
        if (args.lng0 === undefined) args.lng0 = b.lng0; 
        if (args.lat0 === undefined) args.lat0 = b.lat0; 
        if (args.lng1 === undefined) args.lng1 = b.lng1; 
        if (args.lat1 === undefined) args.lat1 = b.lat1; 
        if (args.levelIndex === undefined) args.levelIndex = this.nivel;
        fetch(prov.url + "/consulta", {
            method:"POST", 
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({formato:formato, args:args})
        })
        .then(res => {
            if (idConsulta != this.nextIdConsulta) {
                this.finishWorking();
                return;
            }
            if (res.status != 200) {
                this.finishWorking();
                res.text().then(t => {
                    callback(t)
                });
                return;
            }
            res.json().then(async j => {
                this.finishWorking();
                this.resultadoConsulta = j;
                callback(null, j);
            }).catch(err => {
                this.finishWorking();
                callback(err);
            });
        })
        .catch(err => {
            callback(err);
        })
        .finally(_ => {
            let idx = this.listenersConsulta.indexOf(callback);
            if (idx >= 0) this.listenersConsulta.splice(idx,1);
        })
    }

    async refresca() {  
        let proms = this.listaVisualizadoresActivos.reduce((lista, v) => {
            lista.push(v.refresca());
            return lista;
        }, []);        
        if (this.objetos) {
            this.objetos.forEach(o => proms.push(o.cambioTiempo()))
        }
        await Promise.all(proms);
    }

    async addObjetoUsuario(o) {
        if (!this.objetos) this.objetos = [];
        o.capa = this;
        this.objetos.push(o);
        await this.triggerRefrescar();
        this.recalculaValoresObservados();
    }

    removeObjeto(o) {
        let idx = this.objetos.findIndex(obj => obj.id == o.id);
        if (idx >= 0) this.objetos.splice(idx,1);
        //await this.triggerRefrescar();
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"left/propiedades/PropCapa"
        }];
        if (this.tieneNiveles) {
            paneles.push({
                codigo:"niveles",
                path:"left/propiedades/NivelCapa"
            })
        }
        if (this.temporal) {
            paneles.push({
                codigo:"fecha",
                path:"left/propiedades/FechaCapa"
            })
        }
        if (this.tieneObjetos) {
            paneles.push({
                codigo:"observa",
                path:"left/propiedades/CapaObserva"
            });
        }
        if (this.tieneObjetos && this.objetosCargados && this.filtros && this.filtros.length) {
            paneles.push({
                codigo:"filtros",
                path:"left/propiedades/FiltrosCapa"
            })
        }
        return paneles;
    }

    getTituloPanel() {
        return this.nombre;
    }

    cambioOpacidad() {
        this.listaVisualizadoresActivos.forEach(v => v.cambioOpacidadCapa(this.opacidad));
        if (this.tieneObjetos) window.geoportal.mapa.callDibujaObjetos(100);
    }
    async cambioTiempo(forzar) {   
        this.recalculaValoresObservados();
        if ((!this.temporal && this.tipo != "dataObjects") || (this.tiempoFijo && !forzar)) return;        
        await this.refresca();
    }
    cambioNivel() {
        this.refresca();
    }

    /* Filtros */
    async cambioFiltros() {
        if (this.formatos.geoJSON && this.visualizadoresActivos.geojson) {
            await this.visualizadoresActivos.geojson.cambioFiltros();
        } else if (this.tieneObjetos) {
            this.aplicaFiltros();
            if (window.capasController) window.capasController.refresca();
            window.geoportal.mapa.callDibujaObjetos();
        }
    }

    /* Data Objects */
    parseConfigDataObjects() {
        this.objetos = [];
        this.config.objetos.forEach(o => {
            switch(o.tipo) {
                case "punto":
                    let proveedor = window.geoportal.getProveedor(this.codigoProveedor);                    
                    o.variables.forEach(v => v.icono = proveedor.url + "/" + v.icono);
                    o.urlIcono = proveedor.url + "/" + o.icono;
                    let configPunto = {
                        iconoEnMapa: proveedor.url + "/" + o.icono,
                        variables: o.variables,
                        movible:false, nombreEditable:false
                    }
                    if (o.extraConfig) {
                        if (o.extraConfig.configAnalisis) {
                            configPunto.analizadorDefault = {
                                analizador:o.extraConfig.configAnalisis.analizador,
                                config:o.extraConfig.configAnalisis.analizadores[o.extraConfig.configAnalisis.analizador]
                            }
                        }
                    }
                    let punto = new Punto({lat:o.lat, lng:o.lng}, o.nombre, configPunto);
                    punto.codigo = o.codigo;
                    punto.capa = this;
                    this.objetos.push(punto);
                    break;
                default:
                    console.error("Capa de dataObjects no maneja [aún] objetos del tipo '" + o.tipo + "'");
            }
        });
        this.objetosCargados = true;
    }
    cargaGeoJSONDataObjects() {
        if (this.objetosCargados) return;
        this.startWorking();
        this.resuelveConsulta("geoJSON", {}, (err, geoJSON) => {
            if (err) {
                this.finishWorking();
                console.error(err);
                this.mensajes.addError(err);
                return;
            }
            this.filtros = geoJSON._filtros || [];
            this.filtros.forEach(f => {
                f.filtros.forEach(s => {
                    s.func = eval("(" + s.filtro + ")")
                })
            })
            let fEstilo = this.config.opciones.estilos?eval("(" +this.config.estilos + ")"):_ => ({stroke:"black", strokeWidth:1})
            if (this.config.opciones && this.config.opciones.estilos) fEstilo = eval("(" +this.config.opciones.estilos + ")");
            this.objetos = [];
            geoJSON.features.forEach(f => this.agregaGeoObjeto(f, f.geometry, fEstilo(f)));
            this.aplicaFiltros();
            this.objetosCargados = true;
            if (window.capasController) {
                window.capasController.refresca();
                window.capasController.refrescaPanelPropiedades(true);
            }
            window.geoportal.mapa.callDibujaObjetos();
        });
    }
    agregaGeoObjeto(f, geometry, estilo) {        
        if (geometry.type == "Polygon" || geometry.type == "MultiPolygon") {
            this.objetos.push(new Poligonos(f, this, estilo));
        } else if (geometry.type == "LineString" || geometry.type == "MultiLineString") {
            this.objetos.push(new Lineas(f, this, estilo));
        } else if (geometry.type == "GeometryCollection") {
            geometry.geometries.forEach((g, i) => {
                let clone = JSON.parse(JSON.stringify(f));
                clone.properties.id = clone.properties.id + "-" + (i+1);
                clone.geometry = g;
                this.agregaGeoObjeto(clone, g, estilo);
            });
        } else if (geometry.type == "Point") {
            let config = {nombreEditable:false};
            if (this.config.opciones.iconoEnMapa) {
                config.iconoEnMapa = this.urlProveedor + "/" + this.config.opciones.iconoEnMapa;
            }
            let punto = new Punto({lng:geometry.coordinates[0], lat:geometry.coordinates[1]}, f.properties.nombre, config, f.properties.id);
            punto.capa = this;
            punto.properties = f.properties;
            this.objetos.push(punto);
        } else {
            console.warn("Tipo de geometría '" + geometry.type + "' no soportado aún", f)
        }
    }
    aplicaFiltros() {
        if (!this.filtros) return;
        if (!this.objetosOriginales) this.objetosOriginales = this.objetos;
        let filtrados = [].concat(this.objetosOriginales);
        for (let i=0; i<this.filtros.length; i++) {
            let pasaron = [];
            for (let k=0; k<filtrados.length; k++) {                
                let pasa = false;
                for (let j=0; j<this.filtros[i].filtros.length && !pasa; j++) {
                    if (this.filtros[i].filtros[j].activo) {
                    let func = this.filtros[i].filtros[j].func;
                        let obj = filtrados[k];
                        pasa = func(obj);
                    }
                }
                if (pasa) pasaron.push(filtrados[k]);
            }
            filtrados = pasaron;
        }
        this.objetos = filtrados;
        this.recalculaValoresObservados();
    }
    async recalculaValoresObservados() {
        try {            
            if (!this.observa || !this.objetos) return;
            if (this.cancelandoRecalculoValoresObservados) return; // va a recalcular igual
            if (this.recalculandoValoresObservados) {
                console.warn("Cancelando consulta de valores observados");
                this.cancelandoRecalculoValoresObservados = true;
                if (this.recalculoListener) this.recalculoListener();
                await new Promise(resolve => {
                    this.listenerFinishRecalculo = _ => resolve()
                })
                this.cancelandoRecalculoValoresObservados = false;
                this.listenerFinishRecalculo = null;
                console.warn("Consulta cancelada");
            }
            this.pendientesQueryObservados = [];
            this.valoresObservados = [];
            this.minObserva = this.maxObserva = undefined;
            this.valoresColorear = {}; // idObjeto:number
            this.escalaColorear = undefined;
            if (!this.observa.length || !this.objetos.length) {
                if (this.recalculoListener) this.recalculoListener();
                this.finalizoRecalculoValoresObservados();
                return;
            }
            this.recalculandoValoresObservados = true;
            this.nCalculados = 0;
            if (this.recalculoListener) this.recalculoListener();
            this.startWorking();
            for (let i=0; i<this.observa.length; i++) {
                this.valoresObservados[i] = null;
                let o = this.observa[i];
                if (o.consulta.tipo == "queryMinZ") {
                    this.pendientesQueryObservados.push({indiceObserva:this.pendientesQueryObservados.length, running:false, observa:o});
                } else if (o.consulta.tipo == "capa") {
                    this.objetos.forEach(obj => {
                        this.pendientesQueryObservados.push({indiceObserva:this.pendientesQueryObservados.length, running:false, observa:o, objeto:obj});
                    })
                } else throw "Tipo de consulta '" + o.consulta.tipo + "' no implementado";
            }
            window.geoportal.mapa.callDibujaLeyendas();
            this.totalPendientesRecalculo = this.pendientesQueryObservados.length;
            this.avanceRecalculoValoresObservados = 0;
            let n = 0;
            while (n < 5 && this.pendientesQueryObservados.filter(p => !p.running).length > 0) {
                this.iniciaSiguienteQueryObservados();
                n++;
            }
            await (new Promise(resolve => {
                this.finishRecalculaValores = _ => resolve()
            }))
            this.finishRecalculaValores = null;
            this.finishWorking();
            this.recalculandoValoresObservados = false;
            if (this.listenerFinishRecalculo) this.listenerFinishRecalculo(); 
            else {
                this.finalizoRecalculoValoresObservados();
                if (this.recalculoListener) this.recalculoListener();
            }
            window.geoportal.mapa.callDibujaLeyendas();
        } catch(error) {
            console.error(error);
            this.recalculandoValoresObservados = false;
            if (this.recalculoListener) this.recalculoListener();
            this.finishWorking();
            throw error;
        }
    }
    async iniciaSiguienteQueryObservados() {
        try {
            let pendiente = this.pendientesQueryObservados.find(p => !p.running);
            if (pendiente) {
                pendiente.running = true;
                let o = pendiente.observa;
                try {
                    if (o.consulta.tipo == "queryMinZ") {
                        let res = await o.consulta.getDimSerie(window.geoportal.tiempo);
                        this.valoresObservados[pendiente.indiceObserva] = {value:res.valor, atributos:res.atributos, observa:o};
                        if (o.colorear) {
                            res.valor.filter(r => r.resultado !== undefined).forEach(r => {
                                if (this.minObserva === undefined || r.resultado < this.minObserva) this.minObserva = r.resultado;
                                if (this.maxObserva === undefined || r.resultado > this.maxObserva) this.maxObserva = r.resultado;
                                let obj = this.objetos.find(o => o.getCodigoDimension() == r.dim.code);
                                if (obj) this.valoresColorear[obj.id] = r.resultado;
                            })
                        }
                    } else if (o.consulta.tipo == "capa") {
                        try {
                            let resultado = await o.consulta.getValorEnPunto(window.geoportal.tiempo, pendiente.objeto);
                            this.valoresObservados[pendiente.indiceObserva] = {value:resultado.value, observa:o, objeto:pendiente.objeto};
                            let v = resultado.value;
                            if (o.colorear && !isNaN(v)) {
                                if (this.minObserva === undefined || v < this.minObserva) this.minObserva = v;
                                if (this.maxObserva === undefined || v > this.maxObserva) this.maxObserva = v;
                                this.valoresColorear[pendiente.objeto.id] = v;
                            }
                        } catch(err) {
                            this.valoresObservados[pendiente.indiceObserva] = {value:err, observa:o};
                        }                         
                    }
                } catch(error) {
                    console.error(error);
                } finally {
                    this.nCalculados++;
                    let idx = this.pendientesQueryObservados.indexOf(pendiente);
                    this.pendientesQueryObservados.splice(idx, 1);
                    if (this.totalPendientesRecalculo > 0) this.avanceRecalculoValoresObservados = 100 - parseInt(100 * this.pendientesQueryObservados.length / this.totalPendientesRecalculo);
                    if (this.recalculoListener) this.recalculoListener();
                    if (this.cancelandoRecalculoValoresObservados) {
                        let nCorriendo = this.pendientesQueryObservados.filter(p => p.running).length;
                        console.warn("Esperando que finalicen " + nCorriendo + " consultas activas");
                        if (!nCorriendo) this.finishRecalculaValores();
                    } else {
                        if (!this.pendientesQueryObservados.length) {
                            window.geoportal.mapa.callDibujaLeyendas();                            
                            this.finishRecalculaValores();
                        } else if (this.pendientesQueryObservados.filter(p => !p.running).length > 0) {
                            if (!(this.nCalculados % 5)) window.geoportal.mapa.callDibujaLeyendas();
                            this.iniciaSiguienteQueryObservados();    
                        }
                    }
                }
            }
        } catch(error) {
            throw error;
        }
    }

    finalizoRecalculoValoresObservados() {
        window.geoportal.mapa.dibujaLeyendas();
        if (this.observa.find(o => o.colorear)) {
            let config = this.configPanel.configSubPaneles["observa"];
            if (config.escala.dinamica) {
                config.escala.min = this.minObserva;
                config.escala.max = this.maxObserva;
            }            
        } else {
            this.escalaColorear = null;
        }
        this.colorea();
    }
    async colorea() {
        if (this.recalculandoValoresObservados || this.cancelandoRecalculoValoresObservados) return; 
        if (this.observa.find(o => o.colorear)) {
            let config = this.configPanel.configSubPaneles["observa"];
            this.escalaColorear = await EscalaGeoportal.porNombre(config.escala.nombre);
            this.escalaColorear.actualizaLimites(config.escala.min, config.escala.max);
        } else {
            this.escalaColorear = null;
        }
        window.geoportal.mapa.callDibujaObjetos();
    }
}

class VisualizadorCapa {
    constructor(codigo, capa, config) {
        this.id = uuidv4();
        this.codigo = codigo;
        this.capa = capa;
        this.config = config;   
        this.workingListeners = []; // {accion:"start"|"finish", listener:function}
        this.mensajes = new MensajesGeoportal(this, capa.origen);
    }
    static aplicaACapa(capa) {return false;}
    static get hidden() {return false}
    async crea() {}
    async destruye() {}
    async refresca() {
        this.mensajes.clear();
    }
    addWorkingListener(accion, listener) {
        this.workingListeners.push({accion:accion, listener:listener});
    }
    removeWorkingListener(listener) {
        let idx = this.workingListeners.findIndex(l => l.listener == listener);
        if (idx >= 0) this.workingListeners.splice(idx,1);
    }
    startWorking() {
        if (!this.isWorking) Capa.incWorking();
        this.isWorking = true;
        this.workingListeners.filter(l => l.accion == "start").forEach(l => l.listener())
    }
    finishWorking() {
        if (this.isWorking) Capa.decWorking();
        this.isWorking = false;
        this.workingListeners.filter(l => l.accion == "finish").forEach(l => l.listener())
    }
    cambioOpacidadCapa(opacidad) {
        console.log("cambioOpacidad no se sobreescribió");
    }
}

// Analizadores
class Analizador {
    static aplicaAObjetoCapa(o, c) {
        console.error("aplicaAObjetoCapa no sobreescrito en Analizador");
        return false
    }

    constructor(codigo, objeto, capa, config) {
        this.id = uuidv4();
        this.codigo = codigo;
        this.objeto = objeto;
        this.capa = capa;
        this._config = config;
        this.mensajes = new MensajesGeoportal(this);
    }

    get config() {return this.capa.configAnalisis.analizadores[this.codigo]}

    async init() {}
    
    getPanelesPropiedades() {
        console.error("getPanelesPropiedades no sobreescrito en Analizador");
        return [];
    }
    getRutaPanelAnalisis() {
        console.error("getRutaPanelAnalisis no sobreescrito en Analizador");
        return "common/Empty";
    }
}

class GrupoCapas {
    constructor(nombre, activo) {
        this.id = uuidv4();
        this.nombre = nombre;
        this.capas = [];
        this.activo = activo?true:false;
        this.abierto = true;
        this.itemActivo = this;
        this.configPanel = {
            flotante:false,
            height:220, width:300,
            configSubPaneles:{}
        }
        this.panelesFlotantes = [];
    }
    addCapa(capa) {this.capas.push(capa)}
    removeCapa(idx) {
        let capa = this.capas[idx];
        if (capa.id == this.itemActivo.id) this.itemActivo = this;
        let necesitaDibujar = capa.tieneObjetos;
        capa.destruye();
        this.capas.splice(idx,1)
        if (necesitaDibujar) {
            window.geoportal.mapa.dibujaObjetos();
            window.geoportal.mapa.dibujaLeyendas();
        }
    }
    getCapa(idx) {return this.capas[idx]}
    findCapa(id) {return this.capas.find(c => c.id == id)}
    async activa() {
        this.activo = true
        let proms = this.capas.reduce((lista, capa) => {
            lista.push(capa.crea());
            return lista;
        }, []);
        await Promise.all(proms);
        proms = this.capas.reduce((lista, capa) => {
            lista.push(capa.refresca());
            return lista;
        }, []);
        await Promise.all(proms);
        await this.creaPanelesFlotantes();
        window.geoportal.mapa.dibujaObjetos();
    }
    async desactiva() {        
        let proms = this.capas.reduce((lista, capa) => {
            lista.push(capa.destruye());
            return lista;
        }, []);
        await Promise.all(proms);
        this.activo = false
        await this.destruyePanelesFlotantes();
    }
    getItems() {
        let lista = [];
        for (let i=this.capas.length - 1; i>= 0; i--) {
            let capa = this.capas[i];
            lista.push({
                tipo:"capa", 
                codigo:capa.codigo,
                nombre:capa.nombre,
                icono:capa.urlIcono,
                grupoActivo:this.activo,
                eliminable:true,
                indice:i,
                grupo:this,
                abierto:capa.abierto,
                item:capa,
                items:capa.getItems()
            })
        }
        return lista;
    }

    getPanelesFlotantes() {
        return this.panelesFlotantes;
    }
    async creaPanelFlotante(item) {
        let panel = await window.geoportal.admPanelesFlotantes.addPanelFlotante(item);
        this.panelesFlotantes.push(panel);
    }
    async destruyePanelFlotante(item) {
        let idx = this.panelesFlotantes.findIndex(p => p.item.id == item.id);
        if (idx < 0) {
            console.error("No se encontró el panel flotante", item);
            return;
        };
        await window.geoportal.admPanelesFlotantes.removePanelFlotante(this.panelesFlotantes[idx]);        
        this.panelesFlotantes.splice(idx, 1);
    }
    agregaItemsConPanelFlotante(item, items) {
        if (item.configPanel && item.configPanel.flotante) {
            items.push(item);
        }
        if (item.getItems) {
            let subitems = item.getItems();
            subitems.forEach(subitem => {
                if (subitem.item) {
                    this.agregaItemsConPanelFlotante(subitem.item, items)
                }
            })
        }
    }
    async creaPanelesFlotantes() {
        let items = [];
        this.agregaItemsConPanelFlotante(this, items);
        for (let i=0; i<items.length; i++) {
            let item = items[i];
            await this.creaPanelFlotante(item);
        }
    }
    async destruyePanelesFlotantes() {
        while (this.panelesFlotantes.length) {
            let panel = this.panelesFlotantes[0];
            await this.destruyePanelFlotante(panel.item);
        }
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"left/propiedades/PropGrupo"
        }];
        return paneles;
    }
    getTituloPanel() {
        return this.nombre;
    }
}

class Capas {
    constructor() {
        this.clasesVisualizadores = [];
        this.clasesAnalizadores = [];
        this.listener = null;
        this.grupos = [new GrupoCapas("Mis Capas", true)];
    }
    setListener(listener) {
        this.listener = listener;
    }
    add(config) {
        let capa;
        if (config.opciones && config.opciones.helperCapas) {
            let helper = window.geoportal.getHelperCapas(config.opciones.helperCapas);
            if (!helper) throw "NO se encontró el helper de capas '" + config.opciones.helperCapas + "'";
            capa = helper.creaCapa(config);
            capa.helper = helper;
        } else {
            capa = new Capa(config);
        }
        capa.abierto = true;
        this.getGrupoActivo().addCapa(capa);
        this.getGrupoActivo().itemActivo = capa;
        capa.activaVisualizadoresIniciales()
            .then(_ => {
                capa.invalida()
                if (this.listener) this.listener.onCapaAgregada(capa);
                if (capa.tieneObjetos) window.geoportal.mapa.dibujaObjetos();
            });
        return capa;
    }
    async addObjetosUsuario() {
        let config = {
            id:uuidv4(),
            nombre:"Mis Objetos Agregados",
            configPanel:{
                flotante:false,
                height:180, width:300,
                configSubPaneles:{}
            },
            urlIcono:"img/iconos/user-tools.svg",
            esObjetosUsuario:true,
            temporal:true,
            opacidad:100,
            formatos:{objetosUsuario:true}
        }
        let capa = new Capa(config);
        capa.abierto = true;
        this.getGrupoActivo().addCapa(capa);
        this.getGrupoActivo().itemActivo = capa;
        if (this.listener) await this.listener.onCapaAgregada(capa);
        return capa;
    }
    remove(idx) {
        let capa = this.getGrupoActivo().getCapa(idx);
        this.getGrupoActivo().removeCapa(idx);
        if (this.listener) this.listener.onCapaRemovida(capa);
    }
    getCapa(idx) {return this.getGrupoActivo().getCapa(idx)}
    getCapas() {return this.getGrupoActivo().capas}
    registraVisualizador(codigoPlugin, codigo, claseVisualizador, nombre, icono) {
        this.clasesVisualizadores.push({codigoPlugin:codigoPlugin, codigo:codigo, clase:claseVisualizador, nombre:nombre, icono:icono})
    }
    registraAnalizador(codigoPlugin, codigo, claseAnalizador, nombre, icono) {
        this.clasesAnalizadores.push({codigoPlugin:codigoPlugin, codigo:codigo, clase:claseAnalizador, nombre:nombre, icono:icono})
    }
    movioMapa() {
        this.getCapas().forEach(capa => {
            capa.movioMapa();
        });
    }
    getGrupoActivo() {return this.grupos.find(g => g.activo)}
    async activaGrupo(idx) {
        if (this.getGrupoActivo()) await this.getGrupoActivo().desactiva();        
        await this.grupos[idx].activa();
    }
    getGrupo(idx) {return this.grupos[idx]}
    async addGrupo(grupo) {
        this.grupos.push(grupo)
        await this.activaGrupo(this.grupos.length - 1);
    }
    async removeGrupo(idx) {
        let grupo = this.grupos[idx];
        this.grupos.splice(idx, 1);
        if (grupo.activo) await this.activaGrupo(0);
    }

    getAnalizadoresAplicables(objeto, capa) {
        // TODO: Agregar capas
        //if (!(objeto instanceof ObjetoGeoportal)) return [];
        return this.clasesAnalizadores.reduce((lista, a) => {
            if (a.clase.aplicaAObjetoCapa(objeto, capa)) lista.push(a);
            return lista;
        }, []);
    }

    seleccionaPanelCapas() {
        if (this.listener) this.listener.seleccionaCapas();
    }
}

window.geoportal.capas = new Capas();