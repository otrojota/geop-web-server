class ConsultaGeoportal {
    static fromItemArbol(item) {
        console.log("crea consulta desde", item);
        if (item.tipo == "queryMinZ") {
            return new ConsultaGeoportal({
                tipo:"queryMinZ",
                codigo:item.code,
                nombre:item.label,
                icono:item.icon,
                acumulador:"sum",
                temporalidad:item.item.variable.temporality,
                filtroFijo:item.item.filtroFijo,
                variable:item.item.variable,
                dimensionAgrupado:item.item.dimensionAgrupado
            })
        } else if (item.tipo == "capa") {
            let codigoVariable = item.capa.codigoProveedor + "." + item.code;
            let variable = window.geoportal.getVariable(codigoVariable);
            return new ConsultaGeoportal({
                tipo:"capa",
                codigo:codigoVariable,
                nombre:item.label,
                icono:item.icon,
                capa:item.capa,
                nivel:variable.nivelInicial,
                variable:variable
            })
        }
    }
    static creaClonDe(c) {
        let s = {
            tipo:c.tipo,
            codigo:c.codigo,
            nombre:c.nombre,
            icono:c.icono
        }
        if (c.tipo == "queryMinZ") {            
            s.acumulador = c.spec.acumulador;
            s.temporalidad = c.spec.temporalidad;
            s.filtroFijo = c.spec.filtroFijo;
            s.variable = c.spec.variable;
            s.dimensionAgrupado = c.spec.dimensionAgrupado;
        } else if (c.tipo == "capa") {
            s.capa = c.spec.capa;
            s.nivel = c.spec.nivel;
            s.variable = c.spec.variable;
        }
        return new ConsultaGeoportal(s);
    }
    static nuevaVariableCapa(codigoVariable) {
        let p = codigoVariable.indexOf(".");
        if (p < 0) throw "Código de variable inválido: debe ser proveedor.capa[.cod-objeto].variable [" + codigoVariable + "]"
        let p1 = codigoVariable.indexOf(".", p+1);
        let codigoCapa;
        if (p1 < 0) codigoCapa = codigoVariable;
        else codigoCapa = codigoVariable.substr(0, p1);
        let capa = window.geoportal.capasDisponibles[codigoCapa];
        let variable = window.geoportal.getVariable(codigoVariable);
        return new ConsultaGeoportal({
            tipo:"capa",
            codigo:codigoVariable,
            nombre:"[" + window.geoportal.getOrigen(capa.origen).nombre + "] " + variable.nombre,
            icono:variable.urlIcono,
            capa:capa,
            nivel:variable.nivelInicial,
            variable:variable
        })
    }
    static nuevoSeleccionadorVacio(titulo) {
        return new ConsultaGeoportal({
            tipo:"seleccionador",
            codigo:"seleccionar",
            nombre:titulo || "[Seleccione Variable]",
            icono:"img/iconos/buscar.svg",
            variable:{}
        })
    }
    constructor(spec) {
        this.id = "CG" + parseInt(9999999999 * Math.random());
        this.spec = spec;
        this.resultado = null;
    }
    clona() {return ConsultaGeoportal.creaClonDe(this)}

    get tipo() {return this.spec.tipo}
    get nombre() {return this.spec.nombre}
    get icono() {return this.spec.icono}
    get variable() {return this.spec.variable}
    get unidad() {return this.tipo == "capa"?this.variable.unidad:this.variable.options.unit}
    get decimales() {return this.tipo == "capa"?this.variable.decimales:this.variable.options.decimals}
    get valorFormateado() {
        if (!this.resultado) return "??";
        if (this.resultado.error) return this.resultado.error;
        if (this.resultado.tipo == "valorEnPunto") {
            let v = this.resultado.valor.value;
            return GeoPortal.round(v, this.decimales).toLocaleString() + " [" + this.unidad + "]";
        } else {
            throw "Formateo de resultado tipo " + this.resultado.tipo + " no implementado";
        }
    }    
    get capa() {return this.spec.capa}
    get origen() {        
        if (this.tipo == "capa") return this.capa.origen;
        if (this.tipo == "queryMinZ") {
            let p = this.variable.code.indexOf(".");
            return this.variable.code.substr(0,p);
        }
    }
    get nivel() {return this.spec.nivel}
    set nivel(n) {this.spec.nivel = n}
    get niveles() {return this.spec.variable.niveles}
    get codigo() {return this.spec.codigo}
    get acumulador() {return this.spec.acumulador}
    get temporalidad() {return this.spec.temporalidad}
    get filtroFijo() {return this.spec.filtroFijo || {}}
    get dimensionAgrupado() {return this.spec.dimensionAgrupado}

    esIgualA(c) {
        if (!c) return true;
        if (this.tipo != c.tipo) return false;
        if (this.tipo == "queryMinZ") {
            if (this.codigo != c.codigo || this.acumulador != c.acumulador || this.temporalidad != c.temporalidad) return false;
            if (JSON.stringify(this.filtroFijo) != JSON.stringify(c.filtroFijo)) return false;
            return true;
        } else if (this.tipo == "capa") {
            if (this.codigo != c.codigo || this.nivel != c.nivel) return false;
            return true;
        }
    }

    getHTML(seleccionable) {
        this.seleccionable = seleccionable;
        let html;
        if (this.tipo != "seleccionador") {
            html = `
            <div class="row mt-1">
                <div class="col">
                    <i id="delVar${this.id}" class="fas fa-trash-alt mr-2 float-left mt-1" data-z-clickable="true" style="cursor: pointer;"></i>
                    <img class="mr-1 float-left" height="16px" src="${this.icono}"/>
                    <span id="nombreVar${this.id}" ${seleccionable?'class="nombre-item" data-z-clickable="true"':''}>${this.nombre}</span>
                    <i id="caretVar${this.id}" class="fas fa-caret-right ml-1 float-right mt-1" ${!seleccionable?"style='display:none;'":""}></i>
                </div>
            </div>
            `;
        } else {
            html = `
            <div class="row mt-1">
                <div class="col">
                    <i class="fas fa-search mr-2 float-left mt-1"></i>
                    <span id="nombreVar${this.id}" ${seleccionable?'class="nombre-item" data-z-clickable="true"':''}>${this.nombre}</span>
                    <i id="caretVar${this.id}" class="fas fa-caret-right ml-1 float-right mt-1"></i>
                </div>
            </div>
            `;
        }
        if (this.tipo == "capa" && this.variable.niveles && this.variable.niveles.length > 1) {
            html += `
            <div class="ml-4">
                <div class="row mt-1">
                    <div class="col-4">
                        <label class="etiqueta-subpanel-propiedades mb-0">Nivel</label>
                    </div>
                    <div class="col-8">
                        <div id="edNivel${this.id}"></div>
                    </div>
                </div>
                <div class="row">
                    <div class="col">
                        <label id="lblNivel${this.id}" class="etiqueta-subpanel-propiedades mb-0">...</label>
                    </div>
                </div>
            </div>
            `;
        }

        return html;
    }

    refrescaNombreNivel(container, nivel) {
        container.find("#lblNivel" + this.id).textContent = this.niveles[nivel].descripcion;
    }
    registraListeners(container, listeners) {
        if (this.seleccionable && listeners.onSelecciona) {
            container.find("#nombreVar" + this.id).onclick =  _ => {
                new ZPop(container.find("#caretVar" + this.id), listeners.arbolItems, {vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, onClick:(codigo, item) => {
                    listeners.onSelecciona(ConsultaGeoportal.fromItemArbol(item));
                }}).show();
            }
        }
        if (this.tipo == "capa" && this.variable.niveles && this.variable.niveles.length > 1) {
            this.refrescaNombreNivel(container, this.nivel);
            let edNivel = container.find("#edNivel" + this.id);
            if (!edNivel.noUiSlider) {
                noUiSlider.create(edNivel, {
                    start: this.nivel,
                    step:1,
                    range: {'min': 0,'max': this.niveles.length - 1}
                });
            }
            edNivel.noUiSlider.on("slide", v => {
                let value = parseInt(v[0]);
                this.refrescaNombreNivel(container, value);
            });
            edNivel.noUiSlider.on("change", v => {
                let value = parseInt(v[0]);
                this.nivel = value;
                this.refrescaNombreNivel(container, value);
                if (listeners.onChange) listeners.onChange(this);
            });
        }
        var borrador = container.find("#delVar" + this.id);
        if (borrador) {
            borrador.onclick =  _ => {
                if (listeners.onElimina) listeners.onElimina(this);
            }
        }
    }

    getSerieTiempo(t0, t1, objeto, mensajes) {
        this.resultado = null;
        if (this.tipo == "capa") {
            if (mensajes) mensajes.addOrigen(this.capa.origen);            
            // quitar codigo de proveedor de la capa
            let infoVar = window.geoportal.getInfoVarParaConsulta(this.codigo, objeto);            
            return new Promise((resolve, reject) => {
                infoVar.capaQuery.resuelveConsulta("serieTiempo", {
                    codigoVariable:infoVar.codigoVariable,
                    lat:objeto.getCentroide().lat, lng:objeto.getCentroide().lng,
                    levelIndex:this.nivel,
                    time0:t0, time1:t1
                }, (err, result) => {
                    if (err) {
                        console.error(err);
                        if (mensajes) mensajes.addError(err.toString());
                        this.resultado = {error:err.toString()}
                        reject(err); 
                        return;
                    }
                    if (mensajes) mensajes.parse(result, this.nombre);
                    if (!result.data.length && mensajes) mensajes.addError(this.nombre + ": No hay datos para el período seleccionado");
                    let serie = result.data.reduce((lista, punto) => {
                        lista.push({x:punto.time, y:punto.value, atributos:punto.atributos})
                        return lista;
                    }, [])
                    this.resultado = {tipo:"serieTiempo", valor:serie};
                    resolve(serie);                    
                })
            });
        } else {
            console.log("this", this);
            // Cambiar filtro fijo para usar objeto
            let ff = JSON.parse(JSON.stringify(this.filtroFijo));
            ff.valor = objeto.getCodigoDimension();
            let query = {tipoQuery:"time-serie", filtroFijo:ff, variable:this.variable, acumulador:this.acumulador, temporalidad:this.temporalidad}
            if (mensajes) {
                let p = this.variable.code.indexOf(".");
                mensajes.addOrigen(this.variable.code.substr(0,p));
            }
            return new Promise((resolve, reject) => {
                window.minz.query(query, t0, t1)
                .then(res => {
                    console.log("res", res);
                    if (res === null || res === undefined) {
                        if (mensajes) mensajes.addError(this.variable.name + ": Sin Datos para el período");
                        this.resultado = {error:"Sin Datos para el Período"}
                        reject("Sin Datos para el Período");
                    } else {
                        let serie = res.reduce((serie, v) => {
                            serie.push({x:v.time, y:v.resultado});
                            return serie;
                        }, []);
                        this.resultado = {tipo:"serieTiempo", valor:serie};
                        resolve(serie);
                    }
                })
                .catch(err => {
                    this.resultado = {error:"Error: " + err}
                    if (mensajes) mensajes.addError(this.variable.name + ": " + err.toString());
                    reject("Error: " + err);
                })
            });
        }
    }

    getValorEnPunto(t, objeto, mensajes) {
        this.resultado = null;
        if (this.tipo == "capa") {
            let infoVar = window.geoportal.getInfoVarParaConsulta(this.codigo, objeto);            
            if (mensajes) mensajes.addOrigen(infoVar.variable.origen);
            let centroide = objeto.getCentroide();
            let query = {
                lat:centroide.lat, lng:centroide.lng, time:t,
                levelIndex:this.nivel !== undefined?this.nivel:0,
                codigoVariable:infoVar.codigoVariable,
                metadataCompleta:true
            }
            return new Promise((resolve, reject) => {
                infoVar.capaQuery.resuelveConsulta("valorEnPunto", query, (err, resultado) => {
                    if (err) {
                        this.resultado = {error:"Error: " + err}
                        if (mensajes) mensajes.addError(infoVar.variable.nombre + ": " + err.toString());
                        reject(err);
                    } else {
                        if (resultado == "S/D" || resultado == null || resultado === undefined) {
                            if (mensajes) mensajes.addError(infoVar.variable.nombre + ": Sin Datos");
                            this.resultado = {error:infoVar.variable.nombre + ": Sin Datos"}
                        } else if (typeof resultado == "string") {
                            if (mensajes) mensajes.addError(infoVar.variable.nombre + ": " + resultado);  
                            this.resultado = {error:infoVar.variable.nombre + ": " + resultado}
                        } else if (resultado && resultado.value === undefined) {
                            if (mensajes) mensajes.addError(infoVar.variable.nombre + ": Sin Datos");
                            this.resultado = {error:infoVar.variable.nombre + ": Sin Datos"}
                        } else {
                            if (mensajes) mensajes.parse(resultado, infoVar.variable.nombre);
                            this.resultado = {tipo:"valorEnPunto", valor: resultado}
                        }
                        resolve(resultado);
                    }
                });
            });
        } else {
            let {t0, t1, desc} = window.minz.normalizaTiempo(this.temporalidad, t);
            let query = {tipoQuery:"period-summary", filtroFijo:this.filtroFijo, variable:this.variable, acumulador:this.acumulador}
            if (mensajes) {
                let p = this.variable.code.indexOf(".");
                mensajes.addOrigen(this.variable.code.substr(0,p));
            }
            return new Promise((resolve, reject) => {
                window.minz.query(query, t0, t1)
                .then(valor => {
                    let atributos = {"Período":desc};
                    if (valor === null || valor === undefined) {
                        if (mensajes) mensajes.addError(this.variable.name + ": Sin Datos para el período");
                        this.resultado = {error:"Sin Datos para el Período: " + desc}
                        reject("Sin Datos para el Período: " + desc);
                    } else {
                        this.resultado = {tipo:"valorEnPunto", valor:{value:valor, atributos:atributos}}
                        resolve(this.resultado.valor);
                    }
                })
                .catch(err => {
                    this.resultado = {error:"Error: " + err}
                    if (mensajes) mensajes.addError(this.variable.name + ": " + err.toString());
                    reject("Error: " + err);
                })
            });
        }
    }
    getDimSerie(t, mensajes) {
        this.resultado = null;
        if (this.tipo == "capa") {
            throw "DimSerie aplica sólo a consultas tipo queryMinZ";
        } else {
            let {t0, t1, desc} = window.minz.normalizaTiempo(this.temporalidad, t);
            let query = {tipoQuery:"dim-serie", dimensionAgrupado:this.dimensionAgrupado, variable:this.variable, acumulador:this.acumulador}
            if (mensajes) {
                let p = this.variable.code.indexOf(".");
                mensajes.addOrigen(this.variable.code.substr(0,p));
            }
            return new Promise((resolve, reject) => {
                window.minz.query(query, t0, t1)
                .then(res => {
                    let atributos = {"Período":desc};
                    if (res === null || res === undefined) {
                        if (mensajes) mensajes.addError(this.variable.name + ": Sin Datos para el período");
                        this.resultado = {error:"Sin Datos para el Período: " + desc}
                        reject("Sin Datos para el Período: " + desc);
                    } else {
                        this.resultado = {tipo:"dimSerie", valor:res, atributos:atributos}
                        resolve(this.resultado);
                    }
                })
                .catch(err => {
                    this.resultado = {error:"Error: " + err}
                    if (mensajes) mensajes.addError(this.variable.name + ": " + err.toString());
                    reject("Error: " + err);
                })
            });
        }
    }
}