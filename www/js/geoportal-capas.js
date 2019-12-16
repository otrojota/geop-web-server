class Capa {
    constructor(spec) {
        this.spec = spec;
        this.nivel = spec.nivelInicial?spec.nivelInicial:0;
        this.visualizadoresActivos = {};
        this.preconsulta = null;
    }
    get codigo() {return this.spec.codigo}
    get codigoProveedor() {return this.spec.codigoProveedor}
    get formatos() {return this.spec.formatos}
    get niveles() {return this.spec.niveles}
    get nivelInicial() {return this.spec.nivelInicial}
    get nombre() {return this.spec.nombre}
    get origen() {return this.spec.origen}
    get grupos() {return this.spec.grupos}
    get temporal() {return this.spec.temporal}
    get tipo() {return this.spec.tipo}
    get unidad() {return this.spec.unidad}
    get icono() {return this.spec.icono}
    get urlIcono() {return this.spec.urlIcono}

    getVisualizadoresAplicables() {
        let ret = [];
        window.geoportal.capas.clasesVisualizadores.forEach(c => {
            if (c.clase.aplicaACapa(this)) ret.push(c);
        })
        return ret;
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
        this.preconsulta = null;
        this.listenersPreconsulta = null;
        this.preConsultando = false;
        this.listaVisualizadoresActivos.forEach(visualizador => visualizador.refresca());
    }
    getPreConsulta(callback) { // (err, preconsulta)
        if (this.preConsulta) {
            callback(this.preConsulta);
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
        fetch(prov.url + "/preconsulta?capa=" + this.codigo + "&lng0=" + b.lng0 + "&lat0=" + b.lat0 + "&lng1=" + b.lng1 + "&lat1=" + b.lat1 + "&tiempo=" + window.geoportal.tiempo + "&nivel=" + this.nivel)
            .then(res => {
                if (res.status != 200) {
                    this.listenersPreconsulta.forEach(cb => cb(res.statusText));    
                    return;
                }
                res.json()
                    .then(ret => {
                        if (!this.listenersPreconsulta) {
                            this.listenersPreconsulta.forEach(cb => cb("cancelado"));    
                        } else {
                            this.preconsulta = ret;
                            this.listenersPreconsulta.forEach(cb => cb(null, this.preconsulta));
                        }
                    })
            })
            .catch(err => {
                this.listenersPreconsulta.forEach(cb => cb(err));    
            })
            .finally(_ => this.preConsultando = false);
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

class Capas {
    constructor() {
        this.capas = [];
        this.clasesVisualizadores = [];
        this.listener = null;
    }
    setListener(listener) {
        this.listener = listener;
    }
    add(spec) {
        let capa = new Capa(spec);
        this.capas.push(capa);
        if (this.listener) this.listener.onCapaAgregada(capa);
        return capa;
    }
    remove(idx) {
        let capa = this.capas[idx];
        this.capas.splice(idx,1);
        if (this.listener) this.listener.onCapaRemovida(capa);
    }
    registraVisualizador(codigoPlugin, codigo, claseVisualizador, nombre, icono) {
        this.clasesVisualizadores.push({codigoPlugin:codigoPlugin, codigo:codigo, clase:claseVisualizador, nombre:nombre, icono:icono})
    }
    movioMapa() {
        this.capas.forEach(capa => capa.invalida());
    }
}

window.geoportal.capas = new Capas();