class SelectorTiempo extends ZCustomController {
    onThis_init() {
        moment.locale("es");
        this.itemActivo = "Hora";
        this.view.focusin = _ => this.muestraItemActivo();
        this.view.focusout = _ => this.limpiaItemActivo();
        this.view.onkeydown = e => this.keyDown(e.code, e);
        this.view.focus();
        this.refrescaCapturas();
    }
    refresca() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.time = moment.tz(window.geoportal.tiempo, window.timeZone);
        this.refrescaTiempo();
    }

    refrescaTiempo() {
        this.lblAno.text = this.time.year();
        this.lblMes.text = this.time.format("MMMM");
        this.lblDia.text = this.time.format("DD");
        this.lblHora.text = this.time.format("HH:mm");
    }

    callInforma() {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(_ => {
            this.timer = null;
            window.geoportal.setTiempo(this.time.valueOf());
            this.refresca();
            this.triggerEvent("change");            
        }, 300);
    }

    muestraActivo(boton) {
        boton.addClass("boton-selector-tiempo-activo");
        setTimeout(_ => boton.removeClass("boton-selector-tiempo-activo"), 300);
    }

    onPreHora_click() {        
        this.muestraActivo(this.preHora);
        this.itemActivo = "Hora";
        this.muestraItemActivo();
        this.time.hour(this.time.hour() - 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onNextHora_click() {
        this.muestraActivo(this.nextHora);
        this.itemActivo = "Hora";
        this.muestraItemActivo();
        this.time.hour(this.time.hour() + 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onLblHora_click() {this.itemActivo = "Hora"; this.muestraItemActivo();}

    onPreDia_click() {
        this.muestraActivo(this.preDia);
        this.itemActivo = "Dia";
        this.muestraItemActivo();
        this.time.date(this.time.date() - 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onNextDia_click() {
        this.muestraActivo(this.nextDia);
        this.itemActivo = "Dia";
        this.muestraItemActivo();
        this.time.date(this.time.date() + 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onLblDia_click() {this.itemActivo = "Dia"; this.muestraItemActivo();}

    onPreMes_click() {
        this.muestraActivo(this.preMes);
        this.itemActivo = "Mes";
        this.muestraItemActivo();
        this.time.month(this.time.month() - 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onNextMes_click() {
        this.muestraActivo(this.nextMes);
        this.itemActivo = "Mes";
        this.muestraItemActivo();
        this.time.month(this.time.month() + 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onLblMes_click() {this.itemActivo = "Mes"; this.muestraItemActivo();}

    onPreAno_click() {
        this.muestraActivo(this.preAno);
        this.itemActivo = "Ano";
        this.muestraItemActivo();
        this.time.year(this.time.year() - 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onNextAno_click() {
        this.muestraActivo(this.nextAno);
        this.itemActivo = "Ano";
        this.muestraItemActivo();
        this.time.year(this.time.year() + 1);
        this.refrescaTiempo();
        this.callInforma();
    }
    onLblAno_click() {this.itemActivo = "Ano"; this.muestraItemActivo();}

    keyDown(code, event) {
        if (code == "Tab") {
            let inc = 1;
            if (event.shiftKey) inc = -1;
            const items = ["Ano", "Mes", "Dia", "Hora"];
            let idx = items.indexOf(this.itemActivo);
            idx += inc;
            if (idx < 0) idx = 3;
            if (idx > 3) idx = 0;
            this.itemActivo = items[idx];
            this.muestraItemActivo(); 
            event.preventDefault();
            return;
        }
        if (code == "Enter") {
            this.captura();
            return;
        }
        if (code != "ArrowLeft" && code != "ArrowRight") return;
        let name = "on" + (code == "ArrowLeft"?"Pre":"Next");
        name += this.itemActivo + "_click";
        this[name]();
    }
    limpiaItemActivo() {
        this.itemHora.removeClass("item-selector-tiempo-activo");
        this.itemDia.removeClass("item-selector-tiempo-activo");
        this.itemMes.removeClass("item-selector-tiempo-activo");
        this.itemAno.removeClass("item-selector-tiempo-activo");
    }
    muestraItemActivo() {
        this.limpiaItemActivo();
        this["item" + this.itemActivo].addClass("item-selector-tiempo-activo")
    }

    refrescaCapturas() {
        if (!window.configCapturas) window.configCapturas = {tiempo:"DD/MMMM/YYYY HH:mm", titulo:"", fotos:[], delay:200};
        console.log("capturas", window.configCapturas);
        this.lblNCapturas.text = "[" + window.configCapturas.fotos.length + "]";        
    }

    captura() {
        this.camara.addClass("boton-selector-tiempo-activo");
        let div = document.querySelector("#main").querySelector("#mapa");
        let timeText, titleText;
        let ly = window.geoportal.mapa.konvaLayerLeyendas,
            stage = window.geoportal.mapa.konvaStage;
        let fmt = window.configCapturas.tiempo;
        if (fmt) {
            let st = TimeUtils.fromUTCMillis(window.geoportal.tiempo).format(fmt);
            timeText = new Konva.Text({
                x: 10,
                y: stage.height() - 30,
                text: st,
                fontSize: 26,
                fontFamily: 'Courier',
                fontStyle: "bold",
                fill: 'white',
                stroke: 'black',
                strokeWidth:1.5
              });
            ly.add(timeText);
        }
        if (window.configCapturas.titulo) {
            titleText = new Konva.Text({
                x: stage.width() - 10,
                y: 6,
                align: "right",
                text: window.configCapturas.titulo,
                fontSize: 32,
                fontFamily: 'Courier',
                fontStyle: "bold",
                fill: 'white',
                stroke: 'black',
                strokeWidth:2
            });
            titleText.x(titleText.x() - titleText.width());
            ly.add(titleText);
        }
        if (timeText || titleText) ly.draw();
        html2canvas(div, {
            useCORS:true,
            removeContainer:false,
            allowTaint:true,
            backgroundColor:null,
            logging:false
        })
            .then(canvas => {
                console.log("canvas", canvas)
                window.configCapturas.fotos.push({tiempo:window.geoportal.tiempo, canvas:canvas});
                this.refrescaCapturas();
                if (timeText) timeText.destroy();
                if (titleText) titleText.destroy();
                if (timeText || titleText) ly.draw();                
                this.camara.removeClass("boton-selector-tiempo-activo");
            });
    }
    onLblNCapturas_click() {this.menuCapturas()}
    onCamara_click() {this.menuCapturas()}
    onCaretCaptura_click() {this.menuCapturas()}
    menuCapturas() {
        let rows = [{
            code:"capturar", label:"Capturar Imagen (enter)", icon:"fas fa-camera"
        }, {
            code:"exportar", label:"Exportar imágenes o animación", icon:"fas fa-film"
        }, {
            code:"limpiar", label:"Limpiar Capturas", icon:"fas fa-ban"
        }, {
            code:"sep", label:"-"
        }, {
            code:"configurar", label:"Configurar Etiquetas", icon:"fas fa-cogs"
        }]
        this.zpop = new ZPop(this.caretCaptura.view, rows,
            {
                vMargin:0, hMargin:6,
                hPos:"right", vPos:"justify-top", 
                onClick:(code, row) => {                        
                    if (code == "capturar") this.captura();
                    else if (code == "limpiar") {
                        window.configCapturas.fotos = [];
                        this.refrescaCapturas();
                    } else if (code == "exportar") {
                        this.showDialog("./WExportaCapturas", {}, null, _ => this.refrescaCapturas());
                    } else if (code == "configurar") {
                        this.showDialog("./WConfigCapturas");
                    } 
                    return true;
                }
            }
        ).show();
    }
}
ZVC.export(SelectorTiempo);