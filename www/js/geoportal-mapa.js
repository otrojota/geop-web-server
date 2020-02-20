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
    codigo:"esri-world-street", nombre:"Esri - World Street Map",
    url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}',
    options:{
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
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
        this.map = L.map(panelMapa.id, {zoomControl:false, attributionControl:false}).setView([-33.034454, -71.592093], 6);
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
        this.konvaLayerEfectos = new Konva.Layer();  
        this.konvaLayerAgregando = new Konva.Layer();  
        this.konvaStage.add(this.konvaLayerEfectos);    
        this.konvaStage.add(this.konvaLayer);
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

        this.lyBase.addTo(this.map);
        this.lyBordes.addTo(this.map);
        this.lyEfectos.addTo(this.map);
        this.lyObjetos.addTo(this.map);
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
        });
        this.map.on("mousemove", e => {
            let lat = e.latlng.lat;
            let lng = e.latlng.lng;
            let point = this.map.latLngToContainerPoint([lat, lng]);
            window.geoportal.mapMouseMove({lat:lat, lng:lng}, {x:point.x, y:point.y});
        });
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
    setCenter(lat, lng) {
        this.map.panTo(new L.LatLng(lat, lng));
    }

    setCursorAgregandoObjeto() {
        this.lyObjetos.options.pane.style.cursor = "crosshair";
    }
    resetCursor() {
        this.lyObjetos.options.pane.style.removeProperty("cursor");
    }
    getObjetos() {
        return window.geoportal.capas.getCapas().reduce((lista, capa) => {
            if (capa.tieneObjetos) lista = lista.concat(capa.objetos);
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
        this.konvaLayer.destroyChildren();
        this.getObjetos().forEach(o => o.dibuja(this.konvaLayer, this.konvaLayerEfectos));
        this.konvaLayerEfectos.draw();
        this.konvaLayer.draw();
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
    }
    movioObjeto(objeto) {
        if (objeto.objetoPadre) {
            objeto.objetoPadre.movioHijo(objeto);
            return;
        }
        objeto.movio();
        this.dibujaObjetos();
        window.geoportal.objetoMovido(objeto);
    }
}