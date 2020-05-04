class ObjetoObserva extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "observa";  
        this.options = options;
        this.objeto = options.item;
        let dataObject = this.objeto.capa.tipo == "dataObjects"?this.objeto:null;
        this.arbolAgregar = await window.geoportal.getArbolAgregarAMapa("valorEnPunto", dataObject, this.objeto.capa.codigoDimension);
    }    
    async destruye() {}
    get config() {
        let c = this.objeto.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.objeto.configPanel.configSubPaneles[this.codigo] = {
            abierto:false
        }
        return this.objeto.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
    }
    onCmdObservar_click() {
        this.zpop = new ZPop(this.caretObservar.view, this.arbolAgregar, {vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, onClick:(codigo, item) => {
            if (item.tipo == "capa") {
                let codigoVariable = item.capa.codigoProveedor + "." + item.code;
                let variable = window.geoportal.getVariable(codigoVariable);
                let nivelInicial = variable.nivelInicial;
                if (nivelInicial === undefined) nivelInicial = 0;
                this.objeto.observa.push({tipo:"capa", variable:variable, nivel:nivelInicial, codigoVariable:codigoVariable});
            } else if (item.tipo == "queryMinZ") {
                let p = item.item.variable.code.indexOf(".");
                let origen = window.geoportal.getOrigen(item.item.variable.code.substr(0,p));
                this.objeto.observa.push({tipo:"queryMinZ", variable:{nombre:item.item.variable.name, urlIcono:origen.icono}, query:item.item});
            }
            this.refresca();
            this.objeto.recalculaValoresObservados();
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
        this.titulo.text = "Observar Variables [" + this.objeto.observa.length + "]";
        let html = "";
        this.objeto.observa.forEach((o, i) => {
            html += `<div class="row mt-1">`;
            html += `  <div class="col">`;
            html += `    <i data-indice="${i}" class="fas fa-trash-alt mr-2 float-left mt-1" style="cursor: pointer;"></i>`;
            html += `    <img class="mr-1 float-left" height="16px" src="${o.variable.urlIcono}" />`;
            html += `    <span>${o.variable.nombre}</span>`;
            html += `  </div>`;
            html += `</div>`;
            if (o.variable.niveles && o.variable.niveles.length > 1) {
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
                html += `    <label id="lblNivel${i}" class="etiqueta-subpanel-propiedades mb-0">${o.variable.niveles[o.nivel].descripcion}</label>`;
                html += `  </div>`;
                html += `</div>`;
            }
        });
        this.cntObserva.html = html;
        this.cntObserva.findAll(".fa-trash-alt").forEach(eliminador => {
            eliminador.onclick = _ => {
                let indice = parseInt(eliminador.getAttribute("data-indice"));
                this.objeto.observa.splice(indice, 1);
                this.refresca();
                this.objeto.recalculaValoresObservados();
                window.geoportal.mapa.dibujaObjetos();
            }
        })
        this.cntObserva.findAll(".slider-nivel").forEach(slider => {
            let indice = parseInt(slider.getAttribute("data-indice"));
            let o = this.objeto.observa[indice];
            let lbl = this.cntObserva.find("#lblNivel" + indice);
            noUiSlider.create(slider, {
                start: o.nivel,
                step:1,
                range: {'min': 0,'max': o.variable.niveles.length - 1}
            });
            slider.noUiSlider.on("slide", v => {
                let value = parseInt(v[0]);
                o.nivel = value;
                lbl.textContent = o.variable.niveles[o.nivel].descripcion;
            });
            slider.noUiSlider.on("change", v => {
                this.objeto.recalculaValoresObservados();
            });
        })
    }
}
ZVC.export(ObjetoObserva);