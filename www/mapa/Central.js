class Central extends ZCustomController {
    onThis_init() {
        window.geoportal.admPanelesFlotantes = this;
        window.geoportal.panelCentral = this;
        this.$view = $(this.view);        
        this.edTiempoActual.$view = $(this.edTiempoActual.view);
        this.tooltip.$view = $(this.tooltip.view);
        this.panelTiempo.$view = $(this.panelTiempo.view);
        this.panelTiempoActual.$view = $(this.panelTiempoActual.view);
        this.tiempoProgress.$view = $(this.tiempoProgress.view);
        this.tiempoAvance.$view = $(this.tiempoAvance.view);

        this.anchoDia = 24*3;
        $("body").append("<div id='poppers' style='z-index:6100;'></div>");
        this.poppers = $("body").find("#poppers");   
    
        this.edTiempoActual.$view.datetimepicker({
            timeZone:window.timeZone,
            format:"DD/MMM/YYYY",
            widgetPositioning: {horizontal: 'left', vertical: 'top'},
            locale:"es"
        });
        this.mostrandoCalendario = false;
        this.edTiempoActual.$view.on("dp.show", _ => this.mostrandoCalendario = true);
        this.edTiempoActual.$view.on("dp.hide", _ => this.mostrandoCalendario = false);
        this.edTiempoActual.$view.on("dp.change", e => {
            if (this.mostrandoCalendario) {
                this.mostrandoCalendario = false;
                this.tiempoActual = e.date.clone();
                this.tiempoInicial = this.tiempoActual.clone().subtract(2, "days").startOf("day");
                this.rebuildTime();
                this.refrescaTiempo();
                window.geoportal.setTiempo(this.tiempoActual.valueOf());
            }
        });
        $(this.find("#cmdCalendar")).click(_ => this.edTiempoActual.$view.datetimepicker("toggle"));

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
            if (this.mostrandoCalendario) this.edTiempoActual.$view.datetimepicker("hide");
            this.refrescaTiempo();
            window.geoportal.setTiempo(this.tiempoActual.valueOf());
        })
        this.tiempoActual = window.TimeUtils.now.startOf("hour");
        this.tiempoInicial = this.tiempoActual.clone().subtract(2, "days").startOf("day");
        this.refrescaTiempo();
    }

    showTooltip(x, y, contenido) {        
        this.tooltip.pos = {left:x, top:y};
        this.tooltip.$view.tooltip({title:$(contenido), trigger:"manual", placement:"right", html:true});
        this.tooltip.$view.tooltip("show");
    }
    hideTooltip() {
        this.tooltip.$view.tooltip("dispose");
    }

    refrescaTiempo() {        
        let hh = this.tiempoActual.diff(this.tiempoInicial, "hours");
        this.tiempoAvance.$view.css({width:(this.anchoDia / 24) * hh});
        this.lblTiempoActual.text = this.tiempoActual.format("DD/MMM/YYYY HH:mm");
        this.edTiempoActual.$view.datetimepicker("date", this.tiempoActual);
    }

    doResize() {
        console.log("central resize");
        let w = this.$view.innerWidth();
        let h = this.$view.innerHeight();
        let leftTiempo = 10;
        this.panelTiempo.$view.css({left:leftTiempo, top:h - this.panelTiempo.$view.height() - 19, width:w - leftTiempo - 10});
        this.panelTiempoActual.$view.css({left:leftTiempo, top:h - this.panelTiempo.$view.height() - 48});
        this.rebuildTime();
        this.cntPanelesFlotantes.size = {width:w, height:h};
        this.ajustaPanelesFlotantes();
    }

    rebuildTime() {
        let anchoDia = this.anchoDia;
        let wMax = this.tiempoProgress.$view.width();
        let html = "";
        let t = moment.tz(this.tiempoInicial, window.timeZone);
        t.locale("es");
        let w = 0;
        while (w + anchoDia < wMax) {
            html += "<div class='dia' style='position:absolute; left:" + w + "px; top:16px; width:" + anchoDia + "px; height:30px;'>" + t.format("dddd") + "<br />" + t.format("DD/MMM") + "</div>";
            w += anchoDia;
            t.add(1, "days");
        }
        this.contenedorDias.html = html;
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