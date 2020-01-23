class PanelAgregarObjeto extends ZCustomController {
    onThis_init() {        
    }
    refresca() {
        let icono, titulo, html="";
        if (window.geoportal.agregandoObjeto == "punto") {
            icono = "img/iconos/punto.svg";
            titulo = "Agregar Punto";
            html = "<p>Haga click en el mapa para agregar el punto en la ubicación deseada. Para cancelar, cierre este panel.</p>"
        } else if (window.geoportal.agregandoObjeto == "ruta") {
            icono = "img/iconos/ruta.svg";
            titulo = "Agrega Ruta";
        } else {
            icono = "img/iconos/area.svg";
            titulo = "Agregar Área";
            html = "<p>Haga click en el mapa en un punto para seleccionar una esquina del área. Haga click en la ubicación de la esquina opuesta para terminar. Para cancelar, cierre este panel.</p>"
        }
        this.find("#imgIconoObjeto").setAttribute("src", icono);
        this.find("#lblTitulo").textContent = titulo;
        this.find("#contenido").innerHTML = html;
    }

    onCmdCerrarAgregarObjeto_click() {
        window.geoportal.cancelaAgregarObjeto();
    }
}

ZVC.export(PanelAgregarObjeto)