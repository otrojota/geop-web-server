function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

class Capa {
    constructor(config) {
        this.id = uuidv4();
        this.config = JSON.parse(JSON.stringify(config));
        this.nivel = this.config.nivelInicial?config.nivelInicial:0;
        if (this.config.opacidad === undefined) this.config.opacidad = 80;
        this.visualizadoresActivos = {};
        this.preConsultando = false;
        this.consultando = false;
        this.listenersPreconsulta = null;
        this.listenersConsulta = null;
        this.preconsulta = null;
        this.resultadoConsulta = null;
        this.idBasePanel = window.geoportal.mapa.creaIdPanelesCapa();
        this.panelesMapa = [];
        this.nextIdConsulta = 1;
        this.tiempoFijo = null;
        this.configPanel = {
            flotante:false,
            height:180, width:300,
            configSubPaneles:{}
        }
        this.workingListeners = []; // {accion:"start"|"finish"|"refrescar", listener:function}
        this.objetos = null;
        this.invalida(); // iniciar
    }
    get codigo() {return this.config.codigo}
    get codigoProveedor() {return this.config.codigoProveedor}
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

    addWorkingListener(accion, listener) {
        this.workingListeners.push({accion:accion, listener:listener});
    }
    removeWorkingListener(listener) {
        let idx = this.workingListeners.findIndex(l => l.listener == listener);
        if (idx >= 0) this.workingListeners.splice(idx,1);
    }
    startWorking() {this.workingListeners.filter(l => l.accion == "start").forEach(l => l.listener())}
    finishWorking() {this.workingListeners.filter(l => l.accion == "finish").forEach(l => l.listener())}
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
    crea() {
        this.listaVisualizadoresActivos.forEach(v => v.crea());
    }
    destruye() {
        this.listaVisualizadoresActivos.forEach(v => v.destruye());
    }
    getVisualizador(codigo) {return this.visualizadoresActivos[codigo]}
    getItems() {
        let items = [];
        let vis = this.getVisualizadoresAplicables();
        vis.forEach(v => {
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
        });
        if (this.objetos) {
            this.objetos.forEach(o => {
                items.push({
                    tipo:"objeto",
                    codigo:o.id,
                    nombre:o.nombre,
                    icono:o.getIcono(),
                    urlIcono:o.getIcono(),
                    activable:false,
                    eliminable:true,
                    item:o,
                    capa:this
                })
            })
        }
        return items;
    }
    async activaVisualizador(v) {
        let clase = window.geoportal.capas.clasesVisualizadores.find(vis => vis.codigo == v.codigo).clase;
        this.visualizadoresActivos[v.codigo] = new (clase)(this, {});
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

    invalida() {        
        if (this.preConsultando && this.listenersPreconsulta) {
            this.listenersPreconsulta.forEach(cb => cb("preconsulta cancelada"));
        }
        if (this.listenersConsulta) {
            this.listenersConsulta.forEach(cb => cb("consulta cancelada"));
        }
        this.preconsulta = null;
        this.listenersPreconsulta = null;
        this.listenersConsulta = [];
        this.preConsultando = false;
        this.nextIdConsulta++;
        this.listaVisualizadoresActivos.forEach(visualizador => visualizador.refresca());
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
                res.json()
                    .then(ret => {
                        this.preconsulta = ret;
                        if (this.listenersPreconsulta) {
                            this.listenersPreconsulta.forEach(cb => cb(null, this.preconsulta));
                        }
                    })
            })
            .catch(err => {
                console.error("Error en preconsulta");
                console.error(error);
                this.listenersPreconsulta.forEach(cb => cb(err));    
            })
            .finally(_ => {
                this.preConsultando = false;
                this.finishWorking();
            });
    }

    resuelveConsulta(formato, args, callback) {
        this.startWorking();
        this.listenersConsulta.push(callback);
        let prov = window.geoportal.proveedores.find(p => p.codigo == this.codigoProveedor); 
        let idConsulta = this.nextIdConsulta;       
        fetch(prov.url + "/consulta", {
            method:"POST", 
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify({formato:formato, args:args})
        })
        .then(res => {
            if (idConsulta != this.nextIdConsulta) return;
            res.json().then(j => {
                callback(null, j);
            }).catch(err => {
                callback(err);
            });
        })
        .catch(err => {
            callback(err);
        })
        .finally(_ => {
            let idx = this.listenersConsulta.indexOf(callback);
            if (idx >= 0) this.listenersConsulta.splice(idx,1);
            this.finishWorking();
        })
    }

    async refresca() {
        let proms = this.listaVisualizadoresActivos.reduce((lista, v) => {
            lista.push(v.refresca());
            return lista;
        }, []);
        await Promise.all(proms);
    }

    async addObjetoUsuario(o) {
        if (!this.objetos) this.objetos = [];
        o.capa = this;
        this.objetos.push(o);
        await this.triggerRefrescar();
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
        return paneles;
    }

    getTituloPanel() {
        return this.nombre;
    }

    cambioOpacidad() {
        this.listaVisualizadoresActivos.forEach(v => v.cambioOpacidadCapa(this.opacidad));
        if (this.esObjetosUsuario) window.geoportal.mapa.dibujaObjetos();
    }
    cambioTiempo() {
        if (!this.temporal || this.tiempoFijo) return;
        this.refresca();
    }
    cambioNivel() {
        this.refresca();
    }
}

class VisualizadorCapa {
    constructor(codigo, capa, config) {
        this.id = uuidv4();
        this.codigo = codigo;
        this.capa = capa;
        this.config = config;   
        this.workingListeners = []; // {accion:"start"|"finish", listener:function}     
    }
    static aplicaACapa(capa) {return false;}
    async crea() {}
    async destruye() {}
    async refresca() {}
    addWorkingListener(accion, listener) {
        this.workingListeners.push({accion:accion, listener:listener});
    }
    removeWorkingListener(listener) {
        let idx = this.workingListeners.findIndex(l => l.listener == listener);
        if (idx >= 0) this.workingListeners.splice(idx,1);
    }
    startWorking() {this.workingListeners.filter(l => l.accion == "start").forEach(l => l.listener())}
    finishWorking() {this.workingListeners.filter(l => l.accion == "finish").forEach(l => l.listener())}
    cambioOpacidadCapa(opacidad) {
        console.log("cambioOpacidad no se sobreescribió");
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
            height:120, width:300,
            configSubPaneles:{}
        }
        this.panelesFlotantes = [];
    }
    addCapa(capa) {this.capas.push(capa)}
    removeCapa(idx) {
        let capa = this.capas[idx];
        if (capa.id == this.itemActivo.id) this.itemActivo = this;
        let necesitaDibujar = capa.esObjetosUsuario;
        capa.destruye();
        this.capas.splice(idx,1)
        if (necesitaDibujar) window.geoportal.mapa.dibujaObjetos();
    }
    getCapa(idx) {return this.capas[idx]}
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
        let capa = new Capa(config);
        capa.abierto = true;
        this.getGrupoActivo().addCapa(capa);
        this.getGrupoActivo().itemActivo = capa;
        if (this.listener) this.listener.onCapaAgregada(capa);
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
        this.getCapas().forEach(capa => capa.invalida());
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

    getAnalizadoresAplicables(objeto) {
        if (!(objeto instanceof ObjetoGeoportal)) return [];
        return this.clasesAnalizadores.reduce((lista, a) => {
            if (a.clase.aplicaAObjeto(objeto)) lista.push(a);
            return lista;
        }, []);
    }
}

window.geoportal.capas = new Capas();