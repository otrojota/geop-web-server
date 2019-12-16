class PluginBaseGeoPortal extends PluginClienteGeoPortal {
    constructor() {
        super("base");
    }
    async init() {   
        console.log("[GEOPortal][base] Inicializando Plugin base");     
    }
}
window.geoportal.registerPlugin(new PluginBaseGeoPortal());