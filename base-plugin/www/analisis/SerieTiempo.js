class SerieTiempo extends ZCustomController {
    get config() {
        if (!this.objeto) return null;
        return this.objeto.configAnalisis.analizadores["serie-tiempo"];
    }
    get analizador() {return this.options.analizador}
    onThis_init(options) {
        this.options = options;
        this.t0 = null; this.t1 = null;
        this.var1 = null; this.serie1 = null;
        this.var2 = null; this.serie2 = null;
        this.lat = null; this.lng = null;
        this.grafico = null;
    }
    doResize() {
        let size = this.size;        
        this.divGrafico.size = size;
        if (this.grafico) this.grafico.setSize(size.width, size.height);
    }
    async refresca(objeto) {
        this.options.contenedor.iniciaTrabajando();
        this.objeto = objeto;
        let cambioVar1 = false, cambioVar2 = false;
        let cambioTiempo = false;
        let centroide = objeto.getCentroide();
        let cambioPosicion = centroide.lat != this.lat || centroide.lng != this.lng;
        this.lat = centroide.lat;
        this.lng = centroide.lng;
        let recrearGrafico = this.grafico?false:true;
        let tiempo = this.config.tiempo;
        if (tiempo.tipo == "relativo") {
            let tPortal = TimeUtils.fromUTCMillis(window.geoportal.tiempo), t0, t1;
            tPortal.hours(0); tPortal.minutes(0); tPortal.seconds(0); tPortal.milliseconds(0);
            if (this.config.tiempo.temporalidad == "1d") {
               t0 = tPortal.clone();
               t0.date(t0.date() + tiempo.from);
               t1 = tPortal.clone();
               t1.date(t1.date() + tiempo.to + 1); t1.milliseconds(t1.milliseconds() - 1); // Fin del día anterior
               t0 = t0.valueOf();
               t1 = t1.valueOf();
            } else if (this.config.tiempo.temporalidad == "1M") {
                tPortal.date(1);
                t0 = tPortal.clone();
                t0.month(t0.month() + tiempo.from);
                t1 = tPortal.clone();
                t1.month(t1.month() + tiempo.to + 1); t1.milliseconds(t1.milliseconds() - 1); // Fin del día anterior
                t0 = t0.valueOf();
                t1 = t1.valueOf();
            } else if (this.config.tiempo.temporalidad == "1y") {
                tPortal.date(1); tPortal.month(0);
                t0 = tPortal.clone();
                t0.year(t0.year() + tiempo.from);
                t1 = tPortal.clone();
                t1.year(t1.year() + tiempo.to + 1); t1.milliseconds(t1.milliseconds() - 1); // Fin del día anterior
                t0 = t0.valueOf();
                t1 = t1.valueOf();
             } else throw "temporalidad " + this.config.tiempo.temporalidad + " no está manejada en serie de tiempo";
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
        if (this.analizador.variable) {
            if (this.var1) {
                cambioVar1 = !this.analizador.variable.esIgualA(this.var1);
            } else {
                cambioVar1 = true;
            }
        } else {
            cambioVar1 = true;
        }
        if (this.analizador.variable2) {
            if (this.var2) {
                cambioVar2 = !this.analizador.variable2.esIgualA(this.var2);
            } else {
                cambioVar2 = true;
            }
        } else {
            cambioVar2 = true;
        }
        if (cambioVar1 || cambioVar2) recrearGrafico = true;

        //console.log("cambio var1, var2, tiempo, posicion", cambioVar1, cambioVar2, cambioTiempo, cambioPosicion);

        if (cambioVar1 || cambioVar2 || cambioTiempo || cambioPosicion) {
            this.analizador.mensajes.clear();
            if (!(this.objeto instanceof Punto)) {
                if (this.analizador.variable && this.analizador.variable.tipo == "capa" || this.analizador.variable2 && this.analizador.variable2.tipo == "capa") {
                    this.analizador.mensajes.addAdvertencia(`El objeto seleccionado no es un punto. Se muestran valores para su centroide, ubicado en [lat:${this.objeto.getCentroide().lat}, lng:${this.objeto.getCentroide().lng}]`);
                }
            }
            this.var1 = this.analizador.variable?this.analizador.variable.clona():null;
            this.var2 = this.analizador.variable2?this.analizador.variable2.clona():null;
            if (this.var1) {
                promesas.push(this.var1.getSerieTiempo(this.t0, this.t1, this.objeto, this.analizador.mensajes));
            }
            if (this.var2) {
                promesas.push(this.var2.getSerieTiempo(this.t0, this.t1, this.objeto, this.analizador.mensajes));
            }
            try {
                let res = await Promise.all(promesas);    
                this.serie1 = res[0];    
                this.serie2 = res[1];
                this.refrescaGrafico(recrearGrafico);
            } catch(error) {
                console.error(error);
            } finally {
                this.options.contenedor.finalizaTrabajando();
            }
        } else {
            this.options.contenedor.finalizaTrabajando();
        }
    }

    refrescaGrafico(recrear) {
        //("refrescaGrafico:" + recrear);
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
                let variable = this.var1;
                this.capas.push(variable);
                titulo = variable.nombre;
                if (variable.niveles && variable.niveles.length > 1) titulo += " [" + variable.niveles[variable.nivel].descripcion + "]";
                series.push({
                    type:"area",
                    name:titulo,
                    data:this.serie1,
                    turboThreshold: 0
                });
                yAxis.push({id:"primario", title:{text:variable.unidad}});
            }
            if (this.var2) {
                let variable = this.var2;
                this.capas.push(variable);
                let requiereEjeSecundario = false;
                if (series.length && yAxis[0].title.text != variable.unidad) {
                    requiereEjeSecundario = true;
                    yAxis.push({id:"secundario", title:{text:variable.unidad}, opposite:true});
                } else if (!series.length) {
                    yAxis.push({id:"primario", title:{text:variable.unidad}});
                }
                if (!series.length) {
                    titulo = variable.nombre;
                    if (variable.niveles && variable.niveles.length > 1) titulo += " [" + variable.niveles[variable.nivel].descripcion + "]";
                } else {
                    subtitulo = "v/s " + variable.nombre;
                    if (variable.niveles && variable.niveles.length > 1) subtitulo += " [" + variable.niveles[variable.nivel].descripcion + "]";
                }                
                series.push({
                    type:"spline",
                    name:variable.nombre + (variable.niveles && variable.niveles.length > 1?variable.niveles[variable.nivel]:""),
                    data:this.serie2,
                    turboThreshold: 0,
                    yAxis:requiereEjeSecundario?"secundario":"primario"
                })
            }
            if (!this.grafico) {
                let self = this;
                let options = {
                    title:{text:this.objeto.nombre + ": " + titulo},
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
                                icono = capa.icono,
                                atributos = this.point.atributos
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
                            
                            let valor = GeoPortal.round(this.y, capa.decimales).toLocaleString() + " [" + capa.unidad + "]";
                            html += "<tr>";
                            html += "<td class='icono-tooltip-invert'><img src='" + icono + "' width='14px' /></td>";
                            html += "<td class='propiedad-tooltip'>Valor:</td>";
                            html += "<td class='valor-tooltip'>" + valor + "</td>";
                            html += "</tr>";
                           if (atributos) {
                                Object.keys(atributos).forEach(att => {
                                    let valor = atributos[att];
                                    let icono = "fa-tag";
                                    if (att.toLowerCase().indexOf("tiempo") >= 0) {
                                        let dt = moment.tz(valor, window.timeZone);
                                        if (dt.isValid()) {
                                            valor = dt.format("DD/MMM/YYYY HH:mm");
                                            icono = "fa-clock";
                                        }
                                    }
                                    if (att.toLowerCase().indexOf("modelo") >= 0) icono = "fa-square-root-alt";
                                    if (typeof valor == "string" && valor.length > 25) valor = valor.substr(0,20) + "...";
                                    html += "<tr>";
                                    html += "<td class='icono-tooltip'><i class='fas fa-lg " + icono + "'></i></td>";
                                    html += "<td class='propiedad-tooltip'>" + att + ":</td>";
                                    html += "<td class='valor-tooltip'>" + valor + "</td>";
                                    html += "</tr>";
                                });
                                if (atributos.realLng && atributos.realLat) {
                                    window.geoportal.mapa.dibujaPuntoDatos(self.objeto.getCentroide().lat, self.objeto.getCentroide().lng, atributos.realLat, atributos.realLng, 3000);
                                }
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