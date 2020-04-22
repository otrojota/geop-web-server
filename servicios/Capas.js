const ZModule = require("./z-server").ZModule;
const config = require("./Config").getConfig();
const request = require("request");
const plugins = require("./Plugins");

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
                else {
                    try {
                        resolve(JSON.parse(body));
                    } catch(error) {
                        console.error("Error parseando respuesta desde " + url, error);
                        console.error("Respuesta", body);
                        reject(err);
                    }
                }
            })
        })
    }
    async doSync() {
        try {
            let origenes = {};
            let capas = {};
            let proveedores = JSON.parse(JSON.stringify(config.proveedores));
            for (let i=0; i<proveedores.length; i++) {
                let proveedor = proveedores[i];
                try {
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
                } catch(errProv) {
                    console.error("Error sincronizando con proveedor '" + proveedor.codigo + "'", errProv);
                }
            }

            let locales = plugins.getProveedoresLocales();
            Object.values(locales).forEach(proveedorLocal => {
                proveedores.push({codigo:proveedorLocal.codigo, url:proveedorLocal.url});
                proveedorLocal.origenes.forEach(o => {
                    origenes[o.codigo] = {codigo:o.codigo, nombre:o.nombre, url:o.url};
                    let icono = o.icono;
                    if (icono.startsWith(".")) icono = proveedorLocal.url + "/" + icono.substr(2);
                    origenes[o.codigo].icono = icono;
                });
                proveedorLocal.capas.forEach(c => {
                    c.codigoProveedor = proveedorLocal.codigo;
                    capas[proveedorLocal.codigo + "." + c.codigo] = c;
                });
            });
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

    getMinZConfig() {
        return {url:config.minZ.url, token:config.minZ.token, espacios:config.minZ.espacios}
    }
}

module.exports = Capas.instance;