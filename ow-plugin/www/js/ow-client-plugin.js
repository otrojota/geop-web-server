class OWPlugin extends PluginClienteGeoPortal {
    constructor() {
        super("ow");
    }
    async init() {   
        console.log("[GEOPortal][ow] Inicializando Plugin OW");
    }
}

const OWMAPIKey = "c4cddd6d9ba5adb35f09a37f6650a240";

class OWHelperCapas extends HelperCapasCliente {
    constructor() {
        super("OWCapasClientHelper");
    }
    creaCapa(config) {
        config.visualizadoresIniciales = {
            tiles:{
                escala:config.opciones.escala
            }
        }
        let capa = new Capa(config);
        return capa;
    }
    destruyeCapa(capa) {}
    getTilesUrl(capa) {
        return `https://tile.openweathermap.org/map/${capa.codigo}/{z}/{x}/{y}.png?appid=${OWMAPIKey}`;
    }
}


new OWHelperCapas(); // Se registra en el constructor
window.geoportal.registerPlugin(new OWPlugin());