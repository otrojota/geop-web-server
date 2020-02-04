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
        dt.setHours(0); dt.setMinutes(0); dt.setSeconds(0); dt.setMilliseconds(0);
        this.tiempo = dt.getTime();
        this.listenersEdicion = [];
        this.cacheImagenes = {};
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
    async doSync() {
        let config = await zPost("getConfig.ly");
        this.proveedores = config.proveedores;
        this.origenes = config.origenes;
        this.capasDisponibles = config.capas;
        Object.keys(this.capasDisponibles).forEach(codigo => {
            let defCapa = this.capasDisponibles[codigo];
            let prov = this.proveedores.find(p => p.codigo == defCapa.codigoProveedor);
            defCapa.urlIcono = prov.url + "/" + defCapa.icono;
        });      
        this.grupos = config.grupos;        
    }

    get listaCapasDisponibles() {
        return Object.keys(this.capasDisponibles).reduce((lista, codigoCapa) => {
            lista.push(this.capasDisponibles[codigoCapa]);
            return lista;
        }, []);
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
                    subitems.push({code:capa.codigo, label:capa.nombre, icon:capa.urlIcono, tipo:"capa", capa:capa});
                }
            })
            if (subitems.length) {
                nodo.items = subitems;
                items.push(nodo);
            }
        });
        return items;
    }
    getArbolAgregarAMapa(formato) {        
        let grupos = this.getNivelAgregarGrupos(this.grupos);
        let origenes = Object.keys(this.origenes).map(codigo => {
            let o = this.origenes[codigo];
            let nodo = {code:o.codigo, label:o.nombre, icon:o.icono, items:[], tipo:"origen"};
            this.listaCapasDisponibles.forEach(capa => {
                let soportaFormato = !formato || capa.formatos[formato];
                if (soportaFormato && capa.origen == o.codigo) {
                    nodo.items.push({code:capa.codigo, label:capa.nombre, icon:capa.urlIcono, tipo:"capa", capa:capa})
                }
            })            
            return nodo;
        }).filter(nodo => (nodo.items.length > 0));
        let arbol = [];
        grupos.forEach(itemGrupo => {
            arbol.push(itemGrupo);
        })
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
        return arbol;
    }

    showTooltip(x, y, contenido) {
        this.panelCentral.showTooltip(x, y, contenido);
    }
    hideTooltip() {
        this.panelCentral.hideTooltip();
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
        }
    }
    finalizaAgregarObjeto(objeto) {
        this.agregandoObjeto = null;
        this.mapa.resetCursor();
        this.panelTop.agregoObjeto(objeto);
        this.mapa.callDibujaObjetos(100);
    }
    async objetoSeleccionado(objeto) {
        console.log("geoportal objeto seleccionado", objeto);
        this.capas.getGrupoActivo().itemActivo = objeto;
        if (window.capasController) await window.capasController.refresca();
        await this.admAnalisis.ajustaPanelAnalisis();
    }
    async objetoMovido(objeto) {
        await objeto.movio();
        if (this.admAnalisis) await this.admAnalisis.movioObjeto(objeto);
    }

    // Interacciones
    mapClick(puntoMapa, puntoCanvas) {
        console.log("click", puntoMapa, puntoCanvas);
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
    getImagen(url, w, h, onload) {
        let key = url + "-" + w + h;
        if (this.cacheImagenes[key]) return this.cacheImagenes[key];
        let htmlImg = new Image(w, h);
        htmlImg.crossOrigin = "Anonymous";
        htmlImg.src = url;
        htmlImg.onload = _ => onload(htmlImg);
        this.cacheImagenes[key] = htmlImg;
    }
}

window.geoportal = new GeoPortal();