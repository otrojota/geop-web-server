class MensajesGeoportal {
    static informaCambios(originador) {
        if (!MensajesGeoportal.itemsCambiados) MensajesGeoportal.itemsCambiados = {};
        MensajesGeoportal.itemsCambiados[originador.item.id] = true;
        if (MensajesGeoportal.timerInforma) {
            clearTimeout(MensajesGeoportal.timerInforma);
        }
        MensajesGeoportal.timerInforma = setTimeout(_ => {
            MensajesGeoportal.timerInforma = null;
            let listaIdsCambiados = Object.keys(MensajesGeoportal.itemsCambiados);
            if (window.capasController) window.capasController.cambiosMensajes(listaIdsCambiados);
            if (window.geoportal.admAnalisis) {
                listaIdsCambiados.forEach(id => window.geoportal.admAnalisis.cambioMensajesItem(id));
            }
            MensajesGeoportal.itemsCambiados = {};
        }, 300);
    }
    constructor(item, codigoOrigen) {
        this.item = item;
        this.codigoOrigenBase = codigoOrigen;
        this.mensajes = [];
        this.origenes = [];
    }

    get nPropiedades() {return this.mensajes.filter(m => m.tipo == "propiedad").length}
    get nMensajes() {return this.mensajes.filter(m => m.tipo == "informacion" || m.tipo == "advertencia" || m.tipo == "error").length}
    get nInfos() {return this.mensajes.filter(m => m.tipo == "informacion").length}
    get nAdvertencias() {return this.mensajes.filter(m => m.tipo == "advertencia").length}
    get nErrores() {return this.mensajes.filter(m => m.tipo == "error").length}
    get nOrigenes() {return (this.codigoOrigenBase?1:0) + this.origenes.length}
    get tieneOrigen() {return this.nOrigenes?true:false}
    get tieneDatos() {
        return this.tieneOrigen || (this.nPropiedades?true:false) || (this.nMensajes?true:false);
    }
    get listaMensajes() {
        return []
            .concat(this.mensajes.filter(m => m.tipo == "error"))
            .concat(this.mensajes.filter(m => m.tipo == "advertencia"))
            .concat(this.mensajes.filter(m => m.tipo == "informacion"));
    }
    get listaOrigenes() {
        return (this.codigoOrigenBase?[this.codigoOrigenBase]:[]).concat(this.origenes);
    }
    get listaPropiedades() {
        return []
            .concat(this.mensajes.filter(m => m.tipo == "propiedad"));
    }

    clear() {
        this.mensajes = [];
        this.origenes = [];
        MensajesGeoportal.informaCambios(this);
    }

    parse(res, prefijo) {
        if (!res) return;
        if (res.errores) res.errores.forEach(msg => this.addError((prefijo?prefijo + ": ":"") + msg));
        if (res.advertencias) res.advertencias.forEach(msg => this.addAdvertencia((prefijo?prefijo + ": ":"") + msg));
        if (res.mensajes) res.mensajes.forEach(msg => this.addInformacion((prefijo?prefijo + ": ":"") + msg));
        if (res.atributos) Object.keys(res.atributos).forEach(nombre => this.addPropiedad((prefijo?prefijo + ": ":"") + nombre, res.atributos[nombre]));        
    }

    setOrigenBase(codigoOrigen) {
        this.codigoOrigenBase = codigoOrigen;
        MensajesGeoportal.informaCambios(this);
    }
    addOrigen(codigo) {
        if (this.listaOrigenes.indexOf(codigo) >= 0) return;
        this.origenes.push(codigo);
        MensajesGeoportal.informaCambios(this);
    }
    addPropiedad(propiedad, valor) {
        this.mensajes.push({tipo:"propiedad", nombre:propiedad, valor:valor});
        MensajesGeoportal.informaCambios(this);
    }
    addInformacion(mensaje) {
        this.mensajes.push({tipo:"informacion", texto:mensaje});
        MensajesGeoportal.informaCambios(this);
    }
    addAdvertencia(mensaje) {
        this.mensajes.push({tipo:"advertencia", texto:mensaje});
        MensajesGeoportal.informaCambios(this);
    }
    addError(mensaje) {
        this.mensajes.push({tipo:"error", texto:mensaje});
        MensajesGeoportal.informaCambios(this);
    }
}