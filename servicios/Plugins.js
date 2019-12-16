const ZModule = require("./z-server").ZModule;
const config = require("./Config").getConfig();

class PluginGeoPortal {
    constructor(codigo) {
        this.codigo = codigo;
        this._basePath = null;
    }
    get basePath() {return this._basePath}
    
    async init() {}
    getClientScripts() {
        return [];
    }
}
class Plugins extends ZModule {
    static get instance() {
        if (Plugins._singleton) return Plugins._singleton;
        Plugins._singleton = new Plugins();
        return Plugins._singleton;
    }
    async init() {
        try {
            this.plugins = {};
            let loadedPlugins = [];
            for (let i=0; i<config.plugins.length; i++) {
                let path = config.plugins[i];
                if (path.startsWith("./")) {
                    path = __dirname + "/.." + path.substr(1);
                }
                try {
                    console.log("[GEOPortal] Cargando Plugin en '" + path + "'");
                    let pluginClass = require(path);
                    let pluginObject = new (pluginClass)();
                    pluginObject._basePath = require("path").dirname(require.resolve(path));
                    this.plugins[pluginObject.codigo] = pluginObject;
                    await pluginObject.init();
                    loadedPlugins.push(pluginObject);
                } catch(error) {
                    console.error(error);
                }
            }
            return loadedPlugins;
        } catch(error) {
            console.error(error);
            throw error;
        }
    }

    getRequiredClientScripts() {
        let files = [];
        Object.keys(this.plugins).forEach(code => {
            let p = this.plugins[code];
            p.getClientScripts().forEach(f => files.push(p.codigo + "/" + f));            
        })
        return files;
    }
}

global.PluginGeoPortal = PluginGeoPortal;
module.exports = Plugins.instance;