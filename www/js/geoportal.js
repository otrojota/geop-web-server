class GeoPortal {
    constructor() {
        this.callSync(10);
        this.plugins = {};
        let dt = new Date()
        dt.setHours(0); dt.setMinutes(0); dt.setSeconds(0); dt.setMilliseconds(0);
        this.tiempo = dt.getTime();
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

    getNivelAgregarGrupos(nivel) {
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
                if (capa.grupos.includes(grupo.codigo)) {
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
    getArbolAgregarAMapa() {        
        let grupos = this.getNivelAgregarGrupos(this.grupos);
        let origenes = Object.keys(this.origenes).map(codigo => {
            let o = this.origenes[codigo];
            let nodo = {code:o.codigo, label:o.nombre, icon:o.icono, items:[], tipo:"origen"};
            this.listaCapasDisponibles.forEach(capa => {
                if (capa.origen == o.codigo) {
                    nodo.items.push({code:capa.codigo, label:capa.nombre, icon:capa.urlIcono, tipo:"capa", capa:capa})
                }
            })            
            return nodo;
        }).filter(nodo => (nodo.items.length > 0));
        let arbol = [];
        if (grupos.length) {
            arbol.push({
                code:"grupo", icon:"fas fa-folder fa-lg", label:"Buscar por Grupo", items:grupos
            })
        }
        if (origenes.length) {
            arbol.push({
                code:"origen", icon:"img/iconos/satelite.svg", label:"Por Origen de la Información", items:origenes
            })
        }
        return arbol;
    }

    // Eventos
    movioMapa() {
        this.capas.movioMapa();
    }
}

window.geoportal = new GeoPortal();