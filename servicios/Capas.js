const ZModule = require("./z-server").ZModule;
const config = require("./Config").getConfig();
const request = require("request");

class Capas extends ZModule {
    static get instance() {
        if (Capas._singleton) return Capas._singleton;
        Capas._singleton = new Capas();
        return Capas._singleton;
    }

    init() {
        this.callSync(100);
    }
    callSync(delay) {
        if (!delay) delay = 30000;
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(_ => {
            this.timer = null;
            this.doSync()
        }, delay);
    }
    get(url) {
        return new Promise((resolve, reject) => {
            request(url, {method:"GET"}, (err, res, body) => {
                if (err) reject(err);
                else resolve(JSON.parse(body));
            })
        })
    }
    async doSync() {
        try {
            let origenes = {};
            let capas = {};
            let proveedores = config.proveedores;
            for (let i=0; i<proveedores.length; i++) {
                let proveedor = proveedores[i];
                let pOrigenes = await this.get(proveedor.url + "/origenes");
                pOrigenes.forEach(o => {
                    origenes[o.codigo] = {codigo:o.codigo, nombre:o.nombre, url:o.url};
                    let icono = o.icono;
                    if (icono.startsWith(".")) icono = proveedor.url + "/" + icono.substr(2);
                    origenes[o.codigo].icono = icono;
                });
                let pCapas = await this.get(proveedor.url + "/capas");
                pCapas.forEach(c => {
                    c.codigoProveedor = proveedor.codigo;
                    capas[proveedor.codigo + "." + c.codigo] = c;
                });
            }
            this.proveedores = proveedores;
            this.origenes = origenes;
                this.capas = capas;
        } catch(error) {
            console.error(error);
        } finally {
            this.callSync();
        }
    }

    getConfig() {
        return {
            proveedores:this.proveedores,
            origenes:this.origenes,
            capas:this.capas,
            grupos:config.grupos
        }
    }
}

module.exports = Capas.instance;