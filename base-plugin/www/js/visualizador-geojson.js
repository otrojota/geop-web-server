class VisualizadorGeoJSON extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {}
        let conf = $.extend(defaultConfig, config);
        super("geojson", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:280, width:300,
            configSubPaneles:{}
        }
        this.selectedFeature = null;        
    }
    static aplicaACapa(capa) {
        return capa.tipo == "vectorial" && capa.formatos.geoJSON;
    }
    static get hidden() {return true}

    async crea() {
        this.panelMapa = window.geoportal.mapa.creaPanelMapa(this.capa, "geojson" + parseInt(Math.random() * 10000), 6);
        this.panelMapa.style.opacity = this.capa.opacidad / 100;
        this.capa.registraPanelMapa(this.panelMapa);
        let options = {pane:this.panelMapa.id};        
        if (this.capa.config.estilos) options.style = eval("(" + this.capa.config.estilos + ")");
        this.layerDeFeatureId = {};
        options.onEachFeature = (f, layer) => {this.layerDeFeatureId[f.properties.id] = layer}
        this.lyGeoJSON = L.geoJSON([], options).addTo(window.geoportal.mapa.map);
        this.mouseListener = {
            onMouseMove:(e, puntoMapa, puntoPanel) => this.callMouseMove(e, puntoMapa, puntoPanel),
            onMouseClick:(e, puntoMapa, puntoPanel) => this.mouseClick(e, puntoMapa, puntoPanel),
        }
        window.geoportal.mapa.addMouseListener(this.mouseListener);
    }
    async destruye() {
        if (this.timerMove) clearTimeout(this.timerMove);
        window.geoportal.mapa.eliminaCapaMapa(this.lyGeoJSON);
        window.geoportal.mapa.eliminaPanelMapa(this.panelMapa);
        window.geoportal.mapa.removeMouseListener(this.mouseListener);
        if (this.selectedFeature) this.mouseLeaveFeature(this.selectedFeature);
    }

    getGeoJSON() {
        return new Promise((resolve, reject) => {
            this.capa.resuelveConsulta("geoJSON", {}, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
    }
    get tieneFiltros() {return this.geoJSON && this.geoJSON._filtros?true:false}
    get filtros() {return this.geoJSON._filtros}

    async refresca() {
        try {
            this.startWorking();
            super.refresca();
            this.lyGeoJSON.clearLayers();
            this.geoJSON = await this.getGeoJSON();
            this.featuresOriginal = this.geoJSON.features;
            if (this.geoJSON._filtros) {
                this.geoJSON._filtros.forEach(f => {f.aplica = eval("(" + f.filtro + ")")});
            }
            if (window.capasController) window.capasController.refresca();
            this.aplicaFiltros();
            //console.log("geoJSON", this.geoJSON);
            this.repinta();
            if (this.geoJSON.vistaInicial) {
                window.geoportal.mapa.setCenter(this.geoJSON.vistaInicial.lat, this.geoJSON.vistaInicial.lng, this.geoJSON.vistaInicial.zoom);
            }
        } catch(error) {
            this.mensajes.addError(error.toString());
            console.error(error);
        } finally {
            this.finishWorking();
        }
    }

    aplicaFiltros() {
        if (!this.geoJSON._filtros) return;
        this.geoJSON.features = [];
        this.geoJSON._filtros.forEach(f => {
            if (f.activo) {
                let lista = this.featuresOriginal.filter(feat => (f.aplica(feat)));
                lista.forEach(feat => this.geoJSON.features.push(feat));
            }
        })
    }

    async cambioFiltros() {
        try {
            this.startWorking();
            this.lyGeoJSON.clearLayers();
            if (window.capasController) window.capasController.refresca();
            this.aplicaFiltros();
            this.repinta();
        } catch(error) {
            this.mensajes.addError(error.toString());
            console.error(error);
        } finally {
            this.finishWorking();
        }
    }

    repinta() {
        this.startWorking();
        try {
            this.lyGeoJSON.clearLayers();
            this.lyGeoJSON.addData(this.geoJSON);        
        } finally {
            this.finishWorking();
        }
    }

    cambioOpacidadCapa(opacidad) {
        this.panelMapa.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Geo JSON";
    }

    callMouseMove(e, puntoMapa, puntoPanel) {
        if (this.timerMove) clearTimeout(this.timerMove);
        this.timerMove = setTimeout(_ => this.mouseMove(e, puntoMapa, puntoPanel), 100);
    }
    mouseMove(e, puntoMapa, puntoPanel) {
        if (!this.geoJSON) return;
        let lat = e.latlng.lat, lng = e.latlng.lng;
        let point = turf.point([lng, lat]);
        let selected = null;
        let lineaMasCercana = undefined, distanciaLineaMasCercana = undefined;
        this.geoJSON.features.forEach(f => {
            if (f.type == "Feature" && f.properties.id && f.geometry) {
                if (f.geometry.type == "MultiPolygon" || f.geometry.type == "Polygon") {
                    if (!selected) {
                        let inside = turf.booleanPointInPolygon(point, f);
                        if (inside) {
                            selected = f;
                        }
                    }
                } else if (f.geometry.type == "MultiLineString") {
                    f.geometry.coordinates.forEach(coords => {
                        let segmento = turf.lineString(coords);
                        let d = turf.pointToLineDistance(point, segmento);
                        if (!lineaMasCercana || d < distanciaLineaMasCercana) {
                            lineaMasCercana = f;
                            distanciaLineaMasCercana = d;
                        }
                    });
                } else if (f.geometry.type == "LineString") {
                    let d = turf.pointToLineDistance(point, f);
                    if (!lineaMasCercana || d < distanciaLineaMasCercana) {
                        lineaMasCercana = f;
                        distanciaLineaMasCercana = d;
                    }
                }
            }
        });
        if (lineaMasCercana) {
            let bounds = window.geoportal.mapa.map.getBounds();
            let p1 = turf.point([bounds.getWest(), (bounds.getNorth() + bounds.getSouth()) / 2]);
            let p2 = turf.point([bounds.getEast(), (bounds.getNorth() + bounds.getSouth()) / 2]);
            let d = turf.distance(p1, p2);
            if (distanciaLineaMasCercana <= d / 100) selected = lineaMasCercana;
        }
        if (selected) {
            if (this.selectedFeature) {
                if (this.selectedFeature.properties.id == selected.properties.id) return;
                this.mouseLeaveFeature(this.selectedFeature);                
            }
            this.selectedFeature = selected;
            this.mouseEnterFeature(selected, puntoMapa, puntoPanel);
        } else {
            if (this.selectedFeature) {
                this.mouseLeaveFeature(this.selectedFeature);
                this.selectedFeature = null;
            }
        }
    }

    mouseLeaveFeature(f) {
        let layer = this.layerDeFeatureId[f.properties.id];
        if (this.savedStyle) {
            layer.setStyle(this.savedStyle);
        }
        window.geoportal.hideTooltip();
        window.geoportal.mapa.unsetPointer();
    }
    mouseEnterFeature(f, puntoMapa, puntoPanel) {
        let props = f.properties;
        let html = "<div class='tooltip-titulo'>" + props._titulo + "</div>";        
        html += "<hr class='my-1 bg-white' />";
        html += "<div class='tooltip-contenido'>";
        html += "<table class='w-100'>";
        html += "<tr>";
        let capa = this.capa;
        let origen = window.geoportal.origenes[capa.origen];
        html += "<td class='icono-tooltip'><img src='" + origen.icono + "' width='14px' /></td>";
        html += "<td class='propiedad-tooltip'>Origen:</td>";
        html += "<td class='valor-tooltip'>" + origen.nombre + "</td>";
        html += "</tr>";
        Object.keys(props).forEach(att => {
            if (!att.startsWith("_")) {
                let valor = props[att];
                let icono = "fa-tag";
                if (typeof valor == "string" && valor.length > 40) valor = valor.substr(0,40) + "...";
                html += "<tr>";
                html += "<td class='icono-tooltip'><i class='fas fa-lg " + icono + "'></i></td>";
                html += "<td class='propiedad-tooltip'>" + att + ":</td>";
                html += "<td class='valor-tooltip'>" + valor + "</td>";
                html += "</tr>";
            }
        });
        html += "</table>";
        html += "</div>";
        this.propHTML = html;        
        
        let layer = this.layerDeFeatureId[f.properties.id];
        let estiloActual = layer.options.style;
        if (!estiloActual) {
            console.log("Sin estilo", f, layer);
            estiloActual = {};
        }
        if (typeof estiloActual == "function") estiloActual = estiloActual(f);
        this.savedStyle = estiloActual;
        let copia = JSON.parse(JSON.stringify(estiloActual));
        if (copia.color == "#ff0000") {
            copia.color = "#0000ff";
            copia.fillColor = "#0000ff";
            copia.fillOpacity = 0.5;
        } else {
            copia.color = "#ff0000";
            copia.fillColor = "#ff0000";
            copia.fillOpacity = 0.5;
        }
        layer.setStyle(copia);
        window.geoportal.mapa.setPointer();
    }

    mouseClick(e, puntoMapa, puntoPanel) {
        if (this.selectedFeature) {
            window.geoportal.showTooltip(puntoPanel.x + 15, puntoPanel.y+7, this.propHTML);
        }
    }
}

window.geoportal.capas.registraVisualizador("base", "geojson", VisualizadorGeoJSON, "Geo-JSON", "base/img/geojson.svg");
