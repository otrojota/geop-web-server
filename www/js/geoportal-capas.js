class Capa {
    constructor(config) {
        this.config = config;
        this.nivel = config.nivelInicial?config.nivelInicial:0;
        if (config.opacidad === undefined) config.opacidad = 80;
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
        this.invalida(); // iniciar
    }
    get codigo() {return this.config.codigo}
    get codigoProveedor() {return this.config.codigoProveedor}
    get formatos() {return this.config.formatos}
    get niveles() {return this.config.niveles}
    get nivelInicial() {return this.config.nivelInicial}
    get nombre() {return this.config.nombre}
    get origen() {return this.config.origen}
    get grupos() {return this.config.grupos}
    get temporal() {return this.config.temporal}
    get tipo() {return this.config.tipo}
    get unidad() {return this.config.unidad}
    get icono() {return this.config.icono}
    get urlIcono() {return this.config.urlIcono}
    get opacidad() {return this.config.opacidad}

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
                capa:this
            })
        });
        return items;
    }
    async activaVisualizador(v) {
        let clase = window.geoportal.capas.clasesVisualizadores.find(vis => vis.codigo == v.codigo).clase;
        this.visualizadoresActivos[v.codigo] = new (clase)(this, {});
        await this.visualizadoresActivos[v.codigo].crea();
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
        this.preConsultando = true;
        this.listenersPreconsulta = [callback];
        let prov = window.geoportal.proveedores.find(p => p.codigo == this.codigoProveedor);
        let b = window.geoportal.mapa.getLimites();
        let idConsulta = this.nextIdConsulta;
        fetch(prov.url + "/preconsulta?capa=" + this.codigo + "&lng0=" + b.lng0 + "&lat0=" + b.lat0 + "&lng1=" + b.lng1 + "&lat1=" + b.lat1 + "&tiempo=" + window.geoportal.tiempo + "&nivel=" + this.nivel)
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
            .finally(_ => this.preConsultando = false);
    }

    resuelveConsulta(formato, args, callback) {
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
        })
    }

    async refresca() {
        let proms = this.listaVisualizadoresActivos.reduce((lista, v) => {
            lista.push(v.refresca());
            return lista;
        }, []);
        await Promise.all(proms);
    }
}

class VisualizadorCapa {
    constructor(codigo, capa, config) {
        this.codigo = codigo;
        this.capa = capa;
        this.config = config;
    }
    static aplicaACapa(capa) {return false;}
    async crea() {}
    async destruye() {}
    async refresca() {}
}

class GrupoCapas {
    constructor(nombre, activo) {
        this.nombre = nombre;
        this.capas = [];
        this.activo = activo?true:false;
        this.abierto = true;
    }
    addCapa(capa) {this.capas.push(capa)}
    removeCapa(idx) {
        this.capas[idx].destruye();
        this.capas.splice(idx,1)
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
    }
    async desactiva() {
        let proms = this.capas.reduce((lista, capa) => {
            lista.push(capa.destruye());
            return lista;
        }, []);
        await Promise.all(proms);
        this.activo = false
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
                items:capa.getItems()
            })
        }
        return lista;
    }
}

class Capas {
    constructor() {
        this.clasesVisualizadores = [];
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
        if (this.listener) this.listener.onCapaAgregada(capa);
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
}

window.geoportal.capas = new Capas();