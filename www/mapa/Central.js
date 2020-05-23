class Central extends ZCustomController {
    onThis_init() {
        window.geoportal.admPanelesFlotantes = this;
        window.geoportal.panelCentral = this;
        this.tiempoActual = moment.tz(window.geoportal.tiempo, window.timeZone);
        this.tiempoInicial = this.tiempoActual.clone().subtract(2, "days").startOf("day");

        this.$view = $(this.view);
        this.tooltip.$view = $(this.tooltip.view);
        this.panelTiempo.$view = $(this.panelTiempo.view);
        this.selectorTiempo.$view = $(this.selectorTiempo.view);
        this.tiempoProgress.$view = $(this.tiempoProgress.view);
        this.tiempoAvance.$view = $(this.tiempoAvance.view);

        this.anchoDia = 24*3;
        $("body").append("<div id='poppers' style='z-index:6100;'></div>");
        this.poppers = $("body").find("#poppers");   
    
        this.tooltipBase = $(this.panelTiempo.find("#tooltipBase"));
        this.tooltipBase.tooltip({title:"...", trigger:"manual", placement:"top", html:true});
        this.panelTiempo.$view.mouseenter(e => {   
            this.tooltipBase.tooltip("show");
        });
        this.panelTiempo.$view.mouseleave(e => {
            this.tooltipBase.tooltip("hide");
        })
        this.panelTiempo.$view.mousemove(e => {
            let x = e.clientX  - this.panelTiempo.$view.offset().left;
            this.tooltipBase.css({left:x})
            let dt = this.tiempoInicial.clone().add(24 * x / this.anchoDia, "hours").startOf("hour");
            $(document.body).find(".tooltip .tooltip-inner").html(dt.format("DD/MMM/YYYY HH:mm"));
            this.tooltipBase.tooltip("update");
        })
        this.panelTiempo.$view.click(e => {
            let x = e.clientX  - this.panelTiempo.$view.offset().left;
            this.tiempoActual = this.tiempoInicial.clone().add(24 * x / this.anchoDia, "hours").startOf("hour");
            this.refrescaTiempo();
            window.geoportal.setTiempo(this.tiempoActual.valueOf());
            this.selectorTiempo.refresca();
        })
        this.tiempoActual = window.TimeUtils.now.startOf("hour");
        this.refrescaTiempo();
        this.selectorTiempo.refresca();
    }

    showTooltip(x, y, contenido, xWhenLeft) {       
        let w = this.$view.innerWidth();
        if (x < w / 2) { 
            this.tooltip.pos = {left:x, top:y};
            this.tooltip.$view.tooltip({title:$(contenido), trigger:"manual", placement:"right", html:true});
        } else {
            xWhenLeft = xWhenLeft === undefined?x - 100:xWhenLeft;
            this.tooltip.pos = {left:xWhenLeft, top:y};
            this.tooltip.$view.tooltip({title:$(contenido), trigger:"manual", placement:"left", html:true});
        }
        this.tooltip.$view.tooltip("show");
    }
    hideTooltip() {
        this.tooltip.$view.tooltip("dispose");
    }

    onSelectorTiempo_change() {
        this.tiempoActual = moment.tz(window.geoportal.tiempo, window.timeZone);
        this.refrescaTiempo();
    }
    refrescaTiempo() {
        let wMax = this.tiempoProgress.$view.width();
        let hh = this.tiempoActual.diff(this.tiempoInicial, "hours");
        let w = (this.anchoDia / 24) * hh;
        if (w > wMax - 50 || w < 20) {
            this.tiempoInicial = this.tiempoActual.clone().subtract(2, "days").startOf("day");
            this.rebuildTime();
        } else {
            this.tiempoAvance.$view.css({width:w});
        }
    }

    doResize() {
        let w = this.$view.innerWidth();
        let h = this.$view.innerHeight();
        let leftTiempo = 10;
        this.panelTiempo.$view.css({left:leftTiempo, top:h - this.panelTiempo.$view.height() - 19, width:w - leftTiempo - 10});
        this.selectorTiempo.$view.css({left:leftTiempo, top:h - this.panelTiempo.$view.height() - 78});
        this.rebuildTime();
        this.cntPanelesFlotantes.size = {width:w, height:h};
        this.ajustaPanelesFlotantes();
    }

    rebuildTime() {
        let anchoDia = this.anchoDia;
        let wMax = this.tiempoProgress.$view.width();
        let html = "";
        let t = moment.tz(this.tiempoInicial, window.timeZone);
        let w = 0;
        while (w + anchoDia < wMax) {
            html += "<div class='dia' style='position:absolute; left:" + w + "px; top:16px; width:" + anchoDia + "px; height:30px;'>" + t.format("dddd") + "<br />" + t.format("DD/MMM") + "</div>";
            w += anchoDia;
            t.add(1, "days");
        }
        this.contenedorDias.html = html;
        let hh = this.tiempoActual.diff(this.tiempoInicial, "hours");
        w = (this.anchoDia / 24) * hh;
        this.tiempoAvance.$view.css({width:w});
    }

    ajustaPanelesFlotantes() {
        let paneles = window.geoportal.capas.getGrupoActivo().getPanelesFlotantes();
        paneles.forEach(panel => this.ajustaPanelFlotante(panel));
    }
    ajustaPanelFlotante(panel) {
        let fullW = this.$view.innerWidth();
        let fullH = this.$view.innerHeight();
        let w = panel.configPanel.width, h = panel.configPanel.height;
            let x = panel.configPanel.x;
            if (x === undefined) {
                x = 10; panel.configPanel.x = x;
            }
            if (x < 0) {x = fullW - w + x}
            let y = panel.configPanel.y;
            if (y === undefined) {
                y = - 90;
                panel.configPanel.y = y;
            }
            if (y < 0) {y = fullH - h + y}
            panel.view.style.left = x + "px";
            panel.view.style.top = y + "px";
            panel.view.style.width = w + "px";
            panel.view.style.height = h + "px";
            panel.doResize();
    }
    async addPanelFlotante(item) {
        let div = document.createElement("div");
        div.setAttribute("data-z-component", "left/PanelPropiedades");
        div.style.position = "absolute";
        div.id = "fltprop-" + item.id;
        this.cntPanelesFlotantes.view.appendChild(div);
        let panel = await ZVC.fromElement(div);
        await panel.creaDesde(item);
        this.ajustaPanelFlotante(panel);
        panel.inicializaScroll();
        return panel;
    }
    async removePanelFlotante(panel) {
        await panel.destruye();
        await panel.deactivate();
        this.cntPanelesFlotantes.view.removeChild(panel.view);
    }    
}
ZVC.export(Central);