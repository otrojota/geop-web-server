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
            window.geoportal.mapa.agregaObjeto(new Punto(puntoMapa, null, {nombreEditable:true}));
        } else if (window.geoportal.agregandoObjeto == "area") {
            window.geoportal.mapa.konvaLayerAgregando.destroyChildren();
            window.geoportal.mapa.konvaLayerAgregando.draw();
            if (ObjetoGeoportal.agregandoArea) {
                window.geoportal.mapa.agregaObjeto(new Area(ObjetoGeoportal.agregandoArea, puntoMapa, null, {nombreEditable:true}));
                ObjetoGeoportal.agregandoArea = null;
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

    constructor(config, id) {
        this.tipo = "abstract";
        this.id = id;
        this.config = config;
        this.seleccionado = false;
        this.usaAnalisis = true;
        this.nombreEditable = config.nombreEditable;
        this.objetoPadre = null;
        this.dragBoundFunc = null;
        this._capa = null;
        this.configPanel = {
            flotante:false,
            height:260, width:300,
            configSubPaneles:{}
        }
        /* Se mueve a la capa
        this.configAnalisis = {
            height:200, width:300,
            analizador:"no-sobreescrito",
            analizadores:{}
        }
        */
        this.mensajes = new MensajesGeoportal(this);
        this.observa = []; // {capa:capasDisponibles, nivel:0}
        this.valoresObservados = []; // indice de "observa"
    }
    get configAnalisis() {return this.capa.configAnalisis}

    get nombre() {return this.config.nombre}
    set nombre(n) {this.config.nombre = n}

    get variables() {return this.config.variables || []} // dataObject

    getTituloPanel() {return this.nombre}
    describe() {return "Sin Descripción"}
    dibuja(konvaLayer, konvaLayerEfectos) {}
    destruye() {}
    movio() {this.recalculaValoresObservados()}
    cambioTiempo() {
        let idx = this.observa.findIndex(o => (o.tipo == "queryMinZ" || o.variable && o.variable.temporal));
        if (idx < 0) return;
        this.recalculaValoresObservados();        
    }
    movioHijo(hijo) {}
    getItems() {return null}
    selecciona() {this.seleccionado = true}
    desselecciona() {this.seleccionado = false}
    getIcono() {return "img/iconos/punto.svg"}
    aseguraVisible() {}
    isVisible(limites) {throw "isVisible no Implementado en '" + this.nombre + "'"}
    editoPadre() {}
    getCentroide() {console.error("getCentroide no sobreescrito en objeto")}
    getCodigoDimension() {return null}

    getAnalizadoresAplicables() {
        let ret = [];
        window.geoportal.capas.clasesAnalizadores.forEach(c => {
            if (c.clase.aplicaAObjetoCapa(this, this.capa)) ret.push(c);
        })
        return ret;
    }
    getAnalizadorDefault() {
        if (this.config.analizadorDefault) return this.config.analizadorDefault;
        return {
            analizador:"serie-tiempo",
            config:{
                variable:"gfs4.TMP_2M",
                nivelVariable:0,
                tiempo:{tipo:"relativo", from:-2, to:4}
            }
        }
    }
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"props",
            path:"left/propiedades/PropObjeto"
        }, {
            codigo:"observa",
            path:"left/propiedades/ObjetoObserva"
        }];
        return paneles;
    }

    dibujaValoresObservados(konvaLayer) {
        if (this.observa.length) {
            let centroide = this.getCentroide();
            let point = window.geoportal.mapa.map.latLngToContainerPoint([centroide.lat, centroide.lng]);
            let rect = new Konva.Rect({
                x:point.x - 2,
                y:point.y - 8 - 6 - 26 * this.observa.length,
                width:4,
                height:8 + 6 + 26 * this.observa.length,
                fill:"#a86d32",
                stroke:"black",
                strokeWidth:0.5,
                opacity:this.capa.opacidad / 100
            });
            konvaLayer.add(rect);
            this.observa.forEach((o, idx) => {
                //let y = point.y - 8 - 6 - 26 * idx - 24;
                let y = point.y - 8 - 6 - 26 * this.observa.length + idx * 26 + 3;
                let x = point.x + 3;
                let resultado = o.resultado, text, textColor;
                if (!resultado) {
                    text = "... ?? ..."; textColor = "orange";
                } else if (resultado.error) {
                    text = resultado.error; textColor = "orange";
                } else {
                    text = o.valorFormateado; textColor = "white";
                }          
                let txt = new Konva.Text({
                    x:x + 18, y:y + 4,
                    text:text,
                    fontSize:14,
                    fontFamily:"Calibri",
                    fill:textColor,
                    opacity:this.capa.opacidad / 100
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
                    opacity : 0.8 * this.capa.opacidad / 100
                });
                konvaLayer.add(poly);
                konvaLayer.add(txt);
                let htmlImg = window.geoportal.getImagen(o.icono, 12, 12, _ => window.geoportal.mapa.callDibujaObjetos(300));
                let img = new Konva.Image({
                    x:x + 2, y: y + 4,
                    image:htmlImg,
                    width:12, height:12,
                    opacity:this.capa.opacidad / 100
                });
                img.cache();
                img.filters([Konva.Filters.Invert]);
                konvaLayer.add(img);
                let background = new Konva.Rect({
                    x:x, y:y, width:8+txtWidth+5, height:20
                });
                konvaLayer.add(background);                
                background.on("mouseenter", e => {
                    let variable = o.variable;
                    let html = "<div class='tooltip-titulo'>" + o.nombre + "</div>";
                    if (o.niveles && o.niveles.length > 1) html += "<div class='tooltip-subtitulo'>" + o.niveles[o.nivel].descripcion + "</div>";
                    html += "<hr class='my-1 bg-white' />";
                    html += "<div class='tooltip-contenido'>";
                    html += "<table class='w-100'>";
                    html += "<tr>";
                    let origen = window.geoportal.origenes[o.origen];
                    html += "<td class='icono-tooltip'><img src='" + origen.icono + "' width='14px' /></td>";
                    html += "<td class='propiedad-tooltip'>Origen:</td>";
                    html += "<td class='valor-tooltip'>" + origen.nombre + "</td>";
                    html += "</tr>";
                    
                    if (o.resultado && o.resultado.valor && o.resultado.valor.atributos) {
                        Object.keys(o.resultado.valor.atributos).forEach(att => {
                            let valor = o.resultado.valor.atributos[att];
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
                        if (o.resultado.valor.atributos.realLng && o.resultado.valor.atributos.realLat) {
                            window.geoportal.mapa.dibujaPuntoDatos(centroide.lat, centroide.lng, o.resultado.valor.atributos.realLat, o.resultado.valor.atributos.realLng);
                        }
                    }

                    html += "</table>";
                    html += "</div>";
                    window.geoportal.showTooltip(x + 15 + txtWidth, y+7, html);
                });
                background.on("mouseout", e => {
                    window.geoportal.hideTooltip();
                    window.geoportal.mapa.limpiaPuntoDatos();
                });                
            });
        }
    }

    recalculaValoresObservados() {
        this.mensajes.clear();
        this.observa.forEach((o, i) => {
            o.getValorEnPunto(window.geoportal.tiempo, this, this.mensajes)
                .then(_ => window.geoportal.mapa.callDibujaObjetos())
                .catch(_ => window.geoportal.mapa.callDibujaObjetos());
        });
    }
    recalculaValoresObservadosOld() {
        this.mensajes.clear();
        this.valoresObservados = this.observa.reduce((lista, o) => {
            lista.push(null);
            return lista;
        }, []);        
        this.observa.forEach((o, i) => {
            if (o.tipo == "capa") {
                let infoVar = window.geoportal.getInfoVarParaConsulta(o.codigoVariable, this);
                this.mensajes.addOrigen(infoVar.variable.origen);
                let centroide = this.getCentroide();
                let query = {
                    lat:centroide.lat, lng:centroide.lng, time:window.geoportal.tiempo,
                    levelIndex:o.nivel !== undefined?o.nivel:0,
                    codigoVariable:infoVar.codigoVariable,
                    metadataCompleta:true
                }
                let capa = infoVar.capaQuery;
                capa.resuelveConsulta("valorEnPunto", query, (err, resultado) => {
                    if (err) {
                        this.valoresObservados[i] = "Error: " + err;
                        this.mensajes.addError(infoVar.variable.nombre + ": " + err.toString());
                    } else {
                        this.valoresObservados[i] = resultado;
                        if (resultado == "S/D" || resultado == null || resultado === undefined) this.mensajes.addError(infoVar.variable.nombre + ": Sin Datos");
                        else if (typeof resultado == "string") this.mensajes.addError(infoVar.variable.nombre + ": " + resultado);  
                        else if (resultado && resultado.value === undefined) this.mensajes.addError(infoVar.variable.nombre + ": Sin Datos");
                        else this.mensajes.parse(resultado, infoVar.variable.nombre);
                    }
                    window.geoportal.mapa.callDibujaObjetos();
                });
            } else if (o.tipo == "queryMinZ") {
                let query = o.query;
                let p = query.variable.code.indexOf(".");
                //let origen = window.geoportal.getOrigen(query.variable.code.substr(0,p));
                this.mensajes.addOrigen(query.variable.code.substr(0,p));
                let {t0, t1, desc} = window.minz.normalizaTiempo(query.temporalidad, window.geoportal.tiempo);
                window.minz.query(query, t0, t1)
                    .then(valor => {
                        let v = {atributos:{"Período":desc}};
                        if (valor === null || valor === undefined) {
                            this.mensajes.addError(query.variable.name + ": Sin Datos para el período");
                        } else {
                            v.value = valor;
                        }
                        this.valoresObservados[i] = v;
                        window.geoportal.mapa.callDibujaObjetos();
                    })
                    .catch(err => {
                        this.valoresObservados[i] = "Error: " + err;
                        this.mensajes.addError(query.variable.name + ": " + err.toString());
                        window.geoportal.mapa.callDibujaObjetos();
                    })
            }
        });
    }
}

class Punto extends ObjetoGeoportal {    
    constructor(puntoMapa, nombre, config, id) {
        if (!nombre) {
            if (!Punto.siguienteNumeroPunto) Punto.siguienteNumeroPunto = 1;
            nombre = "Punto " + Punto.siguienteNumeroPunto++
        }
        let defaultConfig = {
            nombre:nombre,
            movible:true, iconoEnMapa:null, nombreEditable:true
        }        
        let initialConfig = $.extend({}, defaultConfig, config?config:{});
        super(initialConfig, id?id:uuidv4());
        
        /*
        this.configAnalisis.analizador = "serie-tiempo";
        this.configAnalisis.analizadores = {
            "serie-tiempo":{
                variable:"gfs4.TMP_2M",
                nivelVariable:0,
                tiempo:{tipo:"relativo", from:-2, to:4}
            }
        }
        */

        this.tipo = "punto";
        this.lng = puntoMapa.lng;
        this.lat = puntoMapa.lat;
        this.movible = initialConfig.movible;
        this.iconoEnMapa = initialConfig.iconoEnMapa;
    }
    editoPadre() {
        let p = this.nombre.indexOf("-");
        if (p > 0) {
            this.nombre = this.objetoPadre.nombre + "-" + this.nombre.substr(p+1);
        }
    }
    describe() {return this.nombre}
    getCentroide() {return {lat:this.lat, lng:this.lng}}

    dibuja(konvaLayer, konvaLayerEfectos) {
        let map = window.geoportal.mapa.map;
        let point = map.latLngToContainerPoint([this.lat, this.lng]);
        this.selectedCircle = new Konva.Circle({
            x: point.x,
            y: point.y,
            radius: 2,
            stroke: 'white',
            strokeWidth: 2,
            opacity : 0
        });
        konvaLayerEfectos.add(this.selectedCircle);

        let colorObserva;
        if (this.capa.escalaColorear) {
            let v = this.capa.valoresColorear[this.id];
            if (v !== undefined) colorObserva = this.capa.escalaColorear.getColor(v);
        }
        if (colorObserva) {
            let circuloObserva = new Konva.Circle({
                x: point.x,
                y: point.y,
                radius: 17,
                fill: colorObserva,
                stroke: 'white',
                strokeWidth: 1,
                opacity : this.capa.opacidad / 100
            });
            konvaLayer.add(circuloObserva);
        }
        if (this.iconoEnMapa) { 
            let htmlImage = window.geoportal.getImagen(this.iconoEnMapa, 12, 12, _ => window.geoportal.mapa.callDibujaObjetos(300));           
            let img = new Konva.Image({
                x:point.x - 11, y: point.y - 11,
                image:htmlImage,
                width:21, height:21,
                opacity : this.capa.opacidad / 100
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
                opacity : this.capa.opacidad / 100,
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
            if (!this.selectedCircle) {
                console.error("check animation sin selectedCircle .. agendando");
                setTimeout(_ => this.checkAnimation(), 300);
                return;
            }           
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
    //getRutaPanelConfiguracion() {return "main/config-objetos/PConfigPunto"}
    getIcono() {return this.iconoEnMapa || "img/iconos/punto.svg"}
    
    isVisible(limites) {
        if (!limites) limites = window.geoportal.mapa.getLimites();
        return this.lat >= limites.lat0 && this.lat <= limites.lat1 && this.lng >= limites.lng0 && this.lng <= limites.lng1;
        //return window.geoportal.mapa.map.getBounds().contains(L.latLng(this.lat, this.lng));
    }
    aseguraVisible() {
        if (this.isVisible()) return;
        setTimeout(_ => window.geoportal.mapa.setCenter(this.lat, this.lng), 200);        
    }

}

class Area extends ObjetoGeoportal {    
    constructor(p1, p2, nombre, config, id) {
        if (!nombre) {
            if (!Area.siguienteNumeroArea) Area.siguienteNumeroArea = 1;
            nombre = "Área " + Area.siguienteNumeroArea++
        }
        let defaultConfig = {
            nombre:nombre,            
            movible:true,
            analizadorDefault:{
                analizador:"rect-area-3d",
                config:{                    
                    variable:"fixed.BATIMETRIA_2019",
                    nivelVariable:0,
                    escalarLngLat:true,
                    escalarZ:true, factorEscalaZ:10,
                    escala:{
                        dinamica:true,
                        nombre:"Agua -> Tierra"
                    }                    
                }
            }
        }
        let initialConfig = $.extend({}, defaultConfig, config?config:{});
        super(initialConfig, id?id:uuidv4());  
        /*      
        this.configAnalisis = {
            analizador:"rect-area-3d",
            height:300, width:260,
            analizadores:{
                "rect-area-3d":{
                    variable:"fixed.BATIMETRIA_2019",
                    nivelVariable:0,
                    escalarLngLat:true,
                    escalarZ:false, factorEscalaZ:10,
                    escala:{
                        dinamica:true,
                        nombre:"Agua -> Tierra"
                    }
                }
            }
        };
        */
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
        this.objetos.forEach(o => {
            o.objetoPadre = this
        });

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
    getCentroide() {return {lat:(this.lat0 + this.lat1) / 2, lng:(this.lng0 + this.lng1) / 2}}
    describe() {return this.nombre}
    getIcono() {return "img/iconos/area.svg"}
    getItems() {
        let items = this.objetos.map(o => ({
            tipo:"objeto",
            codigo:o.id,
            nombre:o.nombre,
            icono:o.iconoEnMapa?o.iconoEnMapa:o.getIcono(),
            urlIcono:o.iconoEnMapa?o.iconoEnMapa:o.getIcono(),
            activable:false,
            eliminable:false,
            item:o,
            items:o.getItems(),
            capa:this.capa
        }));
        return items;
    }
    get capa() {return this._capa}
    set capa(c) {
        this._capa = c;
        this.objetos.forEach(o => o.capa = c)
    }
    dibuja(konvaLayer, konvaLayerEfectos) {
        let colorObserva;
        if (this.capa.escalaColorear) {
            let v = this.capa.valoresColorear[this.id];
            if (v !== undefined) colorObserva = this.capa.escalaColorear.getColor(v);
        }
        let map = geoportal.mapa.map;
        let p0 = map.latLngToContainerPoint([this.lat0, this.lng0]);
        let p1 = map.latLngToContainerPoint([this.lat1, this.lng1]);
        let poly = new Konva.Line({
            points: [p0.x, p0.y, p1.x, p0.y, p1.x, p1.y, p0.x, p1.y],
            fill: colorObserva?colorObserva:'rgba(0,0,0,0.05)',
            stroke: this.seleccionado?"blue":'black',
            strokeWidth: this.seleccionado?2:1,
            closed: true,
            draggable:this.movible,
            shadowOffsetX : 5,
            shadowOffsetY : 5,
            shadowBlur : 10,
            opacity: this.capa.opacidad / 100
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
        super.cambioTiempo();
        this.objetos.forEach(o => o.cambioTiempo())
    }
    movio() {
        super.movio();
        this.objetos.forEach(o => {
            o.movio();
            window.geoportal.objetoMovido(o);
        })
    }
    movioHijo(hijo) {
        hijo.movio();
        window.geoportal.objetoMovido(hijo);
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
            window.geoportal.objetoMovido(this.objetos[1]);
            window.geoportal.objetoMovido(this.objetos[2]);
        } else if (idx == 1) {  // ne
            this.objetos[0].lat = hijo.lat;
            this.objetos[3].lng = hijo.lng;
            this.objetos[0].movio();
            this.objetos[3].movio();
            window.geoportal.objetoMovido(this.objetos[0]);
            window.geoportal.objetoMovido(this.objetos[3]);
        } else if (idx == 2) {  // sw
            this.objetos[0].lng = hijo.lng;
            this.objetos[3].lat = hijo.lat;
            this.objetos[0].movio();
            this.objetos[3].movio();
            window.geoportal.objetoMovido(this.objetos[0]);
            window.geoportal.objetoMovido(this.objetos[3]);
        } else if (idx == 3) {  // se
            this.objetos[1].lng = hijo.lng;
            this.objetos[2].lat = hijo.lat;
            this.objetos[1].movio();
            this.objetos[2].movio();
            window.geoportal.objetoMovido(this.objetos[1]);
            window.geoportal.objetoMovido(this.objetos[2]);
        }
        window.geoportal.mapa.movioObjeto(this);
        super.movio();
    }
    isVisible(limites) {
        if (!limites) limites = window.geoportal.mapa.getLimites();
        return this.lat0 <= limites.lat1 && this.lat1 >= limites.lat0 && this.lng0 <= limites.lng1 && this.lng1 >= limites.lng0;
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

class Poligonos extends ObjetoGeoportal {    
    constructor(feature, capa, estilo) {
        let nombre = feature.properties.nombre || "Polígonos";
        let id = feature.properties.id;
        let defaultConfig = {
            nombre:nombre,            
            movible:false
        }
        super(defaultConfig, id?id:uuidv4());
        this._capa = capa;
        this.estilo = estilo;
        this.properties = feature.properties;
        this.tipo = "poligonos";
        this.poligonos = [];
        this.areas = [];
        this.minLat = this.maxLat = this.minLng = this.maxLng = undefined;
        let c = turf.centroid(feature);
        this.centroide = {lat:c.geometry.coordinates[1], lng:c.geometry.coordinates[0]};
        this.poligonos = [];
        this.agregaCoordenadas(feature.geometry.coordinates);
    }
    getCentroide() {return this.centroide}
    getCodigoDimension() {return this.properties._codigoDimension}

    agregaCoordenadas(coordinates) {
        if (!coordinates.length) {
            console.error("Arreglo vacío en coordenadas");
            return;
        }
        if (!Array.isArray(coordinates[0])) {
            console.error("Elemento 0 no es array");
            return;
        }
        // Es poligono si los elementos son arreglos de dos numeros cada uno
        let esPoligono = (coordinates[0].length == 2 && !isNaN(coordinates[0][0]))
        if (esPoligono) {
            if (coordinates.length >= 4) {
                let pol = [], areaPolCoords = [[]];            
                coordinates.forEach(c => {
                    let lat = c[1], lng = c[0];
                    if (this.minLat === undefined || lat < this.minLat) this.minLat = lat;
                    if (this.maxLat === undefined || lat > this.maxLat) this.maxLat = lat;
                    if (this.minLng === undefined || lng < this.minLng) this.minLng = lng;
                    if (this.maxLng === undefined || lng > this.maxLng) this.maxLng = lng;
                    pol.push({lat:lat, lng:lng})
                    areaPolCoords[0].push([lat, lng]);
                });
                this.poligonos.push(pol);
                let area = 10000;
                try {
                    area = turf.area(turf.polygon(areaPolCoords));
                } catch(error) {
                    console.error(error);
                }
                this.areas.push(area);
            } else {
                console.warn("Se descarta poligono por tener menos de 4 coordenadas");
            }
        } else {
            coordinates.forEach(c => this.agregaCoordenadas(c));
        }
    }

    describe() {return this.nombre}
    getIcono() {return "img/iconos/poligono.svg"}
    get capa() {return this._capa}
    set capa(c) {this._capa = c;}
    dibuja(konvaLayer, konvaLayerEfectos) {   
        const limitesAreas = [undefined, undefined, undefined, 2000000, 1500000, 1000000, 600000, 200000, 100000, 5000, 1000, 50, 0];        
        let map = geoportal.mapa.map;
        let zoom = map.getZoom();
        let limiteArea = zoom >= 12?0:limitesAreas[zoom];
        let colorObserva;
        if (this.capa.escalaColorear) {
            let v = this.capa.valoresColorear[this.id];
            if (v !== undefined) colorObserva = this.capa.escalaColorear.getColor(v);
        }
        this.konvaObjects = [];
        //let nPintados = 0;
        for (let i=0; i<this.poligonos.length; i++) {
            if (this.areas[i] < limiteArea) continue;
            //nPintados++;
            let pol = this.poligonos[i];
            let points = pol.reduce((lista, puntoMapa) => {
                let p = map.latLngToContainerPoint([puntoMapa.lat, puntoMapa.lng]);
                lista.push(p.x, p.y);
                return lista;
            },[]);
            let opacidadBase = this.estilo.opacity === undefined?1:this.estilo.opacity;
            let poly = new Konva.Line({
                points: points,
                fill: colorObserva?colorObserva:this.estilo.fill,
                stroke: this.seleccionado?"blue":this.estilo.stroke,
                strokeWidth: this.estilo.strokeWidth,
                closed: true,
                opacity : this.capa.opacidad / 100 * opacidadBase
            });
            konvaLayer.add(poly);
            let polyBorder = new Konva.Line({
                points: points,
                stroke: "#021ebd",
                strokeWidth: this.estilo.strokeWidth + 1,
                closed: true,
                opacity : 0
            });
            poly.on('mouseenter', _ => this.handleMouseEnter(konvaLayerEfectos));
            poly.on('mouseout', _ => this.handleMouseExit(konvaLayerEfectos));
            poly.on("mousedown", e => window.geoportal.mapa.ignoreNextClick = true);  
            poly.on("mouseup", e => window.geoportal.mapa.seleccionaObjeto(this));            
            konvaLayerEfectos.add(polyBorder);
            this.konvaObjects.push(polyBorder);
        }
        //console.log(this.nombre + " pinta:" + nPintados + " / " + this.poligonos.length + " con zoom " + zoom);
    }

    handleMouseEnter(konvaLayer) {
        this.konvaObjects.forEach(o => {
            o.setOpacity(1);
        });
        konvaLayer.draw();
        let html = "<div class='tooltip-titulo'>" + this.properties._titulo + "</div>";
        let p = window.geoportal.mapa.map.latLngToContainerPoint([this.centroide.lat, this.centroide.lng]);
        window.geoportal.showTooltip(p.x + 12, p.y + 10, html);
    }
    handleMouseExit(konvaLayer) {
        window.geoportal.hideTooltip();
        this.konvaObjects.forEach(o => {
            o.setOpacity(0);
        });
        konvaLayer.draw();
    }

    destruye() {
    }
    isVisible(limites) {
        if (!limites) limites = window.geoportal.mapa.getLimites();
        return this.minLat <= limites.lat1 && this.maxLat >= limites.lat0 && this.minLng <= limites.lng1 && this.maxLng >= limites.lng0;
    }
    isCompletamenteVisible(limites) {
        if (!limites) limites = window.geoportal.mapa.getLimites();
        return this.minLat >= limites.lat0 && this.maxLat <= limites.lat1 && this.minLng >= limites.lng0 && this.maxLng <= limites.lng1;
    }
    aseguraVisible() {
        if (this.isCompletamenteVisible()) return;
        setTimeout(_ => {
            let dLat = (this.maxLat - this.minLat) / 5;
            let dLng = (this.maxLng - this.minLng) / 5;
            window.geoportal.mapa.map.fitBounds(L.latLngBounds(
                L.latLng(this.minLat - dLat * 2, this.minLng - dLng),
                L.latLng(this.maxLat + dLat, this.maxLng - dLng)
            ))
        }, 300);        
    }
}

class Lineas extends ObjetoGeoportal {    
    constructor(feature, capa, estilo) {
        let nombre = feature.properties.nombre || "Líneas";
        let id = feature.properties.id;
        let defaultConfig = {
            nombre:nombre,            
            movible:false
        }
        super(defaultConfig, id?id:uuidv4());
        this._capa = capa;
        this.estilo = estilo;
        this.properties = feature.properties;
        this.tipo = "lineas";
        this.lineas = [];
        this.minLat = this.maxLat = this.minLng = this.maxLng = undefined;
        let c = turf.centroid(feature);
        this.centroide = {lat:c.geometry.coordinates[1], lng:c.geometry.coordinates[0]};
        this.lineas = [];
        this.agregaCoordenadas(feature.geometry.coordinates);
    }
    getCentroide() {return this.centroide}
    getCodigoDimension() {return this.properties._codigoDimension}

    agregaCoordenadas(coordinates) {
        if (!coordinates.length) {
            console.error("Arreglo vacío en coordenadas");
            return;
        }
        if (!Array.isArray(coordinates[0])) {
            console.error("Elemento 0 no es array");
            return;
        }
        // Es linea si los elementos son arreglos de dos numeros cada uno
        let esLinea = (coordinates[0].length == 2 && !isNaN(coordinates[0][0]))
        if (esLinea) {
            if (coordinates.length >= 2) {
                let linea = [];
                coordinates.forEach(c => {
                    let lat = c[1], lng = c[0];
                    if (this.minLat === undefined || lat < this.minLat) this.minLat = lat;
                    if (this.maxLat === undefined || lat > this.maxLat) this.maxLat = lat;
                    if (this.minLng === undefined || lng < this.minLng) this.minLng = lng;
                    if (this.maxLng === undefined || lng > this.maxLng) this.maxLng = lng;
                    linea.push({lat:lat, lng:lng})
                });
                this.lineas.push(linea);
            } else {
                console.warn("Se descarta linea por tener menos de 2 coordenadas");
            }
        } else {
            coordinates.forEach(c => this.agregaCoordenadas(c));
        }
    }

    describe() {return this.nombre}
    getIcono() {return "img/iconos/lineas.svg"}
    get capa() {return this._capa}
    set capa(c) {this._capa = c;}
    dibuja(konvaLayer, konvaLayerEfectos) {   
        let map = geoportal.mapa.map;
        this.konvaObjects = [];
        for (let i=0; i<this.lineas.length; i++) {
            let linea = this.lineas[i];            
            let points = linea.reduce((lista, puntoMapa) => {
                let p = map.latLngToContainerPoint([puntoMapa.lat, puntoMapa.lng]);
                lista.push(p.x, p.y);
                return lista;
            },[]);
            let opacidadBase = this.estilo.opacity === undefined?1:this.estilo.opacity;
            let kLinea = new Konva.Line({
                points: points,
                stroke: this.seleccionado?"red":this.estilo.stroke,
                strokeWidth: this.seleccionado?2.5:this.estilo.strokeWidth,
                closed: false,
                opacity : this.capa.opacidad / 100 * opacidadBase
            });
            kLinea.on('mouseenter', _ => this.handleMouseEnter(konvaLayer));
            kLinea.on('mouseout', _ => this.handleMouseExit(konvaLayer));
            konvaLayer.add(kLinea);
            this.konvaObjects.push(kLinea);
        }
    }

    handleMouseEnter(konvaLayer) {
        this.konvaObjects.forEach(o => {
            o.setStroke("#f2ef29");
            o.setStrokeWidth(2.5);
        });
        konvaLayer.draw();
        let html = "<div class='tooltip-titulo'>" + this.properties._titulo + "</div>";
        let p = window.geoportal.mapa.map.latLngToContainerPoint([this.centroide.lat, this.centroide.lng]);
        window.geoportal.showTooltip(p.x + 12, p.y + 10, html);
    }
    handleMouseExit(konvaLayer) {
        window.geoportal.hideTooltip();
        this.konvaObjects.forEach(o => {
            o.setStroke(this.seleccionado?"red":this.estilo.stroke);
            o.setStrokeWidth(this.seleccionado?2.5:this.estilo.strokeWidth);
        });
        konvaLayer.draw();
    }

    destruye() {
    }
    isVisible(limites) {
        if (!limites) limites = window.geoportal.mapa.getLimites();
        return this.minLat <= limites.lat1 && this.maxLat >= limites.lat0 && this.minLng <= limites.lng1 && this.maxLng >= limites.lng0;
    }
    aseguraVisible() {
        if (this.isVisible()) return;        
        setTimeout(_ => {
            let dLat = (this.maxLat - this.minLat) / 5;
            let dLng = (this.maxLng - this.minLng) / 5;
            window.geoportal.mapa.map.fitBounds(L.latLngBounds(
                L.latLng(this.minLat - dLat * 2, this.minLng - dLng),
                L.latLng(this.maxLat + dLat, this.maxLng - dLng)
            ))
        }, 300);
    }
}

/*
// Analizadores
class AnalizadorObjeto {
    static aplicaAObjeto(o) {
        console.error("aplicaAObjeto no sobreescrito en Analizador");
        return false
    }

    constructor(codigo, objeto, config) {
        this.id = uuidv4();
        this.codigo = codigo;
        this.objeto = objeto;
        this._config = config;
        this.mensajes = new MensajesGeoportal(this);
    }

    get config() {return this.objeto.configAnalisis.analizadores[this.codigo]}
    
    getPanelesPropiedades() {
        console.error("getPanelesPropiedades no sobreescrito en Analizador");
        return [];
    }
    getRutaPanelAnalisis() {
        console.error("getRutaPanelAnalisis no sobreescrito en Analizador");
        return "common/Empty";
    }
}
*/