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
        this.visualizadoresActivos.forEach(v => v.crea());
    }
    destruye() {
        this.visualizadoresActivos.forEach(v => v.destruye());
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
                seleccionable:true,
                seleccionado:this.visualizadoresActivos[v.codigo]?true:false,
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
        if (this.consultando && this.listenersConsulta) {
            this.listenersConsulta.forEach(cb => cb("consulta cancelada"));
        }
        this.preconsulta = null;
        this.resultadoConsulta = null;
        this.listenersPreconsulta = null;
        this.listenersPreconsulta = null;
        this.preConsultando = false;
        this.consultando = false;
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
        this.nextIdConsulta++;
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
        if (this.resultadoConsulta) {
            callback(null, this.resultadoConsulta);
            return;
        }
        if (this.consultando) {
            this.listenersConsulta.push(callback);
            return;
        }
        this.consultando = true;
        this.listenersConsulta = [callback];
        let prov = window.geoportal.proveedores.find(p => p.codigo == this.codigoProveedor); 
        this.nextIdConsulta++;
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
                this.resultadoConsulta = j;
                this.listenersConsulta.forEach(cb => cb(null, j));                
            }).catch(err => {
                this.listenersConsulta.forEach(cb => cb(err));
            });
        })
        .catch(err => {
            this.listenersConsulta.forEach(cb => cb(err));
        })
        .finally(_ => this.consultando = false)

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
    }
    addCapa(capa) {this.capas.push(capa)}
    removeCapa(index) {this.capas.splice(index,1)}
    getCapa(idx) {return this.capas[idx]}
    activa() {
        this.activo = true
        this.capas.forEach(capa => capa.crea());
    }
    desactiva() {
        this.capas.forEach(capa => capa.destruye())
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
                indice:i,
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
    activaGrupo(idx) {        
        this.getGrupoActivo().desactiva();
        this.grupos[idx].activa();
    }
    getGrupo(idx) {return this.grupos[idx]}
    addGrupo(grupo) {this.grupos.push(grupo)}
    removeGrupo(idx) {this.grupos.splice(idx, 1)}
}

window.geoportal.capas = new Capas();