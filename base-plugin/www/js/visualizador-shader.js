class VisualizadorShader extends VisualizadorCapa {
    constructor(capa, config) {
        let defaultConfig = {            
            escala:{
                dinamica:true,
                nombre:"Magma - MatplotLib",
                unidad:capa.unidad || "s/u"
            }
        }
        let conf = $.extend(defaultConfig, config);
        super("shader", capa, conf); 
        this.configPanel = {
            flotante:false,
            height:280, width:300,
            configSubPaneles:{}
        }       
    }
    static aplicaACapa(capa) {
        return capa.tipo == "raster" && capa.formatos.matrizRectangular;
    }

    get escala() {return this.config.escala}

    async crea() {
        let div = document.createElement("DIV");
        this.canvas = document.createElement("canvas");
        this.canvas.style["backgroun-color"] = "blue";
        this.canvas.style.position = "absolute";
        div.appendChild(this.canvas);
        this.panelShader = window.geoportal.mapa.creaPanelMapa(this.capa, "particulas" + parseInt(Math.random() * 10000), 5);
        this.panelShader.style.opacity = this.capa.config.opacidad / 100;
        this.capa.registraPanelMapa(this.panelShader);

        this.lyShader = new L.customLayer({
            container:div,
            minZoom:0, maxZoom:18, opacity:1, visible:true, zIndex:1500,
            pane:this.panelShader.id
        }).addTo(window.geoportal.mapa.map);

        this.lyShader.on("layer-render", _ => {
        });

        // Vertex Shader
        this.gl = this.canvas.getContext('webgl', {antialiasing: false});
        const gl = this.gl;
        this.vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(this.vertexShader, `
            attribute vec4 a_position;
            attribute vec4 aVertexColor;
            varying lowp vec4 vColor;
            void main() {
                gl_Position = a_position;
                vColor = aVertexColor;
            }
        `);
        gl.compileShader(this.vertexShader);
        if (!gl.getShaderParameter(this.vertexShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(this.vertexShader));
            gl.deleteShader(this.vertexShader);
            this.vertexShader = null;
            throw "Error compilando vertexShader";
        }

        // Fragment Shader
        this.fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(this.fragmentShader, `
            varying lowp vec4 vColor;            
            void main() {
                gl_FragColor = vColor;
            }
        `);
        gl.compileShader(this.fragmentShader);
        if (!gl.getShaderParameter(this.fragmentShader, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(this.fragmentShader));
            gl.deleteShader(this.fragmentShader);
            this.fragmentShader = null;
            throw "Error compilando fragmentShader";
        }

        // Program
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vertexShader);
        gl.attachShader(this.program, this.fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
            gl.deleteProgram(this.program);
            this.program = null;
            throw "Error creando program";
        }

        // Attributes Locations
        this.locations = {
            position:gl.getAttribLocation(this.program, "a_position"),
            vertexColor: gl.getAttribLocation(this.program, 'aVertexColor')
        }

        // Buffers
        this.buffers = {
            position:gl.createBuffer(),
            indexes:gl.createBuffer(),
            color:gl.createBuffer()
        }

    }
    async destruye() {
        const gl = this.canvas.getContext('webgl', {antialiasing: false});
        if (this.vertexShader) gl.deleteShader(this.vertexShader);
        if (this.fragmentShader) gl.deleteShader(this.fragmentShader);
        if (this.program) gl.deleteProgram(this.program);
        if (this.buffers) {
            gl.deleteBuffer(this.buffers.position);
            gl.deleteBuffer(this.buffers.indexes);
            gl.deleteBuffer(this.buffers.color);
        }
        window.geoportal.mapa.eliminaCapaMapa(this.lyShader);    
    }
    refresca() {
        super.refresca();
        this.startWorking(); 
        //this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.capa.resuelveConsulta("matrizRectangular", {}, async (err, data) => {
            if (err) {                
                this.finishWorking();
                this.mensajes.addError(err.toString());
                console.error(err);
                return;
            }
            this.mensajes.parse(data);
            this.data = data;
            if (data.min !== undefined && data.max !== undefined) {
                if (this.config.escala.min === undefined || this.config.escala.dinamica) this.config.escala.min = data.min;
                if (this.config.escala.max === undefined || this.config.escala.dinamica) this.config.escala.max = data.max;                
            }
            await this.repinta(data);
            this.finishWorking();
        })
    }    

    async repinta() {
        if (!this.program) return;
        let data = this.data;
        //console.log("data", data);

        let baseURL = window.location.origin + window.location.pathname;
        let escala = await EscalaGeoportal.porNombre(this.config.escala.nombre, baseURL);
        escala.dinamica = this.config.escala.dinamica;
        escala.actualizaLimites(this.config.escala.min, this.config.escala.max);
        
        let bounds = window.geoportal.mapa.map.getBounds();
        let p0 = window.geoportal.mapa.map.latLngToContainerPoint([bounds.getSouth(), bounds.getWest()]);
        let p1 = window.geoportal.mapa.map.latLngToContainerPoint([bounds.getNorth(), bounds.getEast()]);

        this.canvas.style.left = "0";
        this.canvas.style.top = "0";
        this.canvas.style.width = (p1.x - p0.x + 1) + "px";
        this.canvas.style.height = (p0.y - p1.y + 1) + "px";

        const pxRatio = this.config.retina?2:1;
        this.canvas.width = this.canvas.clientWidth * pxRatio;
        this.canvas.height = this.canvas.clientHeight * pxRatio;

        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        gl.depthMask(false);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        let canvasColores = document.createElement("CANVAS");
        canvasColores.width = 5; canvasColores.height = 5;
        let ctxColores = canvasColores.getContext("2d");
        let vertexPositions = [], indexes = [], vertexColors = [];
        let indicePunto = {};  // {iRow-iCol:int}
        for (let iRow=data.nrows-1, lat=data.lat1; iRow>=0; iRow--, lat -= data.dy) {
            for(let iCol=0,lng = data.lng0; iCol<data.ncols; iCol++, lng += data.dx) {
                let key = iRow + "-" + iCol;
                let v = data.rows[iRow][iCol];
                if (v !== null) {
                    let p = window.geoportal.mapa.map.latLngToContainerPoint([lat, lng]);
                    let x = (p.x - p0.x) / (p1.x - p0.x) * 2 - 1;
                    let y = (p0.y - p.y) / (p0.y - p1.y) * 2 - 1;
                    indicePunto[key] = vertexPositions.length / 2;
                    vertexPositions.push(x, y);
                    ctxColores.clearRect(0, 0, 5, 5);
                    let color = escala.getColor(v);
                    ctxColores.fillStyle = color;
                    ctxColores.fillRect(0, 0, 5, 5);
                    let pix = ctxColores.getImageData(0, 0, 1, 1).data;
                    let [r,g,b,a] = pix;
                    vertexColors.push(r/255, g/255, b/255, a/255);
                }
                if (iRow < (data.nrows - 1) && iCol > 0) {
                    let keySE = key, idxSE = indicePunto[keySE], existeSE = idxSE !== undefined;
                    let keySW = iRow + "-" + (iCol - 1), idxSW = indicePunto[keySW], existeSW = idxSW !== undefined;
                    let keyNW = (iRow + 1) + "-" + (iCol - 1), idxNW = indicePunto[keyNW], existeNW = idxNW !== undefined;
                    let keyNE = (iRow + 1) + "-" + iCol, idxNE = indicePunto[keyNE], existeNE = idxNE !== undefined;
                    if (existeSE) {
                        if (existeSW) {
                            if (existeNW) {
                                indexes.push(idxSE, idxSW, idxNW);
                                if (existeNE) {
                                    indexes.push(idxSE, idxNW, idxNE);
                                }
                            } else { // !existeNW
                                if (existeNE) {
                                    indexes.push(idxSE, idxSW, idxNE);
                                }
                            }
                        } else {  // !existeSW
                            if (existeNW) {
                                if (existeNE) {
                                    indexes.push(idxSE, idxNW, idxNE);
                                }
                            }
                        }
                    } else {  // !existeSE
                        if (existeSW) {
                            if (existeNW) {
                                if (existeNE) {
                                    indexes.push(idxSW, idxNW, idxNE);
                                }
                            }
                        }
                    }
                }
            }
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositions), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.locations.position);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.color);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexColors), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.locations.vertexColor);
        gl.vertexAttribPointer(this.locations.vertexColor, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexes);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexes), gl.STATIC_DRAW);

        gl.useProgram(this.program);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indexes);
        gl.drawElements(gl.TRIANGLES, indexes.length, gl.UNSIGNED_SHORT, 0);
    }

    cambioOpacidadCapa(opacidad) {
        this.panelShader.style.opacity = this.capa.opacidad / 100;
    }

    /* Panel de Propiedades */
    getPanelesPropiedades() {
        let paneles = [{
            codigo:"escala",
            path:"base/propiedades/PropEscalaVisualizador"
        }];
        return paneles;
    }

    getTituloPanel() {
        return this.capa.nombre + " / Shader";
    }
}

window.geoportal.capas.registraVisualizador("base", "shader", VisualizadorShader, "Shader", "base/img/particulas.svg");
