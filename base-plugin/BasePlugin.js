class BasePlugin extends global.PluginGeoPortal {
    constructor() {
        super("base");
    }
    getClientScripts() {
        return [
            "js/base-plugin.js",
            "js/visualizador-isolineas.js",
            "js/visualizador-isobandas.js"
        ]
    }
}

module.exports = BasePlugin;