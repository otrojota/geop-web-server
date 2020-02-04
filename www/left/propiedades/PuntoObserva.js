class PuntoObserva extends ZCustomController {
    onThis_init(options) {      
        this.codigo = "observa";  
        this.options = options;
        this.punto = options.item;
        this.arbolAgregar = window.geoportal.getArbolAgregarAMapa("valorEnPunto");
    }    
    async destruye() {}
    get config() {
        let c = this.punto.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.punto.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.punto.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onCmdObservar_click() {
        this.zpop = new ZPop(this.caretObservar.view, this.arbolAgregar, {vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, onClick:(codigo, item) => {
            let nivelInicial = item.capa.nivelInicial;
            if (nivelInicial === undefined) nivelInicial = 0;
            this.punto.observa.push({capa:window.geoportal.capasDisponibles[item.capa.codigoProveedor + "." + item.capa.codigo], nivel:nivelInicial});
            this.refresca();
            this.punto.recalculaValoresObservados();
        }});
        this.zpop.show();
    }
    refresca() {
        if (this.config.abierto) {
            this.imgAbierto.removeClass("fa-plus-square");
            this.imgAbierto.addClass("fa-minus-square");
            this.contenido.show();
        } else {
            this.imgAbierto.removeClass("fa-minus-square");
            this.imgAbierto.addClass("fa-plus-square");
            this.contenido.hide();
        }
        this.titulo.text = "Observar Variables [" + this.punto.observa.length + "]";
        let html = "";
        this.punto.observa.forEach((o, i) => {
            html += `<div class="row mt-1">`;
            html += `  <div class="col">`;
            html += `    <i data-indice="${i}" class="fas fa-trash-alt mr-2 float-left mt-1" style="cursor: pointer;"></i>`;
            html += `    <img class="mr-1 float-left" height="16px" src="${o.capa.urlIcono}" />`;
            html += `    <span>${o.capa.nombre}</span>`;
            html += `  </div>`;
            html += `</div>`;
            if (o.capa.niveles && o.capa.niveles.length > 1) {
                html += `<div class="row mt-1 ml-2">`;
                html += `  <div class="col-4">`;
                html += `    <label class="etiqueta-subpanel-propiedades mb-0">Nivel</label>`;
                html += `  </div>`;
                html += `  <div class="col-8">`;
                html += `    <div id="edNivel${i}" class="slider-nivel" data-indice="${i}"></div>`;
                html += `  </div>`;
                html += `</div>`;
                html += `<div class="row ml-2">`;
                html += `  <div class="col">`;
                html += `    <label id="lblNivel${i}" class="etiqueta-subpanel-propiedades mb-0">${o.capa.niveles[o.nivel].descripcion}</label>`;
                html += `  </div>`;
                html += `</div>`;
            }
        });
        this.cntObserva.html = html;
        this.cntObserva.findAll(".fa-trash-alt").forEach(eliminador => {
            eliminador.onclick = _ => {
                let indice = parseInt(eliminador.getAttribute("data-indice"));
                this.punto.observa.splice(indice, 1);
                this.refresca();
                this.punto.recalculaValoresObservados();
            }
        })
        this.cntObserva.findAll(".slider-nivel").forEach(slider => {
            let indice = parseInt(slider.getAttribute("data-indice"));
            let o = this.punto.observa[indice];
            let lbl = this.cntObserva.find("#lblNivel" + indice);
            noUiSlider.create(slider, {
                start: o.nivel,
                step:1,
                range: {'min': 0,'max': o.capa.niveles.length - 1}
            });
            slider.noUiSlider.on("slide", v => {
                let value = parseInt(v[0]);
                o.nivel = value;
                lbl.textContent = o.capa.niveles[o.nivel].descripcion;
            });
            slider.noUiSlider.on("change", v => {
                this.punto.recalculaValoresObservados();
            });
        })
    }
}
ZVC.export(PuntoObserva);