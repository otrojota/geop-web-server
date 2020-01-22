self.importScripts("shapefile-0.6.6.js", "/js/geoportal-escalas.js");

self.addEventListener("message", e => {
    let operation = e.data.operation;
    let operationId = e.data.operationId;
    let data = e.data.data;
    try {
        let ret = resolve(operation, data);
        if (ret instanceof Promise) {
            ret.then(r => this.returnData(operationId, r)).catch(error => returnError(operation, operationId, error));
        } else {
            this.returnData(operationId, ret)
        }
    } catch(error) {
        this.returnError(operation, operationId, error);
    }
});

function resolve(operation, data) {
    try {
        switch(operation) {
            case "getIsolineas":
                return this.getIsolineas(data.url);
            case "getIsobandas":
                    return this.getIsobandas(data.url, data.config, data.baseURL, data.min, data.max);
                default:
                throw "Operación '" + operation + "' no implementada en worker";
        }
    } catch(error) {
        console.error("Error en worker [" + operation + "]", error);
        throw error;
    }
}

function returnData(operationId, data) {
    self.postMessage({id:operationId, data:data});
}
function returnError(operation, operationId, error) {
    self.postMessage({id:operationId, error:error.toString()});
}

async function getIsolineas(url) {    
    try {
        let geoJSON = await shapefile.read(url);
        let marcadores = [];
        geoJSON.features.forEach(f => {
            if (f.geometry.type == "LineString") {
                let v = Math.round(f.properties.value * 100) / 100;
                let n = f.geometry.coordinates.length;
                let med = parseInt((n - 0.1) / 2);
                let p0 = f.geometry.coordinates[med], p1 = f.geometry.coordinates[med+1];
                let lng = (p0[0] + p1[0]) / 2;
                let lat = (p0[1] + p1[1]) / 2;
                marcadores.push({lat:lat, lng:lng, value:v});
            }
        });
        return {isolineas:geoJSON, marcadores:marcadores};
    } catch(error) {
        throw error;
    }
}

async function getIsobandas(url, config, baseURL, min, max) { 
    try {
        //importScripts("base/js/shapefile-0.6.6.js", "../js/geoportal-escalas.js");                
        let geoJSON = await shapefile.read(url);
        //let escala = await EscalaGeoportal.creaDesdeConfig(config.escala, baseURL)
        let escala = await EscalaGeoportal.porNombre(config.escala.nombre, baseURL);
        escala.dinamica = config.escala.dinamica;
        escala.actualizaLimites(min, max);
        geoJSON.features.forEach(f => {
            let value = (f.properties.minValue + f.properties.maxValue) / 2;
            f.properties.value = value;
            f.properties.color = escala.getColor(value);
            f.properties.type = "isoband";
        });
        return {isobandas:geoJSON};
    } catch(error) {
        throw error;
    }
}