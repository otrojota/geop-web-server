class CapaObserva extends ZCustomController {
    async onThis_init(options) {      
        this.codigo = "observa";  
        this.options = options;
        this.capa = options.item;
        this.arbolAgregar = await window.geoportal.getArbolAgregarAMapa("valorEnPunto", null, this.capa.codigoDimension, this.capa);
        this.capa.recalculoListener = _ => this.refresca();
        this.edHPos.setRows([{pos:"izquierda", nombre:"Izquierda"}, {pos:"centro", nombre:"Centro"}, {pos:"derecha", nombre:"Derecha"}]);
        this.edVPos.setRows([{pos:"arriba", nombre:"Arriba"}, {pos:"centro", nombre:"Centro"}, {pos:"abajo", nombre:"Abajo"}]);
        this.escala = await EscalaGeoportal.porNombre(this.config.escala.nombre);
        this.edTipoEscala.setRows(EscalaGeoportal.getBibliotecaEscalas());
    }    
    async destruye() {this.capa.recalculoListener = null}
    get config() {
        let c = this.capa.configPanel.configSubPaneles[this.codigo];
        if (c) return c;
        this.capa.configPanel.configSubPaneles[this.codigo] = {
            abierto:false, leyenda:{hPos:"izquierda", vPos:"arriba"}, escala:{nombre:"HSL Lineal Simple", dinamica:true}
        }
        return this.capa.configPanel.configSubPaneles[this.codigo];
    }
    onFilaTitulo_click() {
        this.config.abierto = !this.config.abierto;
        this.refresca();
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
        this.titulo.text = "Observar Variables [" + this.capa.observa.length + "]";
        if (this.capa.recalculandoValoresObservados) {
            this.rowNueva.html = "";
            if (this.capa.cancelandoRecalculoValoresObservados) {
                this.rowNueva.hide();
                this.rowWorking.hide();
                this.rowCancelando.show();
            } else {
                this.rowNueva.hide();
                this.rowWorking.show();
                this.rowCancelando.hide();
                this.progress.view.style.width = this.capa.avanceRecalculoValoresObservados + "%";
            }
        } else {
            this.rowNueva.show();
            this.rowWorking.hide();
            this.rowCancelando.hide();
            let seleccionador = ConsultaGeoportal.nuevoSeleccionadorVacio("[Observar Nueva Variable]");
            this.rowNueva.html = seleccionador.getHTML(true);
            seleccionador.registraListeners(this.rowNueva, {
                arbolItems:this.arbolAgregar,
                onSelecciona:consulta => {
                    this.capa.observa.forEach(o => o.colorear = false);
                    this.capa.observa.push({leyenda:true, colorear:true, consulta:consulta})
                    consulta.construyeDescripcionFiltros()
                        .then(_ => {
                            this.refresca();
                            this.capa.recalculaValoresObservados();        
                        })
                }
            });
        }
        this.edHPos.value = this.config.leyenda.hPos;
        this.edVPos.value = this.config.leyenda.vPos;
        let nLeyendas = this.capa.observa.filter(o => o.leyenda).length;
        if (nLeyendas) this.cntLeyendas.show();
        else this.cntLeyendas.hide();
        let html = "";
        this.capa.observa.forEach((o, i) => {
            html += o.consulta.getHTML(false);
            // Leyenda y colorear
            html += `<div class="row mt-1">`;
            html += `  <div class="col selectorLeyenda" style="cursor: pointer;" data-indice="${i}">`;
            html += `    <i class="far ${o.leyenda?"fa-check-square":"fa-square"} mr-2 float-left mt-1"></i>`;
            html += `    <span>Leyendas</span>`;
            html += `  </div>`;
            html += `  <div class="col selectorColorear" style="cursor: pointer;" data-indice="${i}">`;
            html += `    <i class="far ${o.colorear?"fa-check-circle":"fa-circle"} mr-2 float-left mt-1"></i>`;
            html += `    <span>Colorear</span>`;
            html += `  </div>`;
            html += `</div>`;
            if (i < (this.capa.observa.length - 1)) {
                html += "<hr class='my-1' />";
            }
        });
        this.cntObserva.html = html;
        this.capa.observa.forEach(o => {
            o.consulta.registraListeners(this.cntObserva, {
                onElimina:_ => {
                    let idx = this.capa.observa.findIndex(oo => oo.consulta.id == o.consulta.id);
                    this.capa.observa.splice(idx, 1);
                    this.refresca();
                    this.capa.recalculaValoresObservados();
                    window.geoportal.mapa.dibujaObjetos();
                    window.geoportal.mapa.callDibujaLeyendas();
                },
                onChange:_ => {
                    this.refresca();
                    this.capa.recalculaValoresObservados();
                }
            })
        });
        this.cntObserva.findAll(".selectorLeyenda").forEach(selector => {
            selector.onclick = _ => {
                let indice = parseInt(selector.getAttribute("data-indice"));
                this.capa.observa[indice].leyenda = !this.capa.observa[indice].leyenda;
                this.refresca();
                window.geoportal.mapa.dibujaLeyendas();
            }
        })
        this.cntObserva.findAll(".selectorColorear").forEach(selector => {
            selector.onclick = _ => {
                let indice = parseInt(selector.getAttribute("data-indice"));
                let nuevoValor = !this.capa.observa[indice].colorear;
                this.capa.observa.forEach((o, i) => {
                    if (i == indice) o.colorear = nuevoValor;
                    else o.colorear = false;
                });
                this.refresca();
                this.capa.colorea();
            }
        })
        if (this.capa.observa && this.capa.observa.find(o => o.colorear)) {
            this.cntEscala.show();
        } else {
            this.cntEscala.hide();
        }
        this.edTipoEscala.value = this.config.escala.nombre;
        this.edAutomatica.checked = this.config.escala.dinamica;
        if (this.config.escala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        if (this.config.escala.min !== undefined) this.edMin.value = this.config.escala.min;
        if (this.config.escala.max !== undefined) this.edMax.value = this.config.escala.max;
        if (this.config.escala.min !== undefined) {
            this.escala.actualizaLimites(this.config.escala.min, this.config.escala.max);
            this.escala.refrescaPreview($(this.previewEscala.view));
        }
    }

    onEdHPos_change() {
        this.config.leyenda.hPos = this.edHPos.value;
        window.geoportal.mapa.dibujaLeyendas();
    }
    onEdVPos_change() {
        this.config.leyenda.vPos = this.edVPos.value;
        window.geoportal.mapa.dibujaLeyendas();
    }
    informaCambioEscala() {
        this.capa.colorea();
    }
    onEdAutomatica_change() {
        this.config.escala.dinamica = this.edAutomatica.checked;
        if (this.config.escala.dinamica) {
            this.edMin.disable();
            this.edMax.disable();
        } else {
            this.edMin.enable();
            this.edMax.enable();
        }
        this.informaCambioEscala();
    }
    onEdMin_change() {
        let v = parseFloat(this.edMin.value);
        if (!isNaN(v)) this.config.escala.min = v;
        this.informaCambioEscala();
    }
    onEdMax_change() {
        let v = parseFloat(this.edMax.value);
        if (!isNaN(v)) this.config.escala.max = v;
        this.informaCambioEscala();
    }
    async onEdTipoEscala_change() {
        this.config.escala.nombre = this.edTipoEscala.value;
        this.escala = await EscalaGeoportal.porNombre(this.config.escala.nombre);
        this.escala.actualizaLimites(this.config.escala.min, this.config.escala.max);
        this.escala.refrescaPreview($(this.previewEscala.view));
        this.informaCambioEscala();
    }
}
ZVC.export(CapaObserva);