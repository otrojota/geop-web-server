class SelectorTiempo extends ZCustomController {
    onThis_init() {
        moment.locale("es");
        this.itemActivo = "Hora";
        this.view.focusin = _ => this.muestraItemActivo();
        this.view.focusout = _ => this.limpiaItemActivo();
        this.view.onkeydown = e => this.keyDown(e.code, e);
        this.view.focus();
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
}
ZVC.export(SelectorTiempo);