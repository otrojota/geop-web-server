class BasePlugin extends global.PluginGeoPortal {
    constructor() {
        super("base");
    }
    getClientScripts() {
        return [
            "js/wind-gl.js",
            "js/base-plugin.js",
            "js/visualizador-isolineas.js",
            "js/visualizador-isobandas.js",
            "js/visualizador-vectores.js",
            "js/visualizador-particulas.js",
            "js/analizador-serie-tiempo.js"
        ]
    }
}

module.exports = BasePlugin;