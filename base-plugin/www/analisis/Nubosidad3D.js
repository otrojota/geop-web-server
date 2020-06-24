class RectArea3D extends ZCustomController {
    get config() {
        if (!this.objeto) return null;
        return this.objeto.configAnalisis.analizadores["nubosidad-3d"];
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
        this.objeto = objeto;        
        let infoVarPorcentajeNubosidad = window.geoportal.getInfoVarParaConsulta("gfs4.TCDC_HP", this.objeto);
        let infoVars = [
            window.geoportal.getInfoVarParaConsulta("fixed.BATIMETRIA_2019", this.objeto),
            infoVarPorcentajeNubosidad, infoVarPorcentajeNubosidad, infoVarPorcentajeNubosidad, infoVarPorcentajeNubosidad, infoVarPorcentajeNubosidad
        ];
        let niveles = [0, 0, 1, 2, 3, 4];
        this.alturas = [-1, 10000, 5000, 3000, 1500, 0]
        this.datas = null;
        this.analizador.mensajes.clear();
        let promises = [];
        for (let i=0; i<infoVars.length; i++) {
            let infoVar = infoVars[i];
            let nivel = niveles[i];
            this.analizador.mensajes.addOrigen(infoVar.variable.origen);
            promises.push(
                new Promise((resolve, reject) => {
                    infoVar.capaQuery.resuelveConsulta("matrizRectangular", {
                        codigoVariable:infoVar.codigoVariable,
                        lng0:this.objeto.lng0, lat0:this.objeto.lat0,
                        lng1:this.objeto.lng1, lat1:this.objeto.lat1,
                        time:window.geoportal.tiempo,
                        levelIndex:nivel
                    }, (error, data) => {
                        if (error) {
                            this.analizador.mensajes.addError(error.toString());
                            console.error(error);
                            reject(error);
                            return;
                        } 
                        this.analizador.mensajes.parse(data);
                        resolve(data);
                    });
                })
            )
        }
        try {
            this.options.contenedor.iniciaTrabajando();
            console.log("consultando ...");
            this.datas = await Promise.all(promises);
            this.options.contenedor.finalizaTrabajando();
        } catch(error) {
            console.error(error);
            this.options.contenedor.finalizaTrabajando();
            return;
        }
        this.refrescaGrafico();
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
            let datas = this.datas;
            let baseURL = window.location.origin + window.location.pathname;
            if (baseURL.endsWith("/")) baseURL = baseURL.substr(0, baseURL.length - 1);
            let escalaBatimetria = await EscalaGeoportal.porNombre("Agua -> Tierra", baseURL);
            escalaBatimetria.dinamica = true;
            escalaBatimetria.actualizaLimites(datas[0].min, datas[0].max);
            let escalaNubes = await EscalaGeoportal.porNombre("Transparencia Lineal", baseURL);
            escalaNubes.dinamica = false;
            escalaNubes.actualizaLimites(0, 100);
            let serieDatas = [];
            let minLng, maxLng, minLat, maxLat, minAltura;
            for (let i=0; i<datas.length; i++) {
                let data = datas[i];
                let serieData = [];
                for (let iLat=0, lat=data.yllcorner; iLat<data.rows.length; iLat++, lat += data.dy) {
                    let row = data.rows[iLat];
                    for (let iLng=0, lng=data.xllcorner; iLng<row.length; iLng++, lng += data.dx) {
                        if (i == 0) {
                            serieData.push([lng, lat, row[iLng]]);
                            if (minAltura === undefined || row[iLng] < minAltura) minAltura = row[iLng];
                        } else {
                            serieData.push([lng, lat, this.alturas[i], row[iLng]]);
                        }
                    }
                }
                let lng0 = data.xllcorner, lng1 = data.xllcorner + data.ncols * data.dx;
                let lat0 = data.yllcorner, lat1 = data.yllcorner + data.nrows * data.dy;
                if (minLng === undefined || lng0 < minLng) minLng = lng0;
                if (maxLng === undefined || lng1 > maxLng) maxLng = lng1;
                if (minLat === undefined || lat0 < minLat) minLat = lat0;
                if (maxLat === undefined || lat1 > maxLat) maxLat = lat1;
                serieDatas.push(serieData);
            }
            let min = Math.min(minAltura, 0), max = 10000;
            let distLng = turf.distance(turf.point([minLng, (minLat + maxLat) / 2]), [maxLng, (minLat + maxLat) / 2]);
            let distLat = turf.distance(turf.point([(minLng + maxLng) / 2, minLat]), [(minLng + maxLng) / 2, maxLat]);
            let dZ = (max -min) / 1000;
            // Ajustar proporcion de acuerdo a las distancias 
            if (true) { // Escalar lat/lng
                if (distLng > distLat) {
                    let factor = (distLng - distLat) / distLat;
                    let dLat = factor * datas[0].nrows * datas[0].dy;
                    minLat -= dLat / 2;
                    maxLat += dLat / 2;
                } else {
                    let factor = (distLat - distLng) / distLng;
                    let dLng = factor * datas[0].ncols * datas[0].dx;
                    minLng -= dLng / 2;
                    maxLng += dLng / 2;
                }
                distLng = turf.distance(turf.point([minLng, (minLat + maxLat) / 2]), [maxLng, (minLat + maxLat) / 2]);
                distLat = turf.distance(turf.point([(minLng + maxLng) / 2, minLat]), [(minLng + maxLng) / 2, maxLat]);                
            }
            let kmLng = GeoPortal.round(distLng, 2).toLocaleString();
            let kmLat = GeoPortal.round(distLat, 2).toLocaleString();
            let area = distLng * distLat;
            let kmArea = GeoPortal.round(area, 2).toLocaleString();
            this.analizador.mensajes.addInformacion("Superficie Calculada en Gráfico:" + kmLng + "[lng] x " + kmLat + "[lat] = " + kmArea + "[km2]");
            let kmZ = GeoPortal.round(dZ, 2).toLocaleString();
            this.analizador.mensajes.addInformacion("Altura Proporcional:" + kmZ + "[km]");

            let titulo = "Capas de Nubosidad";
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
                series: serieDatas.reduce((list, serieData, i) => {
                    list.push({
                        type: 'surface',
                        silent: true,
                        wireframe: {
                            show: true
                        },
                        itemStyle: {
                            color: params => {
                                if (i == 0) {
                                    let z = params.data[2];
                                    return escalaBatimetria.getColor(z);
                                } else {
                                    let z = params.data[3];
                                    return escalaNubes.getColor(z);
                                }
                            }
                        },
                        data: serieData,
                        shading: 'realistic',
                        realisticMaterial: {
                            roughness: 0.1,
                            metalness: 0.5
                        }
                    });
                    return list;
                }, [])
            }
            if (!this.chart) {
                this.doResize();
                this.chart = echarts.init(this.grafico.view);
                this.chart.setOption(options);
            } else {
                let changedOptions = {
                    xAxis3D:options.xAxis3D,
                    yAxis3D:options.yAxis3D,
                    zAxis3D:options.zAxis3D,
                    series:options.series,
                    title:options.title
                }
                this.chart.setOption(changedOptions);
            }
        } catch(error) {
            throw error;
        }
    }
}
ZVC.export(RectArea3D);