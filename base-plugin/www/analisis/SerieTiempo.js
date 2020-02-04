class SerieTiempo extends ZCustomController {
    get config() {
        if (!this.objeto) return null;
        return this.objeto.configAnalisis.analizadores["serie-tiempo"];
    }
    onThis_init(options) {
        this.options = options;
        this.t0 = null; this.t1 = null;
        this.var1 = null; this.nivelVar1 = null; this.serie1 = null;
        this.var2 = null; this.nivelVar2 = null; this.serie2 = null;
        this.lat = null; this.lng = null;
        this.grafico = null;
    }
    doResize() {
        let size = this.size;        
        this.divGrafico.size = size;
        if(this.grafico) this.grafico.setSize(size.width, size.height);
    }
    async refresca(objeto) {
        this.options.contenedor.iniciaTrabajando();
        this.objeto = objeto;        
        let cambioVar1 = false, cambioVar2 = false;
        let cambioTiempo = false;
        let cambioPosicion = this.objeto.lat != this.lat || this.objeto.lng != this.lng;
        this.lat = this.objeto.lat;
        this.lng = this.objeto.lng;
        let recrearGrafico = this.grafico?false:true;
        let tiempo = this.config.tiempo;
        if (tiempo.tipo == "relativo") {
            let tPortal = TimeUtils.fromUTCMillis(window.geoportal.tiempo);
            let t0 = tPortal + (tiempo.from * 24 * 60 * 60 * 1000);
            let t1 = tPortal + ((tiempo.to + 1) * 24 * 60 * 60 * 1000) - 1; // fin del día
            if (t0 != this.t0 || t1 != this.t1) {
                this.t0 = t0;
                this.t1 = t1;
                cambioTiempo = true;
            }
        } else {
            let t0 = tiempo.fromDate;
            let t1 = tiempo.toDate;
            if (t0 != this.t0 || t1 != this.t1) {
                this.t0 = t0;
                this.t1 = t1;
                cambioTiempo = true;
            }
        }
        let promesas = [];
        // Var1
        let var1 = this.config.variable, nivelVar1 = this.config.nivelVariable;
        if (var1 != this.var1) recrearGrafico = true;
        cambioVar1 = var1 != this.var1 || nivelVar1 != this.nivelVar1;
        if (cambioVar1 || cambioTiempo || cambioPosicion) {
            this.var1 = var1; this.nivelVar1 = nivelVar1; this.serie1 = null;
            if (this.var1) {
                let defCapa = window.geoportal.capasDisponibles[this.var1];
                let capa = new Capa(defCapa);
                promesas.push(new Promise((resolve, reject) => {
                    capa.resuelveConsulta("serieTiempo", {
                        codigoVariable:defCapa.codigo,
                        lat:this.objeto.lat, lng:this.objeto.lng,
                        levelIndex:this.nivelVar1,
                        time0:this.t0, time1:this.t1
                    }, (err, result) => {
                        if (err) {reject(err); return;}
                        let serie = result.data.reduce((lista, punto) => {
                            lista.push({x:punto.time, y:punto.value, metadata:punto.metadata})
                            return lista;
                        }, [])                    
                        resolve(serie);                    
                    })
                }));
            }
        }
        // Var2
        let var2 = this.config.variable2, nivelVar2 = this.config.nivelVariable2;
        if (var2 != this.var2) recrearGrafico = true;
        cambioVar2 = var2 != this.var2 || nivelVar2 != this.nivelVar2;
        if (cambioVar2 || cambioTiempo || cambioPosicion) {
            this.var2 = var2; this.nivelVar2 = nivelVar2; this.serie2 = null;
            if (this.var2) {
                let defCapa = window.geoportal.capasDisponibles[this.var2];
                let capa = new Capa(defCapa);
                promesas.push(new Promise((resolve, reject) => {
                    capa.resuelveConsulta("serieTiempo", {
                        codigoVariable:defCapa.codigo,
                        lat:this.objeto.lat, lng:this.objeto.lng,
                        levelIndex:this.nivelVar2,
                        time0:this.t0, time1:this.t1
                    }, (err, result) => {
                        if (err) {reject(err); return;}
                        let serie = result.data.reduce((lista, punto) => {
                            lista.push([punto.time, punto.value])
                            return lista;
                        }, [])                    
                        resolve(serie);                    
                    })
                }));
            }
        }

        try {
            let res = await Promise.all(promesas);        
            if (cambioTiempo || cambioPosicion) {
                if (this.var1) {
                    this.serie1 = res[0];
                    if (this.var2) {
                        this.serie2 = res[1];
                    }
                } else if (this.var2) {
                    this.serie2 = res[0];
                }
            } else if (cambioVar1 && this.var1) {
                this.serie1 = res[0];
                if (cambioVar2 && this.var2) {
                    this.serie2 = res[1];
                }
            } else if (cambioVar2 && this.var2) {
                this.serie2 = res[0];
            }
            this.refrescaGrafico(recrearGrafico);
        } catch(error) {
            console.error(error);
        } finally {
            this.options.contenedor.finalizaTrabajando();
        }
    }

    refrescaGrafico(recrear) {
        if (this.grafico && recrear) {
            this.divGrafico.html = "";
            this.grafico = null;
        }
        try {
            let titulo = null, subtitulo = null;
            let series = [];
            let yAxis = [];
            this.capas = [];
            if (this.var1) {
                let capa = window.geoportal.capasDisponibles[this.var1];
                this.capas.push(capa);
                titulo = capa.nombre;
                if (capa.niveles && capa.niveles.length > 1) titulo += " [" + capa.niveles[this.nivelVar1].descripcion + "]";
                series.push({
                    type:"area",
                    name:titulo,
                    data:this.serie1
                });
                yAxis.push({id:"primario", title:{text:capa.unidad}});
            }
            if (this.var2) {
                let capa = window.geoportal.capasDisponibles[this.var2];
                this.capas.push(capa);
                let requiereEjeSecundario = false;
                if (series.length && yAxis[0].title.text != capa.unidad) {
                    requiereEjeSecundario = true;
                    yAxis.push({id:"secundario", title:{text:capa.unidad}, opposite:true});
                } else if (!series.length) {
                    yAxis.push({id:"primario", title:{text:capa.unidad}});
                }
                if (!series.length) {
                    titulo = capa.nombre;
                    if (capa.niveles && capa.niveles.length > 1) titulo += " [" + capa.niveles[this.nivelVar2].descripcion + "]";
                } else {
                    subtitulo = "v/s " + capa.nombre;
                    if (capa.niveles && capa.niveles.length > 1) subtitulo += " [" + capa.niveles[this.nivelVar2].descripcion + "]";
                }                
                series.push({
                    type:"spline",
                    name:capa.nombre + (capa.niveles && capa.niveles.length > 1?capa.niveles[this.nivelVar2]:""),
                    data:this.serie2,
                    yAxis:requiereEjeSecundario?"secundario":"primario"
                })
            }
            if (!this.grafico) {
                let self = this;
                let options = {
                    title:{text:titulo},
                    subtitle:subtitulo?{text:subtitulo}:undefined,
                    xAxis:{type:"datetime"},
                    yAxis:yAxis,
                    legend:{enabled:false},
                    plotOptions: {
                        area: {
                            fillColor: {
                                linearGradient: {x1: 0,y1: 0,x2: 0,y2: 1},
                                stops: [
                                    [0, Highcharts.getOptions().colors[0]],
                                    [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                                ]
                            },
                            marker: {radius: 2},
                            lineWidth: 1,
                            states: {hover: {lineWidth: 1}},
                            threshold: null
                        }
                    },
                    series:series,
                    credits: {
                        enabled: false
                    },   
                    tooltip:{
                        useHTML:true,
                        formatter:function()  {
                            let capa = self.capas[this.series.index];
                            let nombre = capa.nombre,
                                nombreNivel = (capa.niveles && capa.niveles.length > 1?capa.niveles[this.nivelVar2]:""),
                                origen = window.geoportal.origenes[capa.origen],
                                codigoCapa = capa.codigoProveedor + "." + capa.codigo, 
                                unidad = capa.unidad,
                                icono = capa.urlIcono,
                                metadata = this.metadata,
                                modelo = (metadata && metadata.modelo)?metadata.modelo:null;
                            let html = "<div class='tooltip-contenido'>";
                            html += "<div class='tooltip-titulo'>" + nombre + "</div>";
                            if (nombreNivel) html += "<div class='tooltip-subtitulo'>" + nombreNivel + "</div>";
                            html += "<hr class='my-1 bg-white' />";
                            html += "<div class='tooltip-contenido'>";
                            html += "<table class='w-100'>";
                            html += "<tr>";
                            html += "<td class='icono-tooltip'><img src='" + origen.icono + "' width='14px' /></td>";
                            html += "<td class='propiedad-tooltip'>Origen:</td>";
                            html += "<td class='valor-tooltip'>" + origen.nombre + "</td>";
                            html += "</tr>";
                            
                            let tiempo = TimeUtils.fromUTCMillis(this.x);
                            html += "<tr>";
                            html += "<td class='icono-tooltip'><i class='fas fa-lg fa-clock'></i></td>";
                            html += "<td class='propiedad-tooltip'>Tiempo:</td>";
                            html += "<td class='valor-tooltip'>" + tiempo.format("DD/MMM/YYYY HH:mm") + "</td>";
                            html += "</tr>";

                            let valor = window.geoportal.formateaValor(codigoCapa, this.y) + " [" + unidad + "]";
                            html += "<tr>";
                            html += "<td class='icono-tooltip-invert'><img src='" + icono + "' width='14px' /></td>";
                            html += "<td class='propiedad-tooltip'>Valor:</td>";
                            html += "<td class='valor-tooltip'>" + valor + "</td>";
                            html += "</tr>";

                            if (modelo) {
                                html += "<tr>";
                                html += "<td class='icono-tooltip'><i class='fas fa-lg fa-square-root-alt'></i></td>";
                                html += "<td class='propiedad-tooltip'>Ejecución Modelo:</td>";
                                html += "<td class='valor-tooltip'>" + modelo + "</td>";
                                html += "</tr>";
                            }

                            html += "</table>";
                            html += "</div>";
                            html += "</div>";
                            return html;
                        }
                    }                                    
                }
                this.grafico = Highcharts.chart(this.divGrafico.view, options);  
                this.doResize();
            } else {
                series.forEach((serie, i) => this.grafico.series[i].setData(serie.data));
                if (titulo) this.grafico.setTitle({text:titulo});
                if (subtitulo) this.grafico.setSubtitle({text:subtitulo});
            }
        } catch(error) {
            console.trace(error);
        }
    }
}
ZVC.export(SerieTiempo);