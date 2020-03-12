class OWProveedorLocal extends ProveedorLocal {
    constructor() {
        super("ow");
        this.registraOrigen("ow", "Open Weather", "https://openweathermap.org", "./img/ow.jpg");

        this.registraCapa("ow", "clouds_new", "Nubes - Ahora", "ow", "raster", {
            tiles:true
        }, {
            helperCapas:"OWCapasClientHelper",
            temporal:true,
            escala:{
                nombre:"Open Weather - Classic Clouds",
                min:0, max:100,
                dinamica:false, bloqueada:true,
                unidad:"%"
            }
        }, ["meteorologia"], "img/nubes.svg", 100)

        this.registraCapa("ow", "precipitation_new", "Precipitaciones - Ahora", "ow", "raster", {
            tiles:true
        }, {
            helperCapas:"OWCapasClientHelper",
            temporal:true,
            escala:{
                nombre:"Open Weather - Classic Rain",
                min:0, max:140,
                dinamica:false, bloqueada:true,
                unidad:"mm"
            }
        }, ["meteorologia"], "img/lluvia.svg", 100)

        this.registraCapa("ow", "pressure_new", "Presión Atmosférica - Ahora", "ow", "raster", {
            tiles:true
        }, {
            helperCapas:"OWCapasClientHelper",
            temporal:true,
            escala:{
                nombre:"Open Weather - Pressure",
                min:94000, max:108000,
                dinamica:false, bloqueada:true,
                unidad:"Pa"
            }
        }, ["meteorologia"], "img/presion.svg", 100)

        this.registraCapa("ow", "wind_new", "Velocidad del Viento - Ahora", "ow", "raster", {
            tiles:true
        }, {
            helperCapas:"OWCapasClientHelper",
            temporal:true,
            escala:{
                nombre:"Open Weather - Wind",
                min:0, max:200,
                dinamica:false, bloqueada:true,
                unidad:"m/s"
            }
        }, ["meteorologia"], "img/velocidad-viento.svg", 100)

        this.registraCapa("ow", "temp_new", "Temperatura - Ahora", "ow", "raster", {
            tiles:true
        }, {
            helperCapas:"OWCapasClientHelper",
            temporal:true,
            escala:{
                nombre:"Open Weather - Temperature",
                min:-65, max:30,
                dinamica:false, bloqueada:true,
                unidad:"ºF"
            }
        }, ["meteorologia"], "img/velocidad-viento.svg", 100)
    }
}

class OWPlugin extends global.PluginGeoPortal {
    constructor() {
        super("ow");
        this.registraProveedorLocal(new OWProveedorLocal());
    }
    getClientScripts() {
        return [
            "js/ow-client-plugin.js"
        ]
    }
}

module.exports = OWPlugin;