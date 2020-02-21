class RectArea3D extends ZCustomController {
    get config() {
        if (!this.objeto) return null;
        return this.objeto.configAnalisis.analizadores["rect-area-3d"];
    }
    get analizador() {return this.options.analizador}
    onThis_init(options) {
        this.options = options; 
        
    }
    doResize() {
        let size = this.size;        
        this.grafico.size = size;
        if (this.chart) {
            this.options.contenedor.iniciaTrabajando();
            this.chart.resize(size);
            this.options.contenedor.finalizaTrabajando();
        }
    }
    async refresca(objeto) {
        this.options.contenedor.iniciaTrabajando();
        this.objeto = objeto;        
        let infoVar = window.geoportal.getInfoVarParaConsulta(this.config.variable, this.objeto);
        this.analizador.mensajes.clear();
        this.analizador.mensajes.addOrigen(infoVar.variable.origen);
        return new Promise((resolve, reject) => {
            infoVar.capaQuery.resuelveConsulta("matrizRectangular", {
                codigoVariable:infoVar.codigoVariable,
                lng0:this.objeto.lng0, lat0:this.objeto.lat0,
                lng1:this.objeto.lng1, lat1:this.objeto.lat1,
                time:window.geoportal.tiempo,
                levelIndex:this.config.nivelVariable
            }, (error, data) => {
                if (error) {
                    this.options.contenedor.finalizaTrabajando();
                    this.analizador.mensajes.addError(error.toString());
                    console.error(error);
                    reject(error);
                    return;
                } 
                this.analizador.mensajes.parse(data);
                this.data = data;
                this.infoVar = infoVar;
                this.refrescaGrafico()
                    .then(_ => resolve())
                    .catch(err => {
                        this.analizador.mensajes.addError(err.toString());
                        reject(err)
                    })
                    .finally(_ => this.options.contenedor.finalizaTrabajando())
            });
        });
    }

    corrigeDecimales(n) {
        const k = 100000000;
        return parseInt(n * k) / k;
    }
    async redibuja() {
        // Llamado por PanelAnalisis cuando cambia escala u otra propiedad que no requiere releer los datos
        this.analizador.mensajes.clear();
        await this.refrescaGrafico(); 
    }
    async refrescaGrafico() {
        try {
            let baseURL = window.location.origin + window.location.pathname;
            if (baseURL.endsWith("/")) baseURL = baseURL.substr(0, baseURL.length - 1);
            let escala = await EscalaGeoportal.porNombre(this.config.escala.nombre, baseURL);
            escala.dinamica = this.config.escala.dinamica;
            if (escala.dinamica) {
                this.config.escala.min = this.data.min;
                this.config.escala.max = this.data.max;
            }
            escala.actualizaLimites(this.config.escala.min, this.config.escala.max);
            let serieData = [];
            for (let iLat=0, lat=this.data.yllcorner; iLat<this.data.rows.length; iLat++, lat += this.data.dy) {
                let row = this.data.rows[iLat];
                for (let iLng=0, lng=this.data.xllcorner; iLng<row.length; iLng++, lng += this.data.dx) {
                    serieData.push([lng, lat, row[iLng]]);
                }
            }
            let min = this.data.min, max = this.data.max;
            let minLat = this.data.yllcorner, maxLat = this.data.yllcorner + this.data.nrows * this.data.dy;
            let minLng = this.data.xllcorner, maxLng = this.data.xllcorner + this.data.ncols * this.data.dx;
            let distLng = turf.distance(turf.point([minLng, (minLat + maxLat) / 2]), [maxLng, (minLat + maxLat) / 2]);
            let distLat = turf.distance(turf.point([(minLng + maxLng) / 2, minLat]), [(minLng + maxLng) / 2, maxLat]);
            let dZ = (max -min) / 1000;
            // Ajustar proporcion de acuerdo a las distancias 
            if (this.config.escalarLngLat) {
                if (distLng > distLat) {
                    let factor = (distLng - distLat) / distLat;
                    let dLat = factor * this.data.nrows * this.data.dy;
                    minLat -= dLat / 2;
                    maxLat += dLat / 2;
                } else {
                    let factor = (distLat - distLng) / distLng;
                    let dLng = factor * this.data.ncols * this.data.dx;
                    minLng -= dLng / 2;
                    maxLng += dLng / 2;
                }
                distLng = turf.distance(turf.point([minLng, (minLat + maxLat) / 2]), [maxLng, (minLat + maxLat) / 2]);
                distLat = turf.distance(turf.point([(minLng + maxLng) / 2, minLat]), [(minLng + maxLng) / 2, maxLat]);
                if (this.config.escalarZ) {
                    // distLng y distLat se asumen iguales
                    if (distLng > dZ) {
                        let factor = (distLng - dZ) / dZ;
                        min -= 1000 * factor * dZ / 2 / this.config.factorEscalaZ;
                        max += 1000 * factor * dZ / 2 / this.config.factorEscalaZ;
                    } else {
                        let factor = (dZ - distLat) / distLat;
                        let dLat = factor * this.data.nrows * this.data.dy;
                        minLat -= dLat / 2;
                        maxLat += dLat / 2;
                        factor = (dZ - distLng) / distLng;
                        let dLng = factor * this.data.ncols * this.data.dx;
                        minLng -= dLng / 2;
                        maxLng += dLng / 2;
                    }
                    distLng = turf.distance(turf.point([minLng, (minLat + maxLat) / 2]), [maxLng, (minLat + maxLat) / 2]);
                    distLat = turf.distance(turf.point([(minLng + maxLng) / 2, minLat]), [(minLng + maxLng) / 2, maxLat]);
                    dZ = (max -min) / 1000;
                }
            }
            let kmLng = GeoPortal.round(distLng, 2).toLocaleString();
            let kmLat = GeoPortal.round(distLat, 2).toLocaleString();
            let area = distLng * distLat;
            let kmArea = GeoPortal.round(area, 2).toLocaleString();
            this.analizador.mensajes.addInformacion("Superficie Calculada en Gráfico:" + kmLng + "[lng] x " + kmLat + "[lat] = " + kmArea + "[km2]");
            let kmZ = GeoPortal.round(dZ, 2).toLocaleString();
            this.analizador.mensajes.addInformacion("Altura Proporcional:" + kmZ + "[km]");

            let defVariable = window.geoportal.getVariable(this.config.variable);
            let titulo = this.infoVar.capaQuery.nombre;
            if (defVariable.niveles && defVariable.niveles.length) {
                let nivel = defVariable.niveles[this.config.nivelVariable];
                titulo += " [" + nivel.descripcion + "]";
            }
            let options = {
                title:{text:titulo},
                backgroundColor: '#fff',
                visualMapBACK: {
                    top: 10,
                    right: 10,
                    pieces: [{gte: 0, color: '#612e04'}, {lt: 0, color: '#262699'}],
                    outOfRange: {color: '#999'}
                },
                xAxis3D: {
                    type: 'value',
                    name:"Lng",
                    axisLabel:{
                        formatter:v => v.toFixed(2) + "º"
                    },                    
                    min: minLng,
                    max: maxLng
                },
                yAxis3D: {
                    type: 'value',
                    name:"Lat",
                    axisLabel:{
                        formatter:v => v.toFixed(2) + "º"
                    },
                    min: minLat,
                    max: maxLat
                },
                zAxis3D: {
                    type: 'value',
                    name:"", //titulo + " [" + this.data.unit + "]",
                    axisLabel:{
                        formatter:v => v.toFixed(defVariable.decimales) + " [" + defVariable.unidad + "]"
                    },
                    min: min,
                    max: max
                },
                grid3D: {
                    show: true,
                    axisPointer: {label:{show: true}},
                    viewControl: {distance: 200},
                    postEffect: {enable: false},
                    temporalSuperSampling: {enable: true},
                    light: {
                        main: {
                            intensity: 2,
                            shadow: true
                        },
                        ambient: {
                            intensity: 0.5
                        },
                        ambientCubemap: {
                            texture:'base/img/data-gl/canyon.hdr',
                            exposure: 2,
                            diffuseIntensity: 1,
                            specularIntensity: 1
                        }
                    }
                },
                series: [{
                    type: 'surface',
                    silent: true,
                    wireframe: {
                        show: true
                    },
                    itemStyle: {
                        color: params => {
                            let z = params.data[2];
                            return escala.getColor(z);
                        }
                    },
                    data: serieData
                }]
            }
            if (!this.chart) {
                this.doResize();
                this.chart = echarts.init(this.grafico.view);
            }
            this.chart.setOption(options);
        } catch(error) {
            throw error;
        }
    }
}
ZVC.export(RectArea3D);