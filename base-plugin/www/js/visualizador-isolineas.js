class VisualizadorIsolineas extends VisualizadorCapa {
    constructor(capa, config) {
        super("isolineas", capa, config);
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.isolineas;
    }

    async crea() {

    }
    async destruye() {

    }
    refresca() {
        this.capa.getPreConsulta((err, preconsulta) => {
            if (err) {
                console.error(err);
                return;
            }
            this.preconsulta = preconsulta;
            this.refresca2();
        })
    }
    refresca2() {
        console.log("preconsulta desde visualizador", this.preconsulta);
    }
}

window.geoportal.capas.registraVisualizador("base", "isolineas", VisualizadorIsolineas, "Isolíneas", "base/img/isolineas.svg");
