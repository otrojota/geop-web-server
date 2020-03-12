class PluginClienteGeoPortal {
    constructor(codigo) {
        this.codigo = codigo;
    }
    async init() {}
}

class HelperCapasCliente {
    constructor(codigo) {
        this.codigo = codigo;
        window.geoportal.registraHelperCapas(this);
    }
    creaCapa(config) {
        throw "No se sobreescribió creaCapa en " + this;
    }
    destruyeCapa(capa) {
        throw "No se sobreescribió destruyeCapa en " + this;
    }
    getTilesUrl(capa) {
        throw "No se sobreescribió getTilesUrl en " + this;
    }
}