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
        let d = moment.tz(time, window.timeZone), t0;
        d.seconds(0);
        d.milliseconds(0);
        switch(temporality) {
            case "5m":
                d.minutes(5 * parseInt(d.minutes() / 5));
                t0 = d.valueOf();
                d.minutes(d.minutes() + 5);
                return {t0:t0, t1:d.valueOf()};
            case "15m":
                d.minutes(15 * parseInt(d.minutes() / 15));
                t0 = d.valueOf();
                d.minutes(d.minutes() + 15);
                return {t0:t0, t1:d.valueOf()};
            case "30m":
                d.minutes(30 * parseInt(d.minutes() / 30));
                t0 = d.valueOf();
                d.minutes(d.minutes() + 30);
                return {t0:t0, t1:d.valueOf()};
            case "1h":
                d.minutes(0);
                t0 = d.valueOf();
                d.hours(d.hours() + 1);
                return {t0:t0, t1:d.valueOf()};
            case "6h":
                d.minutes(0);
                d.hours(6 * parseInt(d.hours() / 6));
                t0 = d.valueOf();
                d.hours(d.hours() + 6);
                return {t0:t0, t1:d.valueOf()};
            case "12h":
                d.minutes(0);
                d.hours(12 * parseInt(d.hours() / 12));
                t0 = d.valueOf();
                d.hours(d.hours() + 12);
                return {t0:t0, t1:d.valueOf()};
            case "1d":
                d.minutes(0);                
                d.hours(0);
                t0 = d.valueOf();
                d.date(d.date() + 1);
                return {t0:t0, t1:d.valueOf()};
            case "1M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                t0 = d.valueOf();
                d.month(d.month() + 1);
                return {t0:t0, t1:d.valueOf()};
            case "3M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(3 * parseInt(d.month() / 3));
                t0 = d.valueOf();
                d.month(d.month() + 3);
                return {t0:t0, t1:d.valueOf()};
            case "4M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(4 * parseInt(d.month() / 4));
                t0 = d.valueOf();
                d.month(d.month() + 4);
                return {t0:t0, t1:d.valueOf()};
            case "6M":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(6 * parseInt(d.month() / 6));
                t0 = d.valueOf();
                d.month(d.month() + 6);
                return {t0:t0, t1:d.valueOf()};
            case "1y":
                d.minutes(0);                
                d.hours(0);
                d.date(1);
                d.month(0);
                t0 = d.valueOf();
                d.year(d.year() + 1);
                return {t0:t0, t1:d.valueOf()};
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

    // Queries
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
}