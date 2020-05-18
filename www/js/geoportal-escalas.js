class EscalaGeoportal {
    constructor(config) {
        this.config = config;
        this.dinamica = config.dinamica;
        this.bloqueada = config.bloqueada;
        this.min = config.min;
        this.max = config.max;
    }
    static registraEscala(e) {
        if (!EscalaGeoportal.biblioteca) EscalaGeoportal.biblioteca = [];
        EscalaGeoportal.biblioteca.push(e);
    }
    static getBibliotecaEscalas() {
        return EscalaGeoportal.biblioteca;
    }
    static porNombre(nombre, urlPrepend) {
        let config = EscalaGeoportal.getBibliotecaEscalas().find(e => e.nombre == nombre);
        if (!config) throw "No se encontró la escala '" + nombre + "'";
        return EscalaGeoportal.creaDesdeConfig(config, urlPrepend);
    }
    static creaDesdeConfig(config, urlPrepend) {
        if (!urlPrepend) {
            let baseURL = window.location.origin + window.location.pathname;
            if (baseURL.endsWith("/")) baseURL = baseURL.substr(0, baseURL.length - 1);
            urlPrepend = baseURL;
        }
        if (config.tipo == "hsl") {
            let escala = new LinealHSL(config);
            return escala.init();
        } else if (config.tipo == "transparente") {
            let escala = new Transparente(config);
            return escala.init();
        } else if (config.tipo == "esquemaPG") {
            let escala = new EsquemaPG(config, urlPrepend);
            return escala.init();
        } else if (config.tipo == "agua-tierra") {
            let escala = new AguaTierra(config);
            return escala.init();
        } else if (config.tipo == "color-fijo-negro") {
            let escala = new Negro(config);
            return escala.init();
        } else if (config.tipo == "color-fijo-blanco") {
            let escala = new Blanco(config);
            return escala.init();
        } else if (config.tipo == "color-fijo-rojo") {
            let escala = new Rojo(config);
            return escala.init();
        } else if (config.tipo == "color-fijo-verde") {
            let escala = new Verde(config);
            return escala.init();
        } else if (config.tipo == "color-fijo-azul") {
            let escala = new Azul(config);
            return escala.init();
        } else if (config.tipo == "escala-rangos") {
            let escala = new EscalaRangos(config);
            return escala.init();
        }
        throw "Escala '" + config.tipo + "' no implementada";
    }

    async init() {return this}
    actualizaLimites(min, max) {
        this.min = min;
        this.max = max;
    }
    getColor(valor) {}
    refrescaPreview(div) {div.css({border:"1px solid red"})}
}

class LinealHSL extends EscalaGeoportal{
    constructor(config) {
        super(config);
    }    
    getColor(valor) {
        let color = "red";
        if (valor !== undefined && this.min < this.max) {
            let v = (valor - this.min) / (this.max - this.min);
            if (v < 0) v = 0;
            if (v > 1) v = 1;
            let hue=((1-v)*120).toString(10);
            color = ["hsl(",hue,",100%,50%)"].join("");
        }
        return color;
    }
    refrescaPreview(div) {
        let style = "linear-gradient(90deg, hsl(120, 100%, 50%) 0%, hsl(0, 100%, 50%) 100%)";
        div.css({"background-image":style})
    }
}

class EsquemaURL extends EscalaGeoportal {
    constructor(config, urlPrepend) {
        super(config);
        this.urlPrepend = urlPrepend;
    }

    init() {
        return new Promise((resolve, reject) => {
            fetch((this.urlPrepend?this.urlPrepend:"") + this.config.url).then(r => {
                r.text().then(txt => {
                    this.parseaEsquema(txt)
                    resolve(this);                
                });
            }).catch(error => reject(error));
        })
    }
    getColor(valor) {
        let v;
        if (this.min == this.max) v = 0;
        else v = (valor - this.min) / (this.max - this.min);
        /*
        if (v < 0) v = 0;
        if (v > 1) v = 1;
        */
        if (v < 0 || v > 1) {
            console.warn("Valor " + valor + " fuera del rango [" + this.min + ", " + this.max + "]");
            return "rgba(0,0,0,0)";
        }
        let i = parseInt(this.rangos.length / 2);
        return this.busquedaBinaria(v, i, 0, this.rangos.length - 1);
    }
    busquedaBinaria(v, i, i0, i1) {        
        let r = this.rangos[i];
        if (v >= r.min && v <= r.max || (i1 - i0) <= 1) return r.color;
        if (v < r.min) {
            let newI = parseInt(i0 + (i - i0) / 2);
            if (newI == i) {
                console.error("Error en búsqueda binaria .. rango menor inválido");
                return r.color;
            }
            return this.busquedaBinaria(v, newI, i0, i-1);
        } else if (v >= r.max) {
            let newI = i + (i1 - i) / 2;
            if (newI != parseInt(newI)) newI = 1 + parseInt(newI);
            if (newI == i) {
                console.error("Error en búsqueda binaria .. rango mayor inválido");
                return r.color;
            }
            return this.busquedaBinaria(v, newI, i+1, i1);
        } else if (isNaN(v)) {
            return null;
        } else {
            console.error("Error en búsqueda binaria .. condición no manejada", r, v);
            return r.color;
        }
    }
    refrescaPreview(div) {
        let gradSteps = this.rangos.reduce((steps, r, i) => {
            steps += ", " + r.color + " " + (100 * r.min) + "%";
            return steps;
        }, "");
        let style = "linear-gradient(90deg" + gradSteps + ")";
        div.css({"background-image":style})
    }
}
class EsquemaPG extends EsquemaURL {
    constructor(config, urlPrepend) {
        super(config, urlPrepend);
    }
    
    parseaEsquema(txt) {
        let rangos = [];
        let lines = txt.split("\n");
        let l1 = undefined;
        for (let i=0; i<lines.length; i++) {
            let campos = lines[i].split(" ").reduce((campos, v) => {
                if (v) campos.push(parseFloat(v));
                return campos;
            }, []);
            if (l1 === undefined) l1 = campos[0] + 0.0001;
            if (campos.length) {
                rangos.push({min:campos[0], max:l1, color:"rgb(" + campos[1] + ", " + campos[2] + ", " + campos[3] + ")"})
                l1 = campos[0];
            }
        }
        rangos.sort((r1, r2) => (r1.min - r2.min));
        let limites = rangos.reduce((acum, r) => {
            if (acum.min === undefined || r.min < acum.min) acum.min = r.min;
            if (acum.max === undefined || r.max > acum.max) acum.max = r.max;
            return acum;
        }, {min:undefined, max:undefined});
        let rangoTotal = limites.max - limites.min;
        rangos = rangos.map(r => ({
            min:(r.min - limites.min) / rangoTotal,
            max:(r.max - limites.min) / rangoTotal,
            color:r.color
        }))
        this.rangos = rangos;
    }
    
}


class Transparente extends EscalaGeoportal {
    constructor(config) {
        super(config);
        this.valorCorte = config.valorCorte || 0;
        this.color = config.color || [255,255,255];
    }    
    getColor(valor) {
        if (valor < this.valorCorte) return "rgba(0,0,0,0)";
        let d = this.max - this.valorCorte;
        if (d <= 0) d = 0.01;
        let p = (valor - this.valorCorte) / d;
        let r = this.color[0];
        let g = this.color[1];
        let b = this.color[2];
        let a = p;
        return "rgba(" + r + " ," + g + ", " + b + ", " + a + ")";
    }
    refrescaPreview(div) {        
        let r = this.color[0];
        let g = this.color[1];
        let b = this.color[2];
        let style = "linear-gradient(90deg, rgba(" + r + " ," + g + ", " + b + ", 0) 0%, rgba(" + r + " ," + g + ", " + b + ", 255) 100%)";
        div.css({"background-image":style})
    }
}

class AguaTierra extends EscalaGeoportal {
    constructor(config) {
        super(config);
        this.coloresAgua = [[1, 36, 92], [2, 86, 222]];
        this.coloresTierra = [[135, 71, 3], [245, 128, 2]];
    }    
    getColor(valor) {
        let r, g, b;
        if (Math.abs(valor) < 0.001) {
            r = this.coloresTierra[0][0];
            g = this.coloresTierra[0][1];
            b = this.coloresTierra[0][2];
        } else if (valor < 0) {
            let f = (valor - this.min) / (-this.min);
            r = this.coloresAgua[0][0] + f * this.coloresAgua[1][0];
            g = this.coloresAgua[0][1] + f * this.coloresAgua[1][1];
            b = this.coloresAgua[0][2] + f * this.coloresAgua[1][2];
        } else {
            let f = valor / this.max;
            r = this.coloresTierra[0][0] + f * this.coloresTierra[1][0];
            g = this.coloresTierra[0][1] + f * this.coloresTierra[1][1];
            b = this.coloresTierra[0][2] + f * this.coloresTierra[1][2];
        }        
        return "rgb(" + r + " ," + g + ", " + b + ")";
    }
    refrescaPreview(div) {        
        let r = this.coloresAgua[0][0];
        let g = this.coloresAgua[0][1];
        let b = this.coloresAgua[0][2];
        let style = "linear-gradient(90deg, rgb(" + r + " ," + g + ", " + b + ") 0%";
        r = this.coloresAgua[1][0];
        g = this.coloresAgua[1][1];
        b = this.coloresAgua[1][2];
        style += ", rgb(" + r + " ," + g + ", " + b + ") 49%";
        r = this.coloresTierra[0][0];
        g = this.coloresTierra[0][1];
        b = this.coloresTierra[0][2];
        style += ", rgb(" + r + " ," + g + ", " + b + ") 50%";
        r = this.coloresTierra[1][0];
        g = this.coloresTierra[1][1];
        b = this.coloresTierra[1][2];
        style += ", rgb(" + r + " ," + g + ", " + b + ") 100%)";

        div.css({"background-image":style})
    }
}

class ColorFijo extends EscalaGeoportal{
    constructor(config) {
        super(config);
        this.color = config.color;
    }    
    getColor(valor) {
        if (valor === undefined || valor === null || valor < this.min || valor > this.max) return "rgba(0,0,0,0)";
        return this.color;
    }
    refrescaPreview(div) {
        div[0].style.removeProperty("background-image");
        div.css({"background-color":this.color})
    }
}
class Negro extends ColorFijo {
    constructor(config) {super({color:"#000000"})}
}
class Blanco extends ColorFijo {
    constructor(config) {super({color:"#FFFFFF"})}
}
class Azul extends ColorFijo {
    constructor(config) {super({color:"#0000FF"})}
}
class Rojo extends ColorFijo {
    constructor(config) {super({color:"#FF0000"})}
}
class Verde extends ColorFijo {
    constructor(config) {super({color:"#00FF00"})}
}

class EscalaRangos extends EscalaGeoportal {
    constructor(config) {
        super(config);
        let minRef = config.min || 0;
        let maxRef = config.max || 1;
        this.rangos = [];
        for (let i=0; i<(config.rangos.length - 1); i++) {
            let r0 = config.rangos[i];
            let r1 = config.rangos[i+1];
            this.rangos.push({
                min:(r0[0] - minRef) / (maxRef - minRef),
                max:(r1[0] - minRef) / (maxRef - minRef),
                color:config.rangos[i][1]
            })
        }
        this.min = minRef;
        this.max = maxRef;
    }

    init() {return this}
    getColor(valor) {
        let v;
        if (this.min == this.max) v = 0;
        else v = (valor - this.min) / (this.max - this.min);
        if (this.config.ajustarALimites) {
            if (v < 0) v = 0;
            if (v > 1) v = 1;
        } else {
            if (v < 0 || v > 1) return "rgba(0,0,0,0)";
        }
        let i = parseInt(this.rangos.length / 2);
        return this.busquedaBinaria(v, i, 0, this.rangos.length - 1);
    }
    busquedaBinaria(v, i, i0, i1) {        
        let r = this.rangos[i];
        if (v >= r.min && v <= r.max || (i1 - i0) <= 1) return r.color;
        if (v < r.min) {
            let newI = parseInt(i0 + (i - i0) / 2);
            if (newI == i) {
                console.error("Error en búsqueda binaria .. rango menor inválido");
                return r.color;
            }
            return this.busquedaBinaria(v, newI, i0, i-1);
        } else if (v >= r.max) {
            let newI = i + (i1 - i) / 2;
            if (newI != parseInt(newI)) newI = 1 + parseInt(newI);
            if (newI == i) {
                console.error("Error en búsqueda binaria .. rango mayor inválido");
                return r.color;
            }
            return this.busquedaBinaria(v, newI, i+1, i1);
        } else if (isNaN(v)) {
            return null;
        } else {
            console.error("Error en búsqueda binaria .. condición no manejada", r, v);
            return r.color;
        }
    }
    refrescaPreview(div) {
        let gradSteps = this.rangos.reduce((steps, r, i) => {
            steps += ", " + r.color + " " + (100 * r.min) + "%";
            return steps;
        }, "");
        let style = "linear-gradient(90deg" + gradSteps + ")";
        div.css({"background-image":style})
    }
}

EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/nasa-oc-sst.pg", nombre:"sst - NASA OceanColor"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/nasa-oc-rainbow.pg", nombre:"rainbow - NASA OceanColor"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/nasa-oc-zeu.pg", nombre:"zeu - NASA OceanColor"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/nasa-oc-ndvi.pg", nombre:"ndvi - NASA OceanColor"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/matplot-lib-inferno.pg", nombre:"Inferno - MatplotLib"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/matplot-lib-magma.pg", nombre:"Magma - MatplotLib"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/matplot-lib-plasma.pg", nombre:"Plasma - MatplotLib"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/matplot-lib-viridis.pg", nombre:"Viridis - MatplotLib"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/uk-met-office-temp.pg", nombre:"Temp - UK Met Office"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/saga-01.pg", nombre:"SAGA - 01"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/saga-04.pg", nombre:"SAGA - 04"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/saga-05.pg", nombre:"SAGA - 05"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/saga-12.pg", nombre:"SAGA - 12"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/saga-16.pg", nombre:"SAGA - 16"});
EscalaGeoportal.registraEscala({tipo:"esquemaPG", url:"/js/escalas-pg/saga-17.pg", nombre:"SAGA - 17"});
EscalaGeoportal.registraEscala({tipo:"hsl", nombre:"HSL Lineal Simple"});
EscalaGeoportal.registraEscala({tipo:"transparente", nombre:"Transparencia Lineal"});
EscalaGeoportal.registraEscala({tipo:"agua-tierra", nombre:"Agua -> Tierra"});
EscalaGeoportal.registraEscala({tipo:"color-fijo-negro", nombre:"Color Fijo: Negro"});
EscalaGeoportal.registraEscala({tipo:"color-fijo-blanco", nombre:"Color Fijo: Blanco"});
EscalaGeoportal.registraEscala({tipo:"color-fijo-rojo", nombre:"Color Fijo: Rojo"});
EscalaGeoportal.registraEscala({tipo:"color-fijo-verde", nombre:"Color Fijo: Verde"});
EscalaGeoportal.registraEscala({tipo:"color-fijo-azul", nombre:"Color Fijo: Azul"});
EscalaGeoportal.registraEscala({
    tipo:"escala-rangos", nombre:"Open Weather - Classic Rain",
    ajustarALimites:true,
    min:0, max:140, unidad:"mm",
    rangos:[
        [0, "rgba(225, 200, 100, 0)"],
        [0.1, "rgba(200, 150, 150, 0)"],
        [0.2, "rgba(150, 150, 170, 0)"],
        [0.5, "rgba(120, 120, 190, 0)"],
        [1, "rgba(110, 110, 205, 0.3)"],
        [140, "rgba(20, 20, 255, 0.9)"]
    ]
});
EscalaGeoportal.registraEscala({
    tipo:"escala-rangos", nombre:"Open Weather - Classic Clouds",
    ajustarALimites:true,
    min:0, max:100, unidad:"%",
    rangos:[
        [0,   "rgba(255, 255, 255, 0.0)"],
        [10,  "rgba(253, 253, 255, 0.1)"],
        [20,  "rgba(252, 251, 255, 0.2)"],
        [30,  "rgba(250, 250, 255, 0.3)"],
        [40,  "rgba(249, 248, 255, 0.4)"],
        [50,  "rgba(247, 247, 255, 0.5)"],
        [60,  "rgba(246, 245, 255, 0.75)"],
        [70,  "rgba(244, 244, 255, 1)"],
        [80,  "rgba(243, 242, 255, 1)"],
        [90,  "rgba(242, 241, 255, 1)"],
        [100, "rgba(240, 240, 255, 1)"]
    ]
});
EscalaGeoportal.registraEscala({
    tipo:"escala-rangos", nombre:"Open Weather - Temperature",
    ajustarALimites:true,
    min:-65, max:30, unidad:"ºF",
    rangos:[
        [-65, "rgba(130, 22, 146, 1)"],
        [-55, "rgba(130, 22, 146, 1)"],
        [-45, "rgba(130, 22, 146, 1)"],
        [-40, "rgba(130, 22, 146, 1)"],
        [-30, "rgba(130, 87, 219, 1)"],
        [-20, "rgba(32, 140, 236, 1)"],
        [-10, "rgba(32, 196, 232, 1)"],
        [0,   "rgba(35, 221, 221, 1)"],
        [10,  "rgba(194, 255, 40, 1)"],
        [20,  "rgba(255, 240, 40, 1)"],
        [25,  "rgba(255, 194, 40,1)"],
        [30,  "rgba(252, 128, 20, 1)"]
    ]
});
EscalaGeoportal.registraEscala({
    tipo:"escala-rangos", nombre:"Open Weather - Pressure",
    ajustarALimites:true,
    min:94000, max:108000, unidad:"Pa",
    rangos:[
        [94000, "rgba(0,115,255,1)"],
        [96000, "rgba(0,170,255,1)"],
        [98000, "rgba(75,208,214,1)"],
        [100000, "rgba(141,231,199,1)"],
        [101000, "rgba(176,247,32,1)"],
        [102000, "rgba(240,184,0,1)"],
        [104000, "rgba(251,85,21,1)"],
        [106000, "rgba(243,54,59,1)"],
        [108000, "rgba(198,0,0,1)"]
    ]
});
EscalaGeoportal.registraEscala({
    tipo:"escala-rangos", nombre:"Open Weather - Wind",
    ajustarALimites:true,
    min:0, max:200, unidad:"m/s",
    rangos:[
        [1, "rgba(255,255,255, 0)"],
        [5, "rgba(238,206,206, 0.4)"],
        [15, "rgba(179,100,188, 0.7)"],
        [25, "rgba(63,33,59, 0.8)"],
        [50, "rgba(116,76,172, 0.9)"],
        [100, "rgba(70,0,175,1)"],
        [200, "rgba(13,17,38,1)"]
    ]
});