const espaciadosSecundarios = {
    "auto":[{valor:"-1", nombre:"No Mostrar"}, {valor:"auto", nombre:"Espaciado Automático"}],
    "10":[{valor:"-1", nombre:"No Mostrar"}, {valor:"5", nombre:"Cada 5 grados"}, {valor:"1", nombre:"Cada 1 grado"}],
    "5":[{valor:"-1", nombre:"No Mostrar"}, {valor:"2.5", nombre:"Cada 2 grados y 30 minutos"}, {valor:"1", nombre:"Cada 1 grado"}, {valor:"0.5", nombre:"Cada 30 minutos"}],
    "1":[{valor:"-1", nombre:"No Mostrar"}, {valor:"0.5", nombre:"Cada 30 minutos"}, {valor:"0.25", nombre:"Cada 15 minutos"}],
    "0.5":[{valor:"-1", nombre:"No Mostrar"}, {valor:"0.25", nombre:"Cada 30 minutos"}]
}
class Preferencias extends ZCustomController {
    onThis_activated() {
        this.edMapaBase.setRows(window.geoportal.mapa.getListaMapas(), window.geoportal.preferencias.mapaBase);
        let coordenadasDefault = {
            mostrar:false,
            espaciado1:10, width1:1,   color1:"black", 
            espaciado2:5,  width2:0.5, color2:"rgb(80,80,100)" 
        };
        this.coordenadas = window.geoportal.preferencias.mapaCoordenadas;
        if (!this.coordenadas || typeof this.coordenadas != "object") {
            this.coordenadas = coordenadasDefault;
            window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
        }
        this.edEspaciado1.setRows([{
            valor:"auto", nombre:"Espaciado Automático"
        }, {
            valor:"10", nombre:"Cada 10 grados"
        }, {
            valor:"5", nombre:"Cada 5 grados"
        }, {
            valor:"1", nombre:"Cada 1 grado"
        }, {
            valor:"0.5", nombre:"Cada 30 minutos"
        }], "" + this.coordenadas.espaciado1);
        this.edWidth1.value = this.coordenadas.width1;
        this.edColor1.value = this.coordenadas.color1;
        this.edWidth2.value = this.coordenadas.width2;
        this.edColor2.value = this.coordenadas.color2;
        this.actualizaEtiquetas(); 
        this.actualizaCoordenadas();
    }
    onEdMapaBase_change() {
        window.geoportal.preferencias.mapaBase = this.edMapaBase.value;
    }
    onImgLabels_click() {
        window.geoportal.preferencias.mapaEtiquetas = !window.geoportal.preferencias.mapaEtiquetas;
        this.actualizaEtiquetas();
    }
    onLblLabels_click() {
        window.geoportal.preferencias.mapaEtiquetas = !window.geoportal.preferencias.mapaEtiquetas;
        this.actualizaEtiquetas();
    }
    actualizaEtiquetas() {
        this.imgLabels.removeClass("fa-check-square fa-square");
        let e = window.geoportal.preferencias.mapaEtiquetas;
        if (e) {
            this.imgLabels.addClass("fa-check-square");
        } else {
            this.imgLabels.addClass("fa-square");
        }
    }
    onImgCoordenadas_click() {
        this.coordenadas.mostrar = !this.coordenadas.mostrar;
        window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
        this.actualizaCoordenadas();
    }
    onLblCoordenadas_click() {
        this.coordenadas.mostrar = !this.coordenadas.mostrar;
        window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
        this.actualizaCoordenadas();
    }
    onEdEspaciado1_change() {
        let e1 = this.edEspaciado1.value;
        if (e1 == "auto") this.coordenadas.espaciado2 = "auto";
        else this.coordenadas.espaciado2 = parseFloat(espaciadosSecundarios[e1][1].valor);
        if (e1 != "auto") e1 = parseFloat(e1);
        this.coordenadas.espaciado1 = e1;
        window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
        this.actualizaCoordenadas();
    }
    onEdEspaciado2_change() {
        let e2 = this.edEspaciado2.value;
        if (e2 != "auto") e2 = parseFloat(e2);
        this.coordenadas.espaciado2 = e2;
        window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
        this.actualizaCoordenadas();
    }
    onEdWidth1_change() {
        let w = parseFloat(this.edWidth1.value);
        if (!isNaN(w) && w > 0) {
            this.coordenadas.width1 = w;
            window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
        }
    }
    onEdWidth2_change() {
        let w = parseFloat(this.edWidth2.value);
        if (!isNaN(w) && w > 0) {
            this.coordenadas.width2 = w;
            window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
        }
    }
    onEdColor1_change() {
        this.coordenadas.color1 = this.edColor1.value;
        window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
    }
    onEdColor2_change() {
        this.coordenadas.color2 = this.edColor2.value;
        window.geoportal.preferencias.mapaCoordenadas = this.coordenadas;
    }
    actualizaCoordenadas() {
        this.imgCoordenadas.removeClass("fa-check-square fa-square");
        if (this.coordenadas.mostrar) {
            this.imgCoordenadas.addClass("fa-check-square");
            this.panelCoordenadas.show();
        } else {
            this.imgCoordenadas.addClass("fa-square");
            this.panelCoordenadas.hide();
        }        
        let esp1 = this.edEspaciado1.value;
        this.edEspaciado2.setRows(espaciadosSecundarios[esp1], "" + this.coordenadas.espaciado2);
        if (this.coordenadas.espaciado2 == "-1") {
            this.panelEstilo2.hide();
        } else {
            this.panelEstilo2.show("flex");
        }
    }    
}
ZVC.export(Preferencias);