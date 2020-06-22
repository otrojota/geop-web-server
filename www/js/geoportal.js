class GeoPortal {
    static round(number, precision) {
        let factor = Math.pow(10, precision);
        let tempNumber = number * factor;
        let roundedTempNumber = Math.round(tempNumber);
        return roundedTempNumber / factor;
    }
    constructor() {
        this.callSync(10);
        this.plugins = {};
        let dt = new Date()
        dt.setMinutes(0); dt.setSeconds(0); dt.setMilliseconds(0);
        this.tiempo = dt.getTime();
        this.listenersEdicion = [];
        this.cacheImagenes = {};
        this.helperCapas = {};
    }
    loadScripts() {
        return new Promise((resolve, reject) => {
            zPost("getRequiredClientScripts.plug", {})
                .then(scripts => {
                    this.loadNextScript(scripts, resolve, reject);
                })
                .catch(error => reject(error));
        });
    }
    loadNextScript(list, onReady, onError) {
        if (!list || !list.length) {
            onReady();
            return;
        }
        var script = document.createElement('script');
        script.onload = _ => {
            list.splice(0,1);
            this.loadNextScript(list, onReady, onError);
        };
        script.onerror = error => {
            console.error("Error reading '" + list[0] + "'", error);
        }
        script.src = list[0];
        document.head.appendChild(script);
    }

    get pluginsList() {
        return Object.keys(this.plugins).reduce((list, code) => {
            list.push(this.plugins[code]);
            return list;
        }, []);
    }
    registerPlugin(plugin) {
        this.plugins[plugin.codigo] = plugin;
    }
    registraHelperCapas(h) {this.helperCapas[h.codigo] = h}
    getHelperCapas(codigo) {return this.helperCapas[codigo]};

    async init() {
        await this.loadScripts();
        let list = this.pluginsList;
        for (let i=0; i<list.length; i++) {
            await list[i].init();
        }
    }
    callSync(delay) {
        if (!delay) delay = 60000;
        if (this.timerSync) clearTimeout(this.timerSync);
        this.timerSync = setTimeout(_ => {
            this.timerSync = null;
            this.doSync();
        }, delay);
    }
    getProveedor(codigo) {
        return this.proveedores.find(p => p.codigo == codigo);        
    }
    async doSync() {
        let config = await zPost("getConfig.ly");
        this.proveedores = config.proveedores;
        this.origenes = config.origenes;
        this.capasDisponibles = config.capas;
        Object.keys(this.capasDisponibles).forEach(codigo => {
            let defCapa = this.capasDisponibles[codigo];
            let prov = this.getProveedor(defCapa.codigoProveedor);
            defCapa.urlIcono = prov.url + "/" + defCapa.icono;
        });      
        this.grupos = config.grupos;
    }

    get listaCapasDisponibles() {
        let lista = Object.keys(this.capasDisponibles).reduce((lista, codigoCapa) => {
            lista.push(this.capasDisponibles[codigoCapa]);
            return lista;
        }, []);
        return lista;
    }

    getNivelAgregarGrupos(nivel, formato) {
        let items = [];
        nivel.forEach(grupo => {
            let nodo = {
                code:grupo.codigo, label:grupo.nombre, icon:grupo.icono, tipo:"grupo"
            };
            let subitems = [];
            if (grupo.subgrupos) {
                subitems = this.getNivelAgregarGrupos(grupo.subgrupos);
            }
            this.listaCapasDisponibles.forEach(capa => {
                let soportaFormato = !formato || capa.formatos[formato];
                if (soportaFormato && capa.grupos.includes(grupo.codigo)) {
                    subitems.push({code:capa.codigo, label:"[" + this.getOrigen(capa.origen).nombre + "] " + capa.nombre, icon:capa.urlIcono, tipo:"capa", capa:capa});
                }
            })
            if (subitems.length) {
                subitems.sort((i1, i2) => (i1.label < i2.label?-1:1));
                nodo.items = subitems;
                items.push(nodo);
            }
        });
        return items;
    }
    async getArbolAgregarAMapa(formato, dataObject, codigoDimension, capa, sinCodigoObjeto) {
        let grupos = this.getNivelAgregarGrupos(this.grupos, formato);
        let nodoDataObject = null;
        if (dataObject) {
            let variables = dataObject.variables.reduce((lista, v) => {
                if (!formato || v.formatos.indexOf(formato) >= 0) {
                    lista.push({code:dataObject.capa.codigo + "." + (sinCodigoObjeto?"${codigo-objeto}":dataObject.codigo) + "." + v.codigo, label:v.nombre, icon:v.icono, tipo:"capa", capa:dataObject.capa});
                }
                lista.sort((i1, i2) => (i1.label < i2.label?-1:1));
                return lista;
            }, []);
            if (variables.length) {
                nodoDataObject = {code:"dataObject", label:dataObject.nombre, icon:dataObject.getIcono(), tipo:"origen", items:variables}
            }
        } else if (capa && capa.tieneObjetos && capa.objetos && capa.objetos.length) {
            let variablesAgregadas = {}, variables = [];            
            capa.objetos.forEach(o => {
                if (o.variables) {
                    o.variables.forEach(v => {
                        if (!variablesAgregadas[v.codigo]) {
                            variables.push({code:capa.codigo + ".${codigo-objeto}." + v.codigo, label:v.nombre, icon:v.icono, tipo:"capa", capa:capa})
                            variablesAgregadas[v.codigo] = true;
                        }
                    })
                }
            });
            if (variables.length) {
                nodoDataObject = {code:"dataObject", label:capa.nombre, icon:capa.urlIcono, tipo:"origen", items:variables}
            }
        }
        let origenes = Object.keys(this.origenes).map(codigo => {
            let o = this.origenes[codigo];
            let nodo = {code:o.codigo, label:o.nombre, icon:o.icono, items:[], tipo:"origen"};
            this.listaCapasDisponibles.forEach(capa => {
                let soportaFormato = !formato || capa.formatos[formato];
                if (soportaFormato && capa.origen == o.codigo) {
                    nodo.items.push({code:capa.codigo, label:capa.nombre, icon:capa.urlIcono, tipo:"capa", capa:capa})
                }
            })   
            nodo.items.sort((i1, i2) => (i1.label < i2.label?-1:1));         
            return nodo;
        }).filter(nodo => (nodo.items.length > 0));
        let arbol = [];
        grupos.forEach(itemGrupo => {
            arbol.push(itemGrupo);
        })
        if (nodoDataObject) {
            arbol.push({code:"sep"});
            arbol.push(nodoDataObject);
        }
        arbol.push({code:"sep"});
        if (origenes.length) {
            arbol.push({
                code:"origen", icon:"img/iconos/satelite.svg", label:"Por Origen de la Información", items:origenes
            })
        }
        if (!formato) {
            arbol.push({code:"sep"});
            arbol.push({
                code:"espec", icon:"img/iconos/process.svg", label:"Capas Especiales", items:[
                    {code:"objetos-usuario", icon:"img/iconos/user-tools.svg", label:"Objetos de Usuario"}
                ]
            })
        }
        if (codigoDimension) {
            let nombreGrupo, tipoQuery;
            if (dataObject) {
                if (dataObject.getCodigoDimension()) {
                    let fila = await window.minz.getValorDimension(codigoDimension, dataObject.getCodigoDimension());
                    if (fila) {
                        nombreGrupo = fila.name;
                        tipoQuery = "period-summary";
                    }
                }
            } else {
                let dim = await window.minz.getDimension(codigoDimension);
                if (dim) {
                    nombreGrupo = dim.name;
                    tipoQuery = "dim-serie";
                }
            }
            if (nombreGrupo) {
                let itemsMinZ = await this.getSubArbolMinZ(codigoDimension);
                if (itemsMinZ && itemsMinZ.length) {                    
                    arbol.push({code:"sep"});                    
                    itemsMinZ.forEach(itemOrigen => {
                        itemOrigen.items.forEach(item => {
                            if (tipoQuery == "period-summary") {
                                item.item = {
                                    tipo:"queryMinZ",
                                    tipoQuery:tipoQuery,
                                    variable:item.item.variable,
                                    filtroFijo:{ruta:item.item.ruta, valor:(sinCodigoObjeto?"${codigo-objeto}":dataObject.getCodigoDimension())},
                                    temporalidad:item.item.variable.temporality,
                                    acumulador:"sum",
                                }
                            } else if (tipoQuery == "dim-serie") {
                                item.item = {
                                    tipo:"queryMinZ",
                                    tipoQuery:tipoQuery,
                                    variable:item.item.variable,
                                    temporalidad:item.item.variable.temporality,
                                    dimensionAgrupado:item.item.ruta,
                                    acumulador:"sum",
                                }
                            }
                        })
                    })
                    arbol.push({
                        code:"grupo", icon:"img/iconos/dashboard.svg", label:nombreGrupo, items:itemsMinZ
                    })                    
                }                
            }
        }
        return arbol;
    }

    async getSubArbolMinZ(codigoDimension) {
        try {
            // minz / origen => ruta hasta dimension
            let items = [];
            let rutas = await window.minz.getVariablesFiltrables(codigoDimension);
            // Separar por origen
            let origenes = {};
            rutas.forEach(r => {
                let code = r.variable.code;
                let p = code.indexOf(".");
                if (p < 0) throw "La variable '" + r.variable.code + "' no incluye codigo de origen";
                let codigoOrigen = r.variable.code.substr(0,p);
                if (!this.getOrigen(codigoOrigen)) throw "No se encontró el origen '" + codigoOrigen + "'";
                origenes[codigoOrigen] = this.getOrigen(codigoOrigen);
            });
            Object.keys(origenes).forEach(codigoOrigen => {
                let o = origenes[codigoOrigen];
                let itemOrigen = {code:o.codigo, label:o.nombre, icon:o.icono, items:[], tipo:"origen"};
                items.push(itemOrigen)
                rutas.forEach(r => {
                    let code = r.variable.code;
                    let p = code.indexOf(".");
                    if (r.variable.code.substr(0,p) == codigoOrigen) {
                        let itemIcon = "img/iconos/dashboard.svg";
                        if (r.variable.options && r.variable.options.icon) {
                            if (r.variable.options.icon.startsWith("${")) {
                                let p = r.variable.options.icon.indexOf("}");
                                let codProveedor = r.variable.options.icon.substr(2, p - 2);
                                let proveedor = this.getProveedor(codProveedor);
                                itemIcon = proveedor.url + "/" + r.variable.options.icon.substr(p+1);
                            } else {
                                itemIcon = r.variable.options.icon;
                            }
                        }
                        itemOrigen.items.push({tipo:"queryMinZ", code:r.variable.name + "->" + r.ruta, label:r.variable.name, icon:itemIcon, item:r})
                    }
                })
            });
            return items;
        } catch(error) {
            throw error;
        }
    }

    getCapasEstaciones() {
        let lista = this.listaCapasDisponibles.reduce((lista, capa) => {
            if (capa.menuEstaciones) {
                lista.push({code:capa.codigo, label:capa.nombre, icon:capa.urlIcono, tipo:"capa", capa:capa});
            }
            return lista;
        }, []);
        lista.sort((i1, i2) => (i1.label < i2.label?-1:1));         
        return lista;
    }

    showTooltip(x, y, contenido, xWhenLeft) {
        this.panelCentral.showTooltip(x, y, contenido, xWhenLeft);
    }
    hideTooltip() {
        this.panelCentral.hideTooltip();
    }
    getOrigen(codigo) {
        return this.origenes[codigo];
    }

    // Eventos
    movioMapa() {
        this.capas.movioMapa();
    }
    addListenerEdicion(listener) {
        this.listenersEdicion.push(listener);
    }
    removeListenerEdicion(listener) {
        let idx = this.listenersEdicion.indexOf(listener);
        if (idx >= 0) this.listenersEdicion.splice(idx,1);
    }
    editoObjeto(tipo, objeto) {
        if (objeto.objetos && objeto.objetos.length) {
            objeto.objetos.forEach(o => o.editoPadre());
        }
        this.listenersEdicion.forEach(l => l(tipo, objeto));
    }
    setTiempo(tiempo) {
        this.tiempo = tiempo;
        this.capas.getCapas().forEach(capa => capa.cambioTiempo())
        if (this.admAnalisis) this.admAnalisis.cambioTiempo();
    }

    // Edición de Objetos
    iniciaAgregarObjeto(code) {
        this.agregandoObjeto = code;
        this.panelTop.iniciaAgregarObjeto(code);
        this.mapa.setCursorAgregandoObjeto();
    }
    cancelaAgregarObjeto() {
        if (this.agregandoObjeto) {            
            this.agregandoObjeto = null;
            this.mapa.resetCursor();
            ObjetoGeoportal.cancelaAgregarObjeto();
            this.panelTop.cancelaAgregarObjeto();
            this.mapa.resetCursor();
            window.geoportal.mapa.konvaLayerAgregando.destroyChildren();
            window.geoportal.mapa.konvaLayerAgregando.draw();
        }
    }
    finalizaAgregarObjeto(objeto) {
        this.agregandoObjeto = null;
        this.mapa.resetCursor();
        this.panelTop.agregoObjeto(objeto);
        this.mapa.callDibujaObjetos(100);
    }
    async objetoSeleccionado(objeto) {
        this.capas.getGrupoActivo().itemActivo = objeto;
        if (window.capasController) await window.capasController.refresca();
        await this.admAnalisis.ajustaPanelAnalisis();
    }
    async objetoMovido(objeto) {
        //await objeto.movio();
        if (this.admAnalisis) await this.admAnalisis.movioObjeto(objeto);
    }

    // Interacciones
    mapClick(puntoMapa, puntoCanvas) {
        if (this.agregandoObjeto) {
            ObjetoGeoportal.handleMouseClick(puntoMapa, puntoCanvas);
        }
    }
    mapMouseMove(puntoMapa, puntoCanvas) {
        if (this.agregandoObjeto) {
            ObjetoGeoportal.handleMouseMove(puntoMapa, puntoCanvas);
        }
    }

    // Utiles
    formateaValor(codigoCapa, valor) {
        if (valor === undefined) return "Sin Datos";
        let capa = this.capasDisponibles[codigoCapa];
        if (!capa) throw "No se encontró la capa '" + codigoCapa + "'";
        let decimales = capa.decimales;
        return GeoPortal.round(valor, decimales).toLocaleString();
    }
    formateaValorVariable(variable, valor) {
        if (valor === undefined) return "Sin Datos";
        let decimales = variable.decimales;
        return GeoPortal.round(valor, decimales).toLocaleString();
    }
    getImagen(url, w, h, onload) {
        let key = url + "-" + w + h;
        if (this.cacheImagenes[key]) return this.cacheImagenes[key];
        let htmlImg = new Image(w, h);
        htmlImg.crossOrigin = "Anonymous";
        htmlImg.src = url;
        htmlImg.onload = _ => onload(htmlImg);
        this.cacheImagenes[key] = htmlImg;
    }
    getVariable(codigo) {
        // Si la capa es raster, la variable es la capa
        // Si es dataObjects, se busca el objeto y su variable
        let codProveedor, codCapa, codObjeto, codVariable;
        let p0 = codigo.indexOf(".");
        if (p0 < 0) throw "Código de Variable Inválido: '" + codigo + "'. Se esperaba codProveedor.codCapa[.codDataObject.codVariable]";
        codProveedor = codigo.substr(0,p0);
        let p1 = codigo.indexOf(".", p0+1);
        if (p1 < 0) {
            codCapa = codigo.substr(p0+1);
        } else {
            codCapa = codigo.substring(p0+1, p1);
            let p2 = codigo.indexOf(".", p1+1);
            if (p2 < 0) throw "Código de Variable Inválido: '" + codigo + "'. Se esperaba codProveedor.codCapa[.codDataObject.codVariable]";
            codObjeto = codigo.substring(p1+1, p2);
            codVariable = codigo.substr(p2+1);
        }
        let capa = this.capasDisponibles[codProveedor + "." + codCapa];
        if (!capa) {
            // Intentar buscando por id
            capa = window.geoportal.capas.getGrupoActivo().findCapa(codCapa);
            if (capa) codCapa = capa.codigo;
            else throw "No se encontró la capa '" + codCapa + "'";
        }
        if (capa.tipo == "raster") return capa;
        let objeto;
        if (codObjeto == "${codigo-objeto}") {
            // Buscar primero que declare la variable
            objeto = capa.objetos.find(o => o.variables && o.variables.find(v => v.codigo == codVariable));
        } else {
            objeto = capa.objetos.find(o => o.codigo == codObjeto || o.id == codObjeto);
        }
        if (!objeto) throw "No se encontró el objeto '" + codObjeto + "' en la capa";        
        let v = objeto.variables.find(v => v.codigo == codVariable);
        if (!v) throw "No se encontró la variable '" + codVariable + "' en el objeto '" + objeto.codigo + "'";
        let proveedor = this.getProveedor(codProveedor);
        v.urlIcono = proveedor.url + "/" + v.icono;
        v.origen = capa.origen;
        if (!v.niveles) v.niveles = [{descripcion:"inicial"}];
        if (v.nivelInicial === undefined) v.nivelInicial = 0;
        return v;
    }
    getInfoVarParaConsulta(codigo, objeto) {
        // Raster: codigoProveedor.codigoCapa
        // DataObject: codigoProveedor.codigoCapa.codigoObjeto.codigoVariable
        let p0 = codigo.indexOf(".");
        if (p0 < 0) throw "Código de Variable '" + codigo + "' Inválido";
        let p1 = codigo.indexOf(".", p0+1);
        if (p1 < 0) {
            return {
                capaQuery:new Capa(window.geoportal.capasDisponibles[codigo]),
                codigoVariable:codigo.substr(p0+1),
                variable:this.getVariable(codigo)
            }
        }
        let codigoVariable = codigo.substr(p0+1);
        p0 = codigoVariable.indexOf("${codigo-objeto}");
        if (p0 >= 0) {
            codigoVariable = codigoVariable.substr(0,p0) + objeto.codigo + codigoVariable.substr(p0+16);
        }
        return {
            capaQuery:objeto.capa,
            codigoVariable:codigoVariable,
            variable:this.getVariable(codigo)
        }
    }
}

window.geoportal = new GeoPortal();