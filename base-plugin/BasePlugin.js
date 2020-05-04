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
            "js/visualizador-tiles.js",
            "js/analizador-serie-tiempo.js",
            "js/echarts.min.js",
            "js/echarts-gl.min.js",
            "js/analizador-rect-area-3d.js",
            "js/visualizador-shader.js"
        ]
    }
}

module.exports = BasePlugin;