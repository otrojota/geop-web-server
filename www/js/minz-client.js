const temporalityLevel = {
    "5m":{level:0, name:"5 min."},
    "15m":{level:1, name:"15 min."},
    "30m":{level:2, name:"30 min."},
    "1h":{level:3, name:"1 hour"},
    "6h":{level:4, name:"6 hours"},
    "12h":{level:5, name:"12 hours"},
    "1d":{level:6, name:"1 day"},
    "1M":{level:7, name:"1 month"},
    "3M":{level:8, name:"3 months"},
    "4M":{level:9, name:"4 months"},
    "6M":{level:10, name:"6 months"},
    "1y":{level:11, name:"1 year"}
};

class MinZClient {
    constructor(minZURL, minZToken, espacios) {
        this.url = minZURL;
        this.token = minZToken;
        this.espacios = espacios;        
    }

    normalizaTiempo(temporality, time) {
        let d = moment.tz(time, window.timeZone), t0, t1, desc;
        d.seconds(0);
        d.milliseconds(0);
        switch(temporality) {
            case "5m":
                d.minutes(5 * parseInt(d.minutes() / 5));
                t0 = d.valueOf();
                desc = d.format("DD/MM/YYYY HH:mm:ss");
                d.minutes(d.minutes() + 5);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - HH:mm:ss");
                return {t0:t0, t1:t1, desc:desc};
            case "15m":
                d.minutes(15 * parseInt(d.minutes() / 15));
                t0 = d.valueOf();
                desc = d.format("DD/MM/YYYY HH:mm:ss");
                d.minutes(d.minutes() + 15);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - HH:mm:ss");
                return {t0:t0, t1:t1, desc:desc};
            case "30m":
                d.minutes(30 * parseInt(d.minutes() / 30));
                t0 = d.valueOf();
                desc = d.format("DD/MM/YYYY HH:mm:ss");
                d.minutes(d.minutes() + 30);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - HH:mm:ss");
                return {t0:t0, t1:t1, desc:desc};
            case "1h":
                d.minutes(0);
                t0 = d.valueOf();
                desc = d.format("DD/MM/YYYY HH:mm:ss");
                d.hours(d.hours() + 1);                
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - HH:mm:ss");
                return {t0:t0, t1:t1, desc:desc};
            case "6h":
                d.minutes(0);
                d.hours(6 * parseInt(d.hours() / 6));
                t0 = d.valueOf();
                desc = d.format("DD/MM/YYYY HH:mm:ss");
                d.hours(d.hours() + 6);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - HH:mm:ss");
                return {t0:t0, t1:t1, desc:desc};
            case "12h":
                d.minutes(0);
                d.hours(12 * parseInt(d.hours() / 12));
                t0 = d.valueOf();
                desc = d.format("DD/MM/YYYY HH:mm:ss");
                d.hours(d.hours() + 12);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - HH:mm:ss");
                return {t0:t0, t1:t1, desc:desc};
            case "1d":
                d.minutes(0);                
                d.hours(0);
                t0 = d.valueOf();
                desc = d.format("DD/MM/YYYY");
                d.date(d.date() + 1);
                return {t0:t0, t1:d.valueOf(), desc:desc};
            case "1M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                t0 = d.valueOf();
                desc = d.format("MMM/YYYY");
                d.month(d.month() + 1);
                return {t0:t0, t1:d.valueOf(), desc:desc};
            case "3M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(3 * parseInt(d.month() / 3));
                t0 = d.valueOf();
                desc = d.format("YYYY MMM");
                d.month(d.month() + 3);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - MMM");
                return {t0:t0, t1:t1, desc:desc};
            case "4M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(4 * parseInt(d.month() / 4));
                t0 = d.valueOf();
                desc = d.format("YYYY MMM");
                d.month(d.month() + 4);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - MMM");
                return {t0:t0, t1:t1, desc:desc};
            case "6M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(6 * parseInt(d.month() / 6));
                t0 = d.valueOf();
                desc = d.format("YYYY MMM");
                d.month(d.month() + 6);
                t1 = d.valueOf();
                d.seconds(d.seconds() - 1);
                desc += d.format(" - MMM");
                return {t0:t0, t1:t1, desc:desc};
            case "1y":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(0);
                t0 = d.valueOf();
                desc = d.format("YYYY");
                d.year(d.year() + 1);
                return {t0:t0, t1:d.valueOf(), desc:desc};
            default:
                throw("Temporality '" + temporality + "' not handled");
        }
    }    
    
    async getDimensiones() {
        if (this.dimensiones) return this.dimensiones;
        try {
            this.dimensiones = (await (await fetch(this.url + "/dim/dimensions?token=" + this.token)).json());
            return this.dimensiones;
        } catch(error) {
            throw error;
        }
    }
    async getDimension(code) {
        let dims = await this.getDimensiones();
        if (!dims) return null;
        return dims.find(d => d.code == code);
    }
    async getVariables() {
        if (this.variables) return this.variables;
        try {
            this.variables = (await (await fetch(this.url + "/var/variables?token=" + this.token)).json());
            return this.variables;
        } catch(error) {
            throw error;
        }
    }
    
    buscaRutasDesde(variable, origen, rutas, path, codigoDimension) {
        origen.classifiers.forEach(c => {
            let newPath = (path?path + ".":"") + c.fieldName;
            if (c.dimensionCode == codigoDimension) {
                rutas.push({variable:variable, ruta:newPath});
            } else {
                let dim = this.dimensiones.find(d => d.code == c.dimensionCode);
                this.buscaRutasDesde(variable, dim, rutas, newPath, codigoDimension);
            }
        });
    }
    async getVariablesFiltrables(codigoDimension) {
        try {
            let rutas = [];
            let vars = await this.getVariables();
            await this.getDimensiones();
            vars.forEach(v => {
                this.buscaRutasDesde(v, v, rutas, "", codigoDimension);
            });
            return rutas;
        } catch(error) {
            throw error;
        }
    }

    // Filas Dimensiones
    async getValorDimension(codigoDimension, codigoFila) {
        try {
            console.log("get Valor dimension", codigoDimension, codigoFila);
            let f = await fetch(this.url + "/dim/" + codigoDimension + "/rows/" + codigoFila + "?token=" + this.token);
            if (f.status != 200) throw await f.text();
            else return await f.json();
        } catch(error) {
            throw error;
        }
    }

    // Queries
    getFiltroDeRuta(ruta, valorDimension) {
        // ruta:{variable:object, ruta:path.path...}
        let filtro = {};
        this.construyeFiltro(filtro, ruta.ruta, valorDimension);
        return filtro;
    }
    construyeFiltro(filtro, path, valor) {
        let elementosPath = path.split(".");
        let elementoFiltro = filtro;
        elementosPath.forEach((e, i) => {
            if (i == (elementosPath.length - 1)) elementoFiltro[e] = valor;
            else {
                let nuevoElementoFiltro;
                if (!elementoFiltro[e]) {
                    nuevoElementoFiltro = {};
                    elementoFiltro[e] = nuevoElementoFiltro;
                } else {
                    nuevoElementoFiltro = elementoFiltro[e];
                }
                elementoFiltro = nuevoElementoFiltro;
            }
        });
        return filtro;
    }
    extraeAcumulador(resultado, acumulador) {
        if (!resultado) return null;
        switch(acumulador) {
            case "sum": return resultado.value !== undefined?resultado.value:null;
            case "min": return resultado.min !== undefined?resultado.min:null;
            case "max": return resultado.max !== undefined?resultado.max:null;
            case "n"  : return resultado.n !== undefined?resultado.n:0;
            case "avg": return (resultado.n > 0?resultado.value / resultado.n:null);
            default: throw "Acumulador '" + acumulador + "' no manejado";
        }
    }
    async query(query, startTime, endTime) {
        /*
        console.log("minZ Query", query);
        console.log("startTime", moment.tz(startTime, window.timeZone).format("YYYY-MM-DD HH:mm"));
        console.log("endTime", moment.tz(endTime, window.timeZone).format("YYYY-MM-DD HH:mm"));
        */
        try {
            let filtro, resultado;
            switch (query.tipoQuery) {
                case "period-summary":
                    filtro = {};
                    if (query.filtros) query.filtros.forEach(f => this.construyeFiltro(filtro, f.ruta, f.valor));
                    if (query.filtroFijo) this.construyeFiltro(filtro, query.filtroFijo.ruta, query.filtroFijo.valor);
                    resultado = await this.queryPeriodSummary(query.variable.code, startTime, endTime, filtro);
                    //console.log("query", query, "resultado", resultado);
                    return this.extraeAcumulador(resultado, query.acumulador);
                case "time-serie":
                    filtro = {};
                    if (query.filtros) query.filtros.forEach(f => this.construyeFiltro(filtro, f.ruta, f.valor));
                    if (query.filtroFijo) this.construyeFiltro(filtro, query.filtroFijo.ruta, query.filtroFijo.valor);
                    resultado = await this.queryTimeSerie(query.variable.code, startTime, endTime, filtro, query.temporalidad);
                    //console.log("query", query, "resultado", resultado);
                    resultado.forEach(r => r.resultado = this.extraeAcumulador(r, query.acumulador));
                    return resultado;
                case "dim-serie":
                    filtro = {};
                    if (query.filtros) query.filtros.forEach(f => this.construyeFiltro(filtro, f.ruta, f.valor));
                    resultado = await this.queryDimSerie(query.variable.code, startTime, endTime, filtro, query.dimensionAgrupado);
                    //console.log("query", query, "resultado", resultado);
                    resultado.forEach(r => r.resultado = this.extraeAcumulador(r, query.acumulador));
                    return resultado;
                default:
                    throw "Tipo de query '" + query.tipoQuery + "' no implementado";
            }
        } catch(error) {
            throw error;
        }
    }
    async queryPeriodSummary(codigoVariable, startTime, endTime, filter) {
        try {
            await this.getDimensiones();
            await this.getVariables();
            let url = this.url + "/data/" + codigoVariable + "/period-summary?token=" + this.token;
            url += "&startTime=" + startTime + "&endTime=" + endTime;
            url += "&filter=" + encodeURIComponent(JSON.stringify(filter));
            let summary = (await (await fetch(url)).json());
            return summary;
        } catch(error) {
            throw error;
        }
    }
    async queryTimeSerie(codigoVariable, startTime, endTime, filter, temporality) {
        try {
            await this.getDimensiones();
            await this.getVariables();
            let url = this.url + "/data/" + codigoVariable + "/time-serie?token=" + this.token;
            url += "&startTime=" + startTime + "&endTime=" + endTime;
            url += "&filter=" + encodeURIComponent(JSON.stringify(filter));
            url += "&temporality=" + temporality;
            let summary = (await (await fetch(url)).json());
            return summary;
        } catch(error) {
            throw error;
        }
    }
    async queryDimSerie(codigoVariable, startTime, endTime, filter, dimensionAgrupado) {
        try {
            await this.getDimensiones();
            await this.getVariables();
            let url = this.url + "/data/" + codigoVariable + "/dim-serie?token=" + this.token;
            url += "&startTime=" + startTime + "&endTime=" + endTime;
            url += "&filter=" + encodeURIComponent(JSON.stringify(filter));
            url += "&groupDimension=" + dimensionAgrupado
            let ret = (await (await fetch(url)).json());
            return ret;
        } catch(error) {
            throw error;
        }
    }
}