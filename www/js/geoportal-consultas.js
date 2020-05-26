const descTempos = {
    "5m":"cada 5 minutos", "15m":"cada 15 minutos", "30m":"cada 30 minutos",
    "1h":"por hora", "6h":"cada 6 horas", "12h":"cada 12 horas",
    "1d":"diario", 
    "1M":"mensual", "3M":"trimestral", "4M":"cuatrimestral", "6M":"semestral",
    "1y":"anual"
}
const descAcums = {
    "n":"nº muestras", "sum":"acumulado", "avg":"promedio", "min":"mínimo", "max":"máximo"
}
const nivelesTemporalidad = ["5m", "15m", "30m", "1h", "6h", "12h", "1d", "1M", "3M", "4M", "6M", "1y"];

class ConsultaGeoportal {
    static fromItemArbol(item) {
        if (item.tipo == "queryMinZ") {
            let q = {
                tipo:"queryMinZ",
                codigo:item.code,
                nombre:item.label,
                icono:item.icon,
                acumulador:"sum",
                temporalidad:item.item.variable.temporality,
                filtroFijo:item.item.filtroFijo,
                variable:item.item.variable,
                dimensionAgrupado:item.item.dimensionAgrupado
            };
            let v = item.item.variable;
            if (v.options && v.options.defQuery) {
                let defQ = v.options.defQuery;
                if (defQ.accum) q.acumulador = defQ.accum;
                if (defQ.temporality) q.temporalidad = defQ.temporality;
                if (defQ.filters) q.filtros = defQ.filters.reduce((list, f) => {
                    list.push({ruta:f.path, valor:f.value});
                    return list;
                }, []);
            }
            return new ConsultaGeoportal(q)
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
            if (!c.spec.filtroFijo) c.spec.filtroFijo = {};
            s.filtroFijo = JSON.parse(JSON.stringify(c.spec.filtroFijo));
            if (!c.spec.filtros) c.spec.filtros = [];
            s.filtros = JSON.parse(JSON.stringify(c.spec.filtros));
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
    get unidad() {
        if (this.tipo == "capa") return this.variable.unidad;
        if (this.acumulador == "n") return "Nº";
        return this.variable.options.unit;
    }
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
    get temporalidad() {
        if (this.tipo == "capa") {
            return "1h";
        } else {
            return this.spec.temporalidad
        }
    }
    get filtroFijo() {return this.spec.filtroFijo || {}}
    get filtros() {
        if (!this.spec.filtros) this.spec.filtros = [];
        return this.spec.filtros;
    }
    get allFiltros() {
        let ret = [];
        if (this.filtroFijo && this.filtroFijo.ruta) {
            ret.push({filtro:this.filtroFijo, fijo:true});            
        }
        this.filtros.forEach(f => ret.push({
            filtro:f, fijo:false
        }))
        return ret;
    }
    get dimensionAgrupado() {return this.spec.dimensionAgrupado}

    esIgualA(c) {
        if (!c) return true;
        if (this.tipo != c.tipo) return false;
        if (this.tipo == "queryMinZ") {
            if (this.codigo != c.codigo || this.acumulador != c.acumulador || this.temporalidad != c.temporalidad) return false;
            if (JSON.stringify(this.filtroFijo) != JSON.stringify(c.filtroFijo)) return false;
            if (JSON.stringify(this.filtros) != JSON.stringify(c.filtros)) return false;
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
        if (this.tipo == "queryMinZ") {
            html += "<div class='row'>";
            html += "  <div class='col-sm-5 pr-0'>";
            html += "    <select id='edAcumulador" + this.id + "' class='custom-select custom-select-sm' style='font-size:80%'>";
            html += Object.keys(descAcums).reduce((html, a) => {
                return html + "<option value='" + a + "' " + (this.acumulador == a?" selected":"") + ">" + descAcums[a] + "</option>";
            }, "");
            html += "    </select>";
            html += "  </div>";
            html += "  <div class='col-sm-7 pl-1'>";
            html += "    <select id='edTemporalidad" + this.id + "' class='custom-select custom-select-sm' style='font-size:80%'>";
            let nivel = nivelesTemporalidad.indexOf(this.variable.temporality);
            html += nivelesTemporalidad.slice(nivel).reduce((html, t) => {
                return html + "<option value='" + t + "' " + (this.temporalidad == t?" selected":"") + ">" + descTempos[t] + "</option>";
            }, "");
            html += "    </select>";
            html += "  </div>";
            html += "</div>";  
            if (this.descripcionAgrupador) {
                html += `
                    <div class="row mt-1">
                        <div class="col">
                            <i class="fas fa-columns mr-2 float-left mt-1"></i>
                            <span>Agrupado por ${this.descripcionAgrupador}</span>
                        </div>
                    </div>`
            }
            let descFiltros = this.descripcionFiltros;
            if (!descFiltros) {
                console.warn("No se ha construido la descripción de filtros para la consulta");
            } else {
                if (!descFiltros.length) {
                    html += `
                    <div class="row mt-1">
                        <div class="col">
                            <i class="fas fa-filter mr-2 float-left mt-1"></i>
                            <span class="filtro-${this.id} nombre-item" data-z-clickable="true"'>Aplicar Filtros</span>
                            <i class="filtro-${this.id} fas fa-caret-right ml-1 float-right mt-1"></i>
                        </div>
                    </div>`
                } else {
                    html += "<ul style='padding-left:10px; margin-top:5px; margin-bottom:0; '>";
                    html += descFiltros.reduce((html, f, i) => {
                        html += "<li class='filtro-" + this.id + " nombre-item'>";
                        if (!i) html += "Para ";
                        else html += "y ";
                        html += f.etiqueta + "</li>";
                        return html;
                    }, "")
                    html += "</ul>";
                }
            }
        }

        return html;
    }

    refrescaNombreNivel(container, nivel) {
        container.find("#lblNivel" + this.id).textContent = this.niveles[nivel].descripcion;
    }
    registraListeners(container, listeners) {
        if (this.seleccionable && listeners.onSelecciona) {
            container.find("#nombreVar" + this.id).onclick =  _ => {
                new ZPop(container.find("#caretVar" + this.id), listeners.arbolItems, {
                    vPos:"justify-top", hPos:"right", vMargin:-4, hMargin:5, 
                    onClick:(codigo, item) => {
                        listeners.onSelecciona(ConsultaGeoportal.fromItemArbol(item));
                    }
                }).show();
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
        } else if (this.tipo == "queryMinZ") {
            let edAcumulador = container.find("#edAcumulador" + this.id);
            edAcumulador.onchange = _ => {
                this.spec.acumulador = edAcumulador.value;
                if (listeners.onChange) listeners.onChange(this);
            };
            let edTemporalidad = container.find("#edTemporalidad" + this.id);
            edTemporalidad.onchange = _ => {
                this.spec.temporalidad = edTemporalidad.value;
                if (listeners.onChange) listeners.onChange(this);
            };
            container.findAll(".filtro-" + this.id).forEach(element => {
                element.onclick = _ => {
                    container.showDialog("left/propiedades/WFiltrosMinZ", {consulta:this}, newConsulta => {
                        this.spec.filtros = JSON.parse(JSON.stringify(newConsulta.spec.filtros));
                        this.descripcionFiltros = newConsulta.descripcionFiltros;
                        this.descripcionAgrupador = newConsulta.descripcionAgrupador;
                        if (listeners.onChange) listeners.onChange(this);
                    })
                }
            })
        }
        var borrador = container.find("#delVar" + this.id);
        if (borrador) {
            borrador.onclick =  _ => {
                if (listeners.onElimina) listeners.onElimina(this);
            }
        }
    }

    async describeFiltro(filtro) {
        try {
            let clasificadoresPath = window.minz.describeRuta(this.variable, filtro.ruta);
            let st = clasificadoresPath.reduce((st, c) => {
                if (st.length) st += " => ";
                st += c.name;
                return st;
            }, "");
            let etiquetaValor;
            // Tomar datos del último clasificador para mostrar
            if (filtro.valor && filtro.valor.startsWith("${codigo-objeto}")) {
                st += " en mapa";
                etiquetaValor = "Selección en Mapa";
            } else {
                let c = clasificadoresPath[clasificadoresPath.length - 1];            
                let row = await window.minz.getValorDimension(c.dimensionCode, filtro.valor);            
                let v = row?row.name:filtro.valor;
                st += " igual a '" + v + "'";
                etiquetaValor = v;
            }
            return {etiqueta:st, etiquetaValor};
        } catch(error) {
            console.error(error);
            throw error;
        }
    }
    async construyeDescripcionFiltros() {
        try {
            let ret = [];
            if (this.tipo != "queryMinZ") throw "Consulta no es query MinZ";
            if (this.filtroFijo && this.filtroFijo.ruta) {
                let etiquetas = await this.describeFiltro(this.filtroFijo);
                ret.push({
                    etiqueta:etiquetas.etiqueta,
                    etiquetaValor:etiquetas.etiquetaValor,
                    fijo:true,
                    ruta:this.filtroFijo.ruta,
                    valor:this.filtroFijo.valor
                });
            }
            for (let i=0; i<this.filtros.length; i++) {
                let etiquetas = await this.describeFiltro(this.filtros[i]);
                ret.push({
                    etiqueta:etiquetas.etiqueta,
                    etiquetaValor:etiquetas.etiquetaValor,
                    fijo:false,
                    ruta:this.filtros[i].ruta,
                    valor:this.filtros[i].valor
                });
            }
            this.descripcionFiltros = ret;
            if (this.dimensionAgrupado) {
                this.descripcionAgrupador = (await this.describeFiltro({ruta:this.dimensionAgrupado, valor:"${codigo-objeto}"})).etiqueta
            } else {
                this.descripcionAgrupador = null;
            }
        } catch(error) {
            console.error(error);
            this.descripcionFiltros = null;
        }
    }

    construyeArbolFiltrosDesde(nodos, dimOVar, path0, x0, y0, subArbolHabilitado, max) {
        if (max.x === undefined || x0 > max.x) max.x = x0;
        let dimensiones = window.minz.dimensiones;
        let y = y0;
        for (let i=0; i<dimOVar.classifiers.length; i++) {
            let c = dimOVar.classifiers[i];
            let nodo = {
                x:x0, y:y, clasificador:c, editable:subArbolHabilitado
            }
            if (max.y === undefined || y > max.y) max.y = y;
            let path = path0 + (path0.length?".":"") + c.fieldName;
            nodo.ruta = path;
            let filtro = this.allFiltros.find(f => f.filtro.ruta == path);
            if (filtro) {
                nodo.filtro = filtro.filtro;
                if (filtro.fijo) nodo.editable = false;
                let desc = this.descripcionFiltros.find(f => f.ruta == path);
                nodo.descripcionFiltro = desc;
            } else if (subArbolHabilitado) {
                // Si es parte de la ruta del filtro fijo, se deshabilita
                if (this.allFiltros.find(f => f.fijo && f.filtro.ruta.startsWith(path))) {
                    nodo.editable = false;
                }
            }
            let dim = dimensiones.find(d => d.code == c.dimensionCode);
            if (!dim) throw "No se encontró la dimensión '" + c.dimensionCode + "' desde " + dimOVar.name;
            if (dim.classifiers && dim.classifiers.length) {
                nodo.nodos = [];
                y = this.construyeArbolFiltrosDesde(nodo.nodos, dim, path, x0 + 1, y, nodo.editable && !nodo.filtro, max);
            } else {
                y++;
            }
            nodos.push(nodo);
        }
        return y;
    }
    getArbolFiltros() {
        let nodos = [], max = {x:undefined, y:undefined};
        this.construyeArbolFiltrosDesde(nodos, this.variable, "", 1, 0, true, max);
        return {max:max, nodos:nodos};
    }

    agregaFiltro(ruta, valor) {
        // Eliminar filtros existentes en subarbol
        this.filtros.filter(f => f.ruta.startsWith(ruta + ".")).forEach(f => this.eliminaFiltro(f));

        this.filtros.push({ruta:ruta, valor:valor});        
    }
    eliminaFiltro(filtro) {
        let idx = this.filtros.findIndex(f => f.ruta == filtro.ruta);
        if (idx < 0) {
            throw "No se encontró el filtro por " + filtro.ruta;
        }
        this.filtros.splice(idx, 1);
    }

    // Queries
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
            // Cambiar filtro fijo para usar objeto
            let ff = JSON.parse(JSON.stringify(this.filtroFijo));
            ff.valor = objeto.getCodigoDimension();
            let query = {tipoQuery:"time-serie", filtroFijo:ff, filtros:this.filtros, variable:this.variable, acumulador:this.acumulador, temporalidad:this.temporalidad}
            if (mensajes) {
                let p = this.variable.code.indexOf(".");
                mensajes.addOrigen(this.variable.code.substr(0,p));
            }
            return new Promise((resolve, reject) => {
                window.minz.query(query, t0, t1)
                .then(res => {
                    if (res === null || res === undefined) {
                        if (mensajes) mensajes.addError(this.variable.name + ": Sin Datos para el período");
                        this.resultado = {error:"Sin Datos para el Período"}
                        reject("Sin Datos para el Período");
                    } else {
                        let serie = res.reduce((serie, v) => {
                            let m = moment.tz(window.timeZone);
                            m.year(v.localTime.year);
                            m.month(v.localTime.month - 1);
                            m.date(v.localTime.day);
                            m.hour(v.localTime.hour);
                            m.minute(v.localTime.minute);
                            m.seconds(0);
                            m.milliseconds(0);
                            serie.push({x:m.valueOf(), y:v.resultado, atributos:{Tiempo:m.valueOf()}});
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
            let query = {tipoQuery:"period-summary", filtroFijo:this.filtroFijo, filtros:this.filtros, variable:this.variable, acumulador:this.acumulador}
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
            let query = {tipoQuery:"dim-serie", dimensionAgrupado:this.dimensionAgrupado, filtros:this.filtros, variable:this.variable, acumulador:this.acumulador}
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