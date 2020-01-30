class ObjetoGeoportal {
    static handleMouseMove(puntoMapa, puntoCanvas) {
        if (window.geoportal.agregandoObjeto == "area" && ObjetoGeoportal.agregandoArea) {
            let a0 = ObjetoGeoportal.newAreaP0;
            let a1 = puntoCanvas;
            let p0 = {x:Math.min(a0.x, a1.x), y:Math.min(a0.y, a1.y)};
            let p1 = {x:Math.max(a0.x, a1.x), y:Math.max(a0.y, a1.y)};
            this.agregandoAreaPoly.points([p0.x, p0.y, p1.x, p0.y, p1.x, p1.y, p0.x, p1.y]);
            window.geoportal.mapa.konvaLayerAgregando.draw();
        }
    }
    static handleMouseClick(puntoMapa, puntoCanvas) {
        if (window.geoportal.agregandoObjeto == "punto") {
            window.geoportal.mapa.agregaObjeto(new Punto(puntoMapa));
        } else if (window.geoportal.agregandoObjeto == "area") {
            window.geoportal.mapa.konvaLayerAgregando.destroyChildren();
            if (ObjetoGeoportal.agregandoArea) {
                window.geoportal.mapa.agregaObjeto(new Area(Objetogeoportal.agregandoArea, puntoMapa));
                Objetogeoportal.agregandoArea = null;
            } else {
                ObjetoGeoportal.agregandoArea = puntoMapa;
                ObjetoGeoportal.newAreaP0 = puntoCanvas;
                let p0 = puntoCanvas;
                let p1 = {x:puntoCanvas.x - 1, y:puntoCanvas.y + 1};
                this.agregandoAreaPoly = new Konva.Line({
                    points: [p0.x, p0.y, p1.x, p0.y, p1.x, p1.y, p0.x, p1.y],
                    fill: 'rgba(0,0,0,0.05)',
                    stroke: 'black',
                    strokeWidth: 1,
                    closed: true,
                    shadowOffsetX : 5,
                    shadowOffsetY : 5,
                    shadowBlur : 10,
                });
                window.geoportal.mapa.konvaLayerAgregando.add(this.agregandoAreaPoly);
                window.geoportal.mapa.konvaLayerAgregando.draw();
            }
        }
    }
    static cancelaAgregarObjeto() {
        ObjetoGeoportal.agregandoArea = null;
    }

    constructor(config) {
        this.tipo = "abstract";
        this.config = config;
        this.seleccionado = false;
        this.usaAnalisis = true;
        this.nombreEditable = true;
        this.objetoPadre = null;
        this.dragBoundFunc = null;
        this.capa = null;
        this.configPanel = {
            flotante:false,
            height:180, width:300,
            configSubPaneles:{}
        }
    }
    get nombre() {return this.config.nombre}
    set nombre(n) {this.config.nombre = n}

    describe() {return "Sin Descripción"}
    dibuja(konvaLayer, konvaLayerEfectos) {}
    destruye() {}
    movio() {}
    movioHijo(hijo) {}
    cambioTiempo() {}
    getSubitems() {return []}
    selecciona() {this.seleccionado = true}
    desselecciona() {this.seleccionado = false}
    getRutaPanelConfiguracion() {return "common/Empty"}
    getIcono() {return "img/iconos/punto.svg"}
    aseguraVisible() {}
    isVisible() {throw "isVisible no Implementado en '" + this.nombre + "'"}
    
}

class Punto extends ObjetoGeoportal {    
    constructor(puntoMapa, nombre, config) {
        if (!nombre) {
            if (!Punto.siguienteNumeroPunto) Punto.siguienteNumeroPunto = 1;
            nombre = "Punto " + Punto.siguienteNumeroPunto++
        }
        let defaultConfig = {
            nombre:nombre,
            analisis:{
                datasource:"gfs.TMP_SUP",
                visualizador:"serieTiempo"
            },
            movible:true, iconoEnMapa:null,
        }
        let initialConfig = $.extend({}, defaultConfig, config?config:{});
        super(initialConfig);
        this.tipo = "punto";
        this.lng = puntoMapa.lng;
        this.lat = puntoMapa.lat;
        this.observa = []; // datasources
        this.valoresObservados = {}; // codigoDS:null|numero|buscador        
        this.movible = initialConfig.movible;
        this.iconoEnMapa = initialConfig.iconoEnMapa;
    }
    describe() {return this.nombre}
    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"left/propiedades/PropPunto"
        }];
        return paneles;
    }

    getTituloPanel() {
        return this.nombre;
    }

    dibuja(konvaLayer, konvaLayerEfectos) {
        let map = window.geoportal.mapa.map;
        let point = map.latLngToContainerPoint([this.lat, this.lng]);
        if (this.observa.length) {
            let rect = new Konva.Rect({
                x:point.x - 2,
                y:point.y - 8 - 6 - 26 * this.observa.length,
                width:4,
                height:8 + 6 + 26 * this.observa.length,
                fill:"#a86d32",
                stroke:"black",
                strokeWidth:0.5
            });
            konvaLayer.add(rect);
            this.observa.forEach((dsInfo, idx) => {
                //let y = point.y - 8 - 6 - 26 * idx - 24;
                let y = point.y - 8 - 6 - 26 * this.observa.length + idx * 26 + 3;
                let x = point.x + 3;
                let value = this.valoresObservados[dsInfo.codigo + "-" + dsInfo.idxNivel];
                let text, textColor;
                if (value.data === undefined && !value.abort) {
                    text = "Sin Datos"; textColor = "orange";
                } else if (value.abort) {
                    text = "... ?? ..."; textColor = "orange";
                } else if (typeof value == "string") {
                    text = value; textColor = "red";
                } else {
                    let v = window.geoportal.formateaValor(dsInfo.datasource.codigo, value.data);
                    text = v + " [" + value.unit + "]";
                    textColor = "white";
                }                
                let txt = new Konva.Text({
                    x:x + 18, y:y + 4,
                    text:text,
                    fontSize:14,
                    fontFamily:"Calibri",
                    fill:textColor
                });
                let txtWidth = txt.width() + 14;
                let poly = new Konva.Line({
                    points:[x,y, x+8+txtWidth,y, x+8+txtWidth+5,y+10, x+8+txtWidth,y+20, x,y+20],
                    closed:true,
                    fill:"#787777",
                    stroke:"black",
                    strokeWidth:0.5,
                    shadowOffsetX : 5,
                    shadowOffsetY : 3,
                    shadowBlur : 7,
                    opacity : 0.8
                });
                konvaLayer.add(poly);
                konvaLayer.add(txt);
                let htmlImg = new Image(12,12);
                htmlImg.src = dsInfo.datasource.icono;
                let img = new Konva.Image({
                    x:x + 2, y: y + 4,
                    image:htmlImg,
                    width:12, height:12
                });
                img.cache();
                img.filters([Konva.Filters.Invert]);
                konvaLayer.add(img);
                let background = new Konva.Rect({
                    x:x, y:y, width:8+txtWidth+5, height:20
                });
                konvaLayer.add(background);
                /*
                background.on("mouseenter", e => {
                    let ds = dsInfo.datasource;
                    let html = "<div class='tooltip-titulo'>" + dsInfo.datasource.nombre + "</div>";
                    if (dsInfo.nombreNivel) html += "<div class='tooltip-subtitulo'>" + dsInfo.nombreNivel + "</div>";
                    html += "<hr class='my-1 bg-white' />";
                    html += "<div class='tooltip-contenido'>";
                    html += "<table class='w-100'>";
                    html += "<tr>";
                    let origen = window.pomeo.getOrigen(ds.origen);
                    html += "<td class='icono-tooltip'><img src='" + origen.icono + "' width='14px' /></td>";
                    html += "<td class='propiedad-tooltip'>Origen:</td>";
                    html += "<td class='valor-tooltip'>" + origen.nombre + "</td>";
                    html += "</tr>";
                    
                    let tiempo = TimeUtils.fromUTCMillis(value.time);
                    html += "<tr>";
                    html += "<td class='icono-tooltip'><i class='fas fa-lg fa-clock'></i></td>";
                    html += "<td class='propiedad-tooltip'>Tiempo:</td>";
                    html += "<td class='valor-tooltip'>" + tiempo.format("DD/MMM/YYYY HH:mm") + "</td>";
                    html += "</tr>";

                    let modelo = (value.metadata && value.metadata.modelo)?value.metadata.modelo:null;
                    if (modelo) {
                        html += "<tr>";
                        html += "<td class='icono-tooltip'><i class='fas fa-lg fa-square-root-alt'></i></td>";
                        html += "<td class='propiedad-tooltip'>Ejecución Modelo:</td>";
                        html += "<td class='valor-tooltip'>" + modelo + "</td>";
                        html += "</tr>";
                    }

                    html += "</table>";
                    html += "</div>";
                    window.pomeo.showTooltip(x + 15 + txtWidth, y+7, html);
                });
                background.on("mouseout", e => {
                    window.pomeo.hideTooltip();
                });
                */
            });
        }
        this.selectedCircle = new Konva.Circle({
            x: point.x,
            y: point.y,
            radius: 2,
            stroke: 'white',
            strokeWidth: 2,
            opacity : 0
        });
        konvaLayerEfectos.add(this.selectedCircle);

        if (this.iconoEnMapa) {            
            window.geoportal.mapa.getImagen(this.iconoEnMapa, htmlImage => {
                let img = new Konva.Image({
                    x:point.x - 11, y: point.y - 11,
                    image:htmlImage,
                    width:21, height:21
                });
                img.cache();
                img.on('mouseenter', _ => {
                    map.dragging.disable();
                    document.body.style.cursor = 'pointer';
                    let html = "<div class='tooltip-titulo'>" + this.nombre + "</div>";
                    window.geoportal.showTooltip(point.x + 15, point.y, html);
                });
                img.on('mouseout', _ => {
                    map.dragging.enable();
                    document.body.style.cursor = 'default';
                    window.geoportal.hideTooltip();
                });        
                img.on("mousedown", e => {
                    window.geoportal.mapa.ignoreNextClick = true;
                    this.dragged = false;
                })  
                img.on("mouseup", e => {
                    if (!this.dragged) {
                        window.geoportal.mapa.seleccionaObjeto(this);
                    }
                })  
                konvaLayer.add(img);
            }); 
            this.circle = null;           
        } else {
            let circle = new Konva.Circle({
                x: point.x,
                y: point.y,
                radius: 8,
                fill: this.seleccionado?"#f2570a":"#f2a10a",
                stroke: 'black',
                strokeWidth: 0.5,
                draggable:this.movible,
                shadowOffsetX : 5,
                shadowOffsetY : 5,
                shadowBlur : 10,
                opacity : (this.iconoEnMapa?0:1) * this.capa.opacidad / 100,
                dragBoundFunc: this.dragBoundFunc
            });    
            circle.on('mouseenter', _ => {
                map.dragging.disable();
                document.body.style.cursor = 'pointer'
                circle.setStroke("blue");
                circle.setStrokeWidth(2);
                konvaLayer.draw();
                let html = "<div class='tooltip-titulo'>" + this.nombre + "</div>";
                window.geoportal.showTooltip(point.x + 12, point.y, html);
            });
            circle.on('mouseout', _ => {
                map.dragging.enable();
                document.body.style.cursor = 'default';
                circle.setStroke("black");
                circle.setStrokeWidth(1);
                konvaLayer.draw();
                window.geoportal.hideTooltip();
            });        
            if (this.movible) {
                circle.on("dragstart", _ => window.geoportal.hideTooltip());
                circle.on("dragend", e => {
                    let latLng = map.containerPointToLatLng({x:circle.x(), y:circle.y()});
                    this.lat = latLng.lat;
                    this.lng = latLng.lng;
                    window.geoportal.mapa.movioObjeto(this);
                });
                circle.on("dragmove", e => {
                    let latLng = map.containerPointToLatLng({x:circle.x(), y:circle.y()});
                    this.lat = latLng.lat;
                    this.lng = latLng.lng;
                    this.dragged = true;
                    //window.pomeo.mapa.interactorChanging(this);
                });
            }
            circle.on("mousedown", e => {
                window.geoportal.mapa.ignoreNextClick = true;
                this.dragged = false;
            })  
            circle.on("mouseup", e => {
                if (!this.dragged) {
                    window.geoportal.mapa.seleccionaObjeto(this);
                }
            })          
            konvaLayer.add(circle);
            this.circle = circle;
        }
        this.konvaLayer = konvaLayer;
        this.konvaLayerEfectos = konvaLayerEfectos;
        this.checkAnimation();        
    }

    selecciona() {
        if (this.seleccionado) return;
        super.selecciona();
        if (this.circle) {
            this.circle.setFill("#f2570a");
            this.konvaLayer.draw();
        }
        this.checkAnimation();
    }
    desselecciona() {
        if (!this.seleccionado) return;
        super.desselecciona();
        if (this.circle) {
            this.circle.setFill("#f2a10a");
            this.konvaLayer.draw();
        }
        this.checkAnimation();
    }
    checkAnimation() {
        if (!this.seleccionado) {
            if (this.animation && this.animation.isRunning()) {
                this.animation.stop();
                this.selectedCircle.setOpacity(0);
                this.konvaLayerEfectos.draw();
            }
            return;
        }
        if (!this.animation) {
            this.animation = new Konva.Animation(frame => {
                let porc = (new Date().getTime() % 1000) / 1000;
                this.selectedCircle.setRadius(5 + 20 * porc);
                this.selectedCircle.setOpacity(1 - porc);
            }, this.konvaLayerEfectos);            
        }
        if (!this.animation.isRunning()) {
            this.animation.start();        
        }
    }
    destruye() {
        if (this.animation && this.animation.isRunning()) {
            this.animation.stop();
        }
    }
    getRutaPanelConfiguracion() {return "main/config-objetos/PConfigPunto"}
    getIcono() {return "img/iconos/punto.svg"}
    recalculaValoresObservados() {
        Object.keys(this.valoresObservados).forEach(dsCode => {
            let v = this.valoresObservados[dsCode];
            if (v && v.abort) v.abort();
        })
        this.valoresObservados = {};
        this.observa.forEach(dsInfo => {
            let query = {
                lat:this.lat, lng:this.lng, time:window.geoportal.tiempo,
                levelIndex:dsInfo.idxNivel?dsInfo.idxNivel:0
            }   
            this.valoresObservados[dsInfo.codigo + "-" + dsInfo.idxNivel] = zPost("query.ds", {ds:dsInfo.codigo, formato:"POINT_TIME_VALUE", query:query}, data => {
                this.valoresObservados[dsInfo.codigo + "-" + dsInfo.idxNivel] = data;
                window.geoportal.mapa.dibujaObjetos();
            }, error => {
                console.error(error);
                this.valoresObservados[dsInfo.codigo + "-" + dsInfo.idxNivel] = "Error:" + error.toString();
            });
        });
    }

    movio() {
        this.recalculaValoresObservados();
        super.movio();
    }
    cambioTiempo() {
        let idx = this.observa.findIndex(dsInfo => dsInfo.datasource.opciones.temporal);
        if (idx < 0) return;
        this.recalculaValoresObservados();
        super.cambioTiempo();
    }
    isVisible() {
        return window.pomeo.mapa.map.getBounds().contains(L.latLng(this.lat, this.lng));
    }
    aseguraVisible() {
        if (this.isVisible()) return;
        setTimeout(_ => window.geoportal.mapa.setCenter(this.lat, this.lng), 300);        
    }

}

class DataPunto extends Punto {
    constructor(config) {
        super({lat:config.lat, lng:config.lng}, config.nombre, config);
        this.codigo = config.codigo;
        this.datasources = config.datasources;
        this.nombreEditable = false;
    }
}
class DataObjects extends ObjetoGeoportal {
    constructor(ds, config) {
        super(config);
        this.tipo = "dataObjects";
        this.ds = ds;
        this.objetos = config.objetos.reduce((lista, o) => {
            switch(o.tipo) {
                case "punto":
                    lista.push(new DataPunto(o));
                    break;
                default:
                    console.error("Data Object", o);
                    throw "Tipo de DataObject '" + o.tipo + "' no manejado";
            }
            return lista;
        }, []);
        this.usaAnalisis = false;
        this.icono = config.icono;
    }
    getRutaPanelConfiguracion() {return null}
    getIcono() {return this.icono}
    getSubitems() {return this.objetos}
    dibuja(konvaLayer, konvaLayerEfectos) {
        this.objetos.forEach(o => o.dibuja(konvaLayer, konvaLayerEfectos));        
    }
    destruye() {
        this.objetos.forEach(o => o.destruye())
    }
    cambioTiempo() {
        this.objetos.forEach(o => o.cambioTiempo())
    }
}

class Area extends ObjetoGeoportal {    
    constructor(p1, p2, nombre, config) {
        if (!nombre) {
            if (!Area.siguienteNumeroArea) Area.siguienteNumeroArea = 1;
            nombre = "Área " + Area.siguienteNumeroArea++
        }
        let defaultConfig = {
            nombre:nombre,
            analisis:{
                datasource:"fixed.BATIMETRIA",
                visualizador:"rectAreaValue"
            },
            movible:true
        }
        let initialConfig = $.extend({}, defaultConfig, config?config:{});
        super(initialConfig);
        this.tipo = "area";
        let lngW = Math.min(p1.lng, p2.lng);
        let lngE = Math.max(p1.lng, p2.lng);
        let latN = Math.max(p1.lat, p2.lat);
        let latS = Math.min(p1.lat, p2.lat);
        this.objetos = [
            new Punto({lng:lngW, lat:latN}, nombre + "-nw"),
            new Punto({lng:lngE, lat:latN}, nombre + "-ne"),
            new Punto({lng:lngW, lat:latS}, nombre + "-sw"),
            new Punto({lng:lngE, lat:latS}, nombre + "-se")
        ];
        this.objetos.forEach(o => o.objetoPadre = this);

        //Retringir movimiento de puntos de control
        // NW
        this.objetos[0].dragBoundFunc = pos => {
            let maxX = this.objetos[1].circle.x() - 10;
            let maxY = this.objetos[2].circle.y() - 10;
            return {x:pos.x < maxX?pos.x:maxX, y:pos.y < maxY?pos.y:maxY}
        }
        // NE
        this.objetos[1].dragBoundFunc = pos => {
            let minX = this.objetos[0].circle.x() + 10;
            let maxY = this.objetos[2].circle.y() - 10;
            return {x:pos.x > minX?pos.x:minX, y:pos.y < maxY?pos.y:maxY}
        }
        // SW
        this.objetos[2].dragBoundFunc = pos => {
            let maxX = this.objetos[1].circle.x() - 10;
            let minY = this.objetos[0].circle.y() + 10;
            return {x:pos.x < maxX?pos.x:maxX, y:pos.y > minY?pos.y:minY}
        }
        // SE
        this.objetos[3].dragBoundFunc = pos => {
            let minX = this.objetos[0].circle.x() + 10;
            let minY = this.objetos[0].circle.y() + 10;
            return {x:pos.x > minX?pos.x:minX, y:pos.y > minY?pos.y:minY}
        }
        this.movible = initialConfig.movible;
    }
    get lng0() {return this.objetos[0].lng}
    get lng1() {return this.objetos[1].lng}
    get lat0() {return this.objetos[2].lat}
    get lat1() {return this.objetos[0].lat}
    describe() {return this.nombre}
    getRutaPanelConfiguracion() {return null}
    getIcono() {return "img/iconos/area.svg"}
    getSubitems() {return this.objetos}
    dibuja(konvaLayer, konvaLayerEfectos) {
        let map = geoportal.mapa.map;
        let p0 = map.latLngToContainerPoint([this.lat0, this.lng0]);
        let p1 = map.latLngToContainerPoint([this.lat1, this.lng1]);
        let poly = new Konva.Line({
            points: [p0.x, p0.y, p1.x, p0.y, p1.x, p1.y, p0.x, p1.y],
            fill: 'rgba(0,0,0,0.05)',
            stroke: this.seleccionado?"blue":'black',
            strokeWidth: this.seleccionado?2:1,
            closed: true,
            draggable:this.movible,
            shadowOffsetX : 5,
            shadowOffsetY : 5,
            shadowBlur : 10,
        });
        konvaLayer.add(poly);
        this.poly = poly;
        poly.on('mouseenter', _ => {
            map.dragging.disable();
            document.body.style.cursor = 'pointer'
            poly.setStroke("blue");
            poly.setStrokeWidth(2);
            konvaLayer.draw();
            let html = "<div class='tooltip-titulo'>" + this.nombre + "</div>";
            window.geoportal.showTooltip(p1.x + 12, p1.y + 10, html);
        });
        poly.on('mouseout', _ => {
            map.dragging.enable();
            document.body.style.cursor = 'default';
            poly.setStroke(this.seleccionado?"blue":"black");
            poly.setStrokeWidth(this.seleccionado?2:1);
            konvaLayer.draw();
            window.geoportal.hideTooltip();
        });        
        if (this.movible) {
            poly.on("dragstart", _ => window.geoportal.hideTooltip());
            poly.on("dragend", e => {
                let newX0 = poly.points()[0] + poly.x();
                let newY0 = poly.points()[1] + poly.y();
                let newOrigin = map.containerPointToLatLng({x:newX0, y:newY0});
                let deltaLng = newOrigin.lng - this.lng0;
                let deltaLat = newOrigin.lat - this.lat0;
                this.objetos.forEach(o => {
                    o.lng += deltaLng;
                    o.lat += deltaLat;
                });
                window.geoportal.mapa.movioObjeto(this);
            });
            poly.on("dragmove", e => {
                this.dragged = true;
            });
        }
        poly.on("mousedown", e => {
            window.geoportal.mapa.ignoreNextClick = true;
            this.dragged = false;
        })  
        poly.on("mouseup", e => {
            if (!this.dragged) {
                window.geoportal.mapa.seleccionaObjeto(this);
            }
        }) 
        this.objetos.forEach(o => o.dibuja(konvaLayer, konvaLayerEfectos))        
    }
    destruye() {
        this.objetos.forEach(o => o.destruye())
    }
    cambioTiempo() {
        this.objetos.forEach(o => o.cambioTiempo())
    }
    movioHijo(hijo) {
        hijo.movio();
        let idx = this.objetos.findIndex(h => (h === hijo));
        if (idx < 0) {
            console.error("Punto hijo se movió y no se encontró en el area", hijo);
            return;
        }
        if (idx == 0) {         // nw
            this.objetos[1].lat = hijo.lat;
            this.objetos[2].lng = hijo.lng;
            this.objetos[1].movio();
            this.objetos[2].movio();
        } else if (idx == 1) {  // ne
            this.objetos[0].lat = hijo.lat;
            this.objetos[3].lng = hijo.lng;
            this.objetos[0].movio();
            this.objetos[3].movio();
        } else if (idx == 2) {  // sw
            this.objetos[0].lng = hijo.lng;
            this.objetos[3].lat = hijo.lat;
            this.objetos[0].movio();
            this.objetos[3].movio();
        } else if (idx == 3) {  // se
            this.objetos[1].lng = hijo.lng;
            this.objetos[2].lat = hijo.lat;
            this.objetos[1].movio();
            this.objetos[2].movio();
        }
        window.geoportal.mapa.movioObjeto(this);
    }
    isVisible() {
        return window.geoportal.mapa.map.getBounds().contains(L.latLngBounds(
            L.latLng(this.lat0, this.lng0),
            L.latLng(this.lat1, this.lng1)
        ));
    }
    aseguraVisible() {
        if (this.isVisible()) return;
        setTimeout(_ => {
            let dLat = (this.lat1 - this.lat0) / 5;
            let dLng = (this.lng1 - this.lng0) / 5;
            window.geoportal.mapa.map.fitBounds(L.latLngBounds(
                L.latLng(this.lat0 - dLat * 2, this.lng0 - dLng),
                L.latLng(this.lat1 + dLat, this.lng1 - dLng)
            ))
        }, 300);        
    }
}