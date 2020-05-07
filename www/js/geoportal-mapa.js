const opMapasBase = [{
    codigo:"esri-world-physical", nombre:"Esri - World Physical Map", 
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
    options:{
        attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
        maxZoom: 8
    }
}, {
    codigo:"open-topo", nombre:"OSM - Open Topo",
    url:'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options:{
        maxZoom: 17,
	    attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    }
}, {
    codigo:"esri-world-imagery", nombre:"Esri - World Imagery",
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options:{
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
}, {
    codigo:"stamen-terrain", nombre:"Stamen - Terrain",
    url:'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}',
    options:{
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	    subdomains: 'abcd',
	    minZoom: 0,
	    maxZoom: 18,
	    ext: 'png'
    }
}, {
    codigo:"esri-world-street", nombre:"Esri - World Street Map",
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    options:{
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
    }
}, {
    codigo:"esri-world-terrain", nombre:"Esri - World Terrain",
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}',
    options:{
        attribution: 'Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS',
        maxZoom:13
    }
}, {
    codigo:"esri-ocean-basemap", nombre:"Esri - Ocean Base Map",
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}',
    options:{
        attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
        maxZoom:13
    }
}, {
    codigo:"esri-natgeo", nombre:"Esri - NatGeo World Map",
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
    options:{
        attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
        maxZoom:16
    }
}, {
    codigo:"wikimedia", nombre:"Wikimedia",
    url:'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}{r}.png',
    options:{
        attribution: '<a href="https://wikimediafoundation.org/wiki/Maps_Terms_of_Use">Wikimedia</a>',
        minZoom:1,
        maxZoom:19
    }
}];

class MapaGeoPortal {
    constructor(panelMapa) {
        this.panelMapa = panelMapa;
        this.siguienteIdPanel = 1;
        this.mouseListeners = [];
        this.map = L.map(panelMapa.id, {
            zoomControl:false, 
            attributionControl:false,
            minZoom:3
        }).setView([-33.034454, -71.592093], 6);
        this.map.on("moveend", _ => this.movioMapa());
        let mapDef = this.getMapa(window.geoportal.preferencias.mapa.mapaBase);
        let mapOpts = mapDef.options;
        this.panelBase = this.creaPanelMapa("mapa", "base", 0);
        mapOpts.pane = this.panelBase;
        this.lyBase = L.tileLayer(mapDef.url, mapOpts);
        this.lyBordes = L.tileLayer('https://tiles.windy.com/tiles/v9.0/darkmap-retina/{z}/{x}/{y}.png', {
            maxZoom: 18,
            pane:this.creaPanelMapa("borders", "base", 0)
        });
        this.panelEtiquetas = this.creaPanelMapa("labels", "base", 0);
        if (window.geoportal.preferencias.mapa.etiquetas) {
            this.lyLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
                pane:this.panelEtiquetas
            });
        }

        // Objetos      
        let div = document.createElement("DIV");
        div.style["pointer-events"] = "all";
        this.konvaStage = new Konva.Stage({
            container:div,
            width:200,
            height:200
        });
        this.konvaLayer = new Konva.Layer();  
        this.konvaLayerLeyendas = new Konva.Layer();
        this.konvaLayerEfectos = new Konva.Layer();  
        this.konvaLayerAgregando = new Konva.Layer();
        this.konvaStage.add(this.konvaLayerEfectos);    
        this.konvaStage.add(this.konvaLayer);
        this.konvaStage.add(this.konvaLayerLeyendas);
        this.konvaStage.add(this.konvaLayerAgregando);
                
        this.lyEfectos = new L.customLayer({
            container:div,
            minZoom:0, maxZoom:18, opacity:1, visible:true, zIndex:1500,
            pane:this.creaPanelMapa("efectos", "base", 0)
        })
        this.lyEfectos.on("layer-render", _ => {
            //console.log("render efectos");
        });        

        this.lyObjetos = new L.customLayer({
            container:div,
            minZoom:0, maxZoom:18, opacity:1, visible:true, zIndex:1500,
            pane:this.creaPanelMapa("objetos", "base", 1)
        })
        this.lyObjetos.on("layer-render", _ => {
            this.dibujaObjetos();
        });

        this.lyLeyendas = new L.customLayer({
            container:div,
            minZoom:0, maxZoom:18, opacity:1, visible:true, zIndex:1501,
            pane:this.creaPanelMapa("leyendas", "base", 1)
        })
        this.lyLeyendas.on("layer-render", _ => {
            this.dibujaLeyendas();
        });

        this.lyBase.addTo(this.map);
        this.lyBordes.addTo(this.map);
        this.lyEfectos.addTo(this.map);
        this.lyObjetos.addTo(this.map);
        this.lyLeyendas.addTo(this.map);
        if (window.geoportal.preferencias.mapa.etiquetas) {
            this.lyLabels.addTo(this.map);
        }

        this.initialized = true;
        
        this.map.on("click", e => {
            if (this.ignoreNextClick) {
                this.ignoreNextClick = false;
                return;
            }
            let lat = e.latlng.lat;
            let lng = e.latlng.lng;
            let point = this.map.latLngToContainerPoint([lat, lng]);
            window.geoportal.mapClick({lat:lat, lng:lng}, {x:point.x, y:point.y});
            this.mouseListeners.forEach(l => {
                if (l.onMouseClick) l.onMouseClick(e, {lat:lat, lng:lng}, {x:point.x, y:point.y});
            })
        });
        this.map.on("mousemove", e => {
            let lat = e.latlng.lat;
            let lng = e.latlng.lng;
            let point = this.map.latLngToContainerPoint([lat, lng]);
            window.geoportal.mapMouseMove({lat:lat, lng:lng}, {x:point.x, y:point.y});
            this.mouseListeners.forEach(l => {
                if (l.onMouseMove) l.onMouseMove(e, {lat:lat, lng:lng}, {x:point.x, y:point.y});
            })
        });
    }

    addMouseListener(l) {this.mouseListeners.push(l)}
    removeMouseListener(l) {
        let idx = this.mouseListeners.indexOf(l);
        if (idx >= 0) this.mouseListeners.splice(idx,1);
    }

    getMapa(codigo) {
        return opMapasBase.find(m => m.codigo == codigo);
    }
    getListaMapas() {
        return opMapasBase;
    }

    creaPanelMapa(capa, codigoPanel, zIndex) {
        let idxCapa, idBase;
        if (capa == "mapa") {
            idBase = "mapa";
            idxCapa = -1;
        } else if (capa == "borders") {
            idBase = "borders";
            idxCapa = 50;
        } else if (capa == "labels") {
            idBase = "labels";
            idxCapa = 51;
        } else if (capa == "efectos") {
            idBase = "efectos";
            idxCapa = 54;
        } else if (capa == "objetos") {
            idBase = "objetos";
            idxCapa = 55;
        } else if (capa == "leyendas") {
            idBase = "leyendas";
            idxCapa = 56;
        } else {
            idBase = capa.idBasePanel;
            idxCapa = window.geoportal.capas.getCapas().findIndex(c => c === capa);
            if (idxCapa < 0) throw "Creando Panel Mapa. No se encontró la capa";        
        }         
        let p = this.creaPanel(idBase + "-" + codigoPanel);
        p.setAttribute("data-idx-capa", idxCapa);
        p.setAttribute("data-z-index", zIndex);
        this.recalculaZIndex(p);
        return p;
    }
    creaIdPanelesCapa() {
        return "ly-" + (this.siguienteIdPanel++);
    }
    creaPanel(nombre) {
        let p = this.map.createPane(nombre);
        p.id = nombre;
        p.style.pointerEvents = "none";
        return p;
    }
    eliminaCapaMapa(layer) {
        let pane = layer.options.pane;
        this.map.removeLayer(layer);
        if (pane) {
            let paneElement = document.getElementById(pane);
            this.eliminaPanelMapa(paneElement);
        }
    }
    eliminaPanelMapa(pane) {
        L.DomUtil.remove(pane);        
    }

    recalculaZIndex(p) {
        let idxCapa = parseInt(p.getAttribute("data-idx-capa"));
        let zIndex = parseInt(p.getAttribute("data-z-index"));
        p.style.zIndex = 210 + idxCapa*10 + zIndex;
    }
    doResize() {
        if (!this.initialized) return;
        setTimeout(_ => {
            this.map.invalidateSize();
        }, 200);
    }

    movioMapa() {
        window.geoportal.movioMapa();
    }

    cambioMapaBase() {
        let mapDef = this.getMapa(window.geoportal.preferencias.mapa.mapaBase);
        let mapOpts = mapDef.options;
        mapOpts.pane = this.panelBase;
        this.lyBase.remove();
        this.lyBase = L.tileLayer(mapDef.url, mapOpts); 
        this.lyBase.addTo(this.map);
    }
    cambioEtiquetas() {
        if (window.geoportal.preferencias.mapa.etiquetas) {
            this.lyLabels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
                pane:this.creaPanelMapa("labels", "base", 0)
            });
            this.lyLabels.addTo(this.map);
        } else {
            this.lyLabels.remove();
            this.lyLabels = null;
        }
    }
    zoomIn() {
        let z = this.map.getZoom();
        if (z < 19) this.map.setZoom(z+1);
    }
    zoomOut() {
        let z = this.map.getZoom();
        if (z > 1) this.map.setZoom(z-1);
    }
    getLimites() {
        let b = this.map.getBounds();
        return {lng0:b.getWest(), lat0:b.getSouth(), lng1:b.getEast(), lat1:b.getNorth()}
    }
    setCenter(lat, lng, zoom) {
        if (zoom) {
            this.map.flyTo([lat, lng], zoom);
        } else {
            this.map.panTo(new L.LatLng(lat, lng));
        }
    }

    setCursorAgregandoObjeto() {
        this.lyObjetos.options.pane.style.cursor = "crosshair";
    }
    resetCursor() {
        this.lyObjetos.options.pane.style.removeProperty("cursor");
    }
    getObjetos() {
        return window.geoportal.capas.getCapas().reduce((lista, capa) => {
            if (capa.esObjetosUsuario || (capa.tieneObjetos && capa.objetosCargados)) lista = lista.concat(capa.objetos);
            return lista;
        }, [])
    }
    async agregaObjeto(o) {
        // Buscar capa de objetos de usuario activa
        let grupoActivo = window.geoportal.capas.getGrupoActivo();
        let itemActivo = grupoActivo.itemActivo;
        let capa = null;
        if (itemActivo instanceof GrupoCapas) {
            capa = null;
        } else if (itemActivo instanceof Capa) {
            capa = itemActivo;
        } else if (itemActivo instanceof VisualizadorCapa) {
            capa = itemActivo.capa;
        } else {
            if (itemActivo.capa) {
                capa = itemActivo.capa;
            }
        }
        let capaObjetosUsuario = null;
        if (capa && capa.esObjetosUsuario) {
            capaObjetosUsuario = capa;
        } else {
            capaObjetosUsuario = grupoActivo.capas.find(c => c.esObjetosUsuario);
            if (!capaObjetosUsuario) {
                capaObjetosUsuario = await window.geoportal.capas.addObjetosUsuario();
            }
        }
        capaObjetosUsuario.addObjetoUsuario(o);
        window.geoportal.panelTop.agregoObjeto();
        grupoActivo.itemActivo = o;
        if (!window.capasController) {
            await window.geoportal.panelLeft.selecciona("capas");
        }
        window.capasController.refresca();
        window.geoportal.finalizaAgregarObjeto();
        await this.seleccionaObjeto(o);
    }
    dibujaObjetos() {
        this.konvaLayerEfectos.destroyChildren();
        this.konvaLayerEfectos.draw();
        this.konvaLayer.destroyChildren();
        this.konvaLayer.draw();
        let limites = this.getLimites();
        setTimeout(_ => {
            let visibles = this.getObjetos().filter(o => o.isVisible(limites));
            visibles.forEach(o => {
                if (o.isVisible(limites)) {
                    o.dibuja(this.konvaLayer, this.konvaLayerEfectos)            
                }
            });
            visibles.forEach(o => {
                if (o.isVisible(limites)) {
                    o.dibujaValoresObservados(this.konvaLayer);
                }
            });
            this.konvaLayerEfectos.draw();
            this.konvaLayer.draw();
        }, 10);
    }
    callDibujaObjetos(delay) {
        if (!delay) delay = 200;
        if (this.timerDibujaObjetos) clearTimeout(this.timerDibujaObjetos);
        this.timerDibujaObjetos = setTimeout(_ => {
            this.timerDibujaObjetos = null;
            this.dibujaObjetos()
        }, delay);
    }
    async seleccionaObjeto(objeto) {
        //if (!isNaN(objeto)) objeto = this.objetos[objeto];
        let objetos = this.getObjetos();
        // desseleccionar
        objetos.forEach(o => {
            if (o !== objeto && o.seleccionado) o.desselecciona();
            if (o.objetos) o.objetos.forEach(so => {
                if (so !== objeto && so.seleccionado) so.desselecciona();
            });
        });
        // seleccionar
        objetos.forEach(o => {
            if (o === objeto && !o.seleccionado) o.selecciona();
            if (o.objetos) o.objetos.forEach(so => {
                if (so === objeto && !so.seleccionado) so.selecciona();
            });
        })
        await window.geoportal.objetoSeleccionado(objeto);
        this.dibujaObjetos();
    }
    movioObjeto(objeto) {
        if (objeto.objetoPadre) {
            objeto.objetoPadre.movioHijo(objeto);
            return;
        }
        objeto.movio();
        this.dibujaObjetos();
        objeto.capa.recalculaValoresObservados();
        window.geoportal.objetoMovido(objeto);
    }

    setPointer() {
        if (this.panelMapa.view.style.cursor != "pointer") this.savedCursor = this.panelMapa.view.style.cursor;
        this.panelMapa.view.style.cursor = "pointer"
    }
    unsetPointer() {this.panelMapa.view.style.cursor = this.savedCursor}

    resaltaPunto(lat, lng) {
        this.konvaLayerAgregando.destroyChildren();
        if (this.animacionResaltando && this.animacionResaltando.isRunning()) {
            this.animacionResaltando.stop();
        }
        if (this.timerResaltando) {
            clearTimeout(this.timerResaltando);
        }
        let point = this.map.latLngToContainerPoint([lat, lng]); 
        this.resaltando = new Konva.Circle({
            x: point.x,
            y: point.y,
            radius: 2,
            stroke: 'red',
            strokeWidth: 2,
            opacity : 0
        });
        this.konvaLayerAgregando.add(this.resaltando);
        this.animacionResaltando = new Konva.Animation(frame => {
            let porc = (Date.now() % 1000) / 1000;     
            this.resaltando.setRadius(5 + 20 * porc);
            this.resaltando.setOpacity(1 - porc);
        }, this.konvaLayerAgregando);
        this.animacionResaltando.start();
        this.timerResaltando = setTimeout(_ => {
            if (this.animacionResaltando && this.animacionResaltando.isRunning()) {
                this.animacionResaltando.stop();
            }
            this.animacionResaltando = null;
            this.timerResaltando = null;
            this.resaltando.destroy();
            this.konvaLayerAgregando.draw();
        }, 3000);
    }

    dibujaLeyendas() {
        this.konvaLayerLeyendas.destroyChildren();
        let limites = this.getLimites();
        let grupoActivo = window.geoportal.capas.getGrupoActivo();
        for (let i=0; i<grupoActivo.capas.length; i++) {
            let capa = grupoActivo.capas[i];
            if (capa.tieneObjetos && capa.observa && capa.observa.length) {
                let leyendasPorObjeto = {}
                capa.valoresObservados.filter(v => v !== null && v.observa.leyenda).forEach(v => {
                    let o = v.observa;
                    if (o.consulta.tipo == "capa") {
                        let objeto = v.objeto;
                        if (objeto.isVisible(limites)) {
                            let leyendas = leyendasPorObjeto[objeto.id];
                            if (!leyendas) {
                                leyendas = {objeto, leyendas:[]};
                                leyendasPorObjeto[objeto.id] = leyendas;
                            }
                            leyendas.leyendas.push({label:o.consulta.variable.nombre, decimales:o.consulta.decimales, unidad:o.consulta.unidad, valor:v.value?v.value:"S/D"}); 
                        }
                    } else if (o.consulta.tipo == "queryMinZ") {
                        if (v.value && v.value.length) {
                            v.value.forEach(dimValue => {
                                let obj = capa.objetos.find(o => o.getCodigoDimension() == dimValue.dim.code);
                                if (obj && obj.isVisible(limites)) {
                                    let o = v.observa;
                                    let leyendas = leyendasPorObjeto[obj.id];
                                    if (!leyendas) {
                                        leyendas = {objeto:obj, leyendas:[]};
                                        leyendasPorObjeto[obj.id] = leyendas;
                                    }
                                    leyendas.leyendas.push({label:o.consulta.nombre, decimales:o.consulta.decimales, unidad:o.consulta.unidad, valor:dimValue.value?dimValue.value:"S/D"}); 
                                }
                            })
                        }
                    }
                });
                let centrosLeyenda = [];
                Object.keys(leyendasPorObjeto).forEach(id => {
                    let leyendas = leyendasPorObjeto[id];
                    let p = leyendas.objeto.getCentroide();
                    let point = window.geoportal.mapa.map.latLngToContainerPoint([p.lat, p.lng]);
                    let x = point.x, y = point.y, path, hPos = capa.configPanel.configSubPaneles.observa.leyenda.hPos, vPos = capa.configPanel.configSubPaneles.observa.leyenda.vPos;
                    let dx = 100, dy = 60;
                    if (hPos == "centro") {
                        if (vPos == "arriba") {
                            path = [x, y, x, y - dy];
                            y -= dy;
                        } else if (vPos == "abajo") {
                            path = [x, y, x, y + dy];
                            y += dy;
                        }
                    } else if (hPos == "izquierda") {
                        if (vPos == "centro") {
                            path = [x, y, x - dx, y];
                            x -= dx;
                        } else if (vPos == "arriba") {
                            path = [x, y, x - dx/2, y, x - dx, y - dy];
                            x -= dx; y -= dy;
                        } else if (vPos == "abajo") {
                            path = [x, y, x - dx/2, y, x - dx, y + dy];
                            x -= dx; y += dy;
                        }
                    } else if (hPos == "derecha") {
                        if (vPos == "centro") {
                            path = [x, y, x + dx, y];
                            x += dx;
                        } else if (vPos == "arriba") {
                            path = [x, y, x + dx/2, y, x + dx, y - dy];
                            x += dx; y -= dy;
                        } else if (vPos == "abajo") {
                            path = [x, y, x + dx/2, y, x + dx, y + dy];
                            x += dx; y += dy;
                        }
                    }
                    this.konvaLayerLeyendas.add(new Konva.Line({
                        points:path,
                        stroke:"white", strokeWidth:5,
                        lineCap: 'round', lineJoin: 'round',
                        dash: [10, 7, 0.001, 7]
                    }));
                    this.konvaLayerLeyendas.add(new Konva.Line({
                        points:path,
                        stroke:"black", strokeWidth:3,
                        lineCap: 'round', lineJoin: 'round',
                        dash: [10, 7, 0.001, 7]
                    }));
                    centrosLeyenda.push({x:x, y:y});
                });
                Object.keys(leyendasPorObjeto).forEach((id, i) => {
                    let leyendas = leyendasPorObjeto[id];
                    let x = centrosLeyenda[i].x, y = centrosLeyenda[i].y;;
                    let width, height = 0;
                    let kTexts = leyendas.leyendas.reduce((lista, l) => {
                        //let txt = l.label + ": ";
                        let txt = "";
                        if (!isNaN(l.valor)) {
                            txt += GeoPortal.round(l.valor, l.decimales).toLocaleString();
                        } else {
                            txt += l.valor
                        }
                        txt += " [" + l.unidad + "]";
                        let kText = new Konva.Text({
                            x:x, y:y,
                            text:txt,
                            fontSize:12,
                            fontFamily:"Calibri",
                            fill:"#000000",
                            opacity:1
                        });
                        let txtWidth = kText.width();
                        let txtHeight = kText.height();
                        height += txtHeight;
                        if (width === undefined || txtWidth > width) width = txtWidth;
                        lista.push(kText);
                        return lista;
                    }, []);
                    let roundedRect = new Konva.Rect({
                        x:x - width / 2 - 5, y:y - height / 2 - 6, width:width + 10, height:height + 8,
                        fill: 'rgba(255,255,255,255)',
                        stroke: '#000000',
                        strokeWidth: 1,
                        shadowColor: 'black',
                        shadowBlur: 10,
                        shadowOffset: { x: 4, y: 4 },
                        shadowOpacity: 0.5,
                        cornerRadius:3,
                        opacity:1
                    });
                    this.konvaLayerLeyendas.add(roundedRect);
                    let yText = y - height / 2 - 1;
                    kTexts.forEach(kText => {
                        kText.absolutePosition({x:x - width / 2, y:yText});
                        yText += height / kTexts.length;
                        this.konvaLayerLeyendas.add(kText);
                    });
                });
            }
        }
        this.konvaLayerLeyendas.draw();
    }
    callDibujaLeyendas(delay) {
        if (!delay) delay = 200;
        if (this.timerDibujaLeyendas) clearTimeout(this.timerDibujaLeyendas);
        this.timerDibujaLeyendas = setTimeout(_ => {
            this.timerDibujaLeyendas = null;
            this.dibujaLeyendas()
        }, delay);
    }
}